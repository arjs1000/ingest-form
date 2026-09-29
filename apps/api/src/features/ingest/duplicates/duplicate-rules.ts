import { DUPLICATE_REASONS, type DuplicateReason } from '@ingest-form/shared';

/*
 * The one definition of "duplicate". Two submissions are duplicates when they share:
 *   1. the same application reference (same_reference), or
 *   2. the same first + last name AND the same email (same_person_email), or
 *   3. the same first + last name AND the same mobile (same_person_mobile).
 * Same name with a different email and a different mobile is NOT a duplicate: many people share
 * a name (John Smith). Person rules use saved applications, whose data is already normalised
 * (mobile in E.164, postcode formatted), so "07123 456789" and "+447123456789" match.
 * The Prisma query in prisma-application.repository.ts (findEarliestSamePerson) mirrors matchPerson.
 */

export interface DuplicatePerson {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
}

export interface NormalisedPerson {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
}

function normaliseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalisePerson(person: DuplicatePerson): NormalisedPerson {
  return {
    firstName: normaliseName(person.firstName),
    lastName: normaliseName(person.lastName),
    email: person.email.trim().toLowerCase(),
    mobileNumber: person.mobileNumber.trim(),
  };
}

/** Same person by rule 2 or 3, or null. Email is checked first because it is the stronger signal. */
export function matchPerson(a: DuplicatePerson, b: DuplicatePerson): 'same_person_email' | 'same_person_mobile' | null {
  const left = normalisePerson(a);
  const right = normalisePerson(b);
  if (left.firstName !== right.firstName || left.lastName !== right.lastName) return null;
  if (left.email === right.email) return 'same_person_email';
  if (left.mobileNumber === right.mobileNumber) return 'same_person_mobile';
  return null;
}

/** Strongest first, as ordered in DUPLICATE_REASONS. */
export function strongestReason(reasons: readonly DuplicateReason[]): DuplicateReason | null {
  return DUPLICATE_REASONS.find((reason) => reasons.includes(reason)) ?? null;
}

export interface DuplicateCandidate {
  id: string;
  receivedAt: Date;
  applicationReference: string | null;
  person: DuplicatePerson | null;
}

export interface CandidateGroup<T extends DuplicateCandidate> {
  members: T[];
  /** How each member matches the first (oldest) member; null for the first itself. */
  reasons: Map<string, DuplicateReason | null>;
  matchedOn: DuplicateReason[];
}

/** Why two candidates are linked, strongest reason first, or null when they are not duplicates. */
export function linkReason(a: DuplicateCandidate, b: DuplicateCandidate): DuplicateReason | null {
  if (a.applicationReference && a.applicationReference === b.applicationReference) return 'same_reference';
  return a.person && b.person ? matchPerson(a.person, b.person) : null;
}

/**
 * Groups candidates that are linked by any rule, transitively (A~B by email and B~C by mobile make
 * one group). Returns only groups with two or more members, oldest submission first.
 * O(n²) pairwise comparison: fine at proof-of-concept volumes; move to SQL before large datasets.
 */
export function groupDuplicates<T extends DuplicateCandidate>(candidates: readonly T[]): CandidateGroup<T>[] {
  const sorted = [...candidates].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime() || a.id.localeCompare(b.id));
  const parent = sorted.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root] ?? root;
    parent[index] = root;
    return root;
  };
  const links: [number, number, DuplicateReason][] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i];
      const b = sorted[j];
      if (!a || !b) continue;
      const reason = linkReason(a, b);
      if (!reason) continue;
      links.push([i, j, reason]);
      const rootA = find(i);
      const rootB = find(j);
      // Keep the oldest member as the root so it stays first in its group.
      if (rootA !== rootB) parent[Math.max(rootA, rootB)] = Math.min(rootA, rootB);
    }
  }

  const byRoot = new Map<number, number[]>();
  sorted.forEach((_, index) => {
    const root = find(index);
    byRoot.set(root, [...(byRoot.get(root) ?? []), index]);
  });

  const groups: CandidateGroup<T>[] = [];
  for (const [root, indexes] of byRoot) {
    if (indexes.length < 2) continue;
    const first = sorted[root];
    if (!first) continue;
    const members = indexes.flatMap((index) => (sorted[index] ? [sorted[index]] : []));
    const reasons = new Map<string, DuplicateReason | null>();
    const matched = new Set<DuplicateReason>();
    for (const member of members) {
      // Direct match with the first submission when there is one, else the member's strongest link in the group.
      const direct = member === first ? null : linkReason(first, member);
      const viaGroup = strongestReason(
        links
          .filter(([i, j]) => (sorted[i] === member || sorted[j] === member) && indexes.includes(i) && indexes.includes(j))
          .map(([, , reason]) => reason),
      );
      const reason = member === first ? null : (direct ?? viaGroup);
      reasons.set(member.id, reason);
      if (reason) matched.add(reason);
    }
    groups.push({ members, reasons, matchedOn: DUPLICATE_REASONS.filter((reason) => matched.has(reason)) });
  }
  return groups.sort((a, b) => (b.members.at(-1)?.receivedAt.getTime() ?? 0) - (a.members.at(-1)?.receivedAt.getTime() ?? 0));
}
