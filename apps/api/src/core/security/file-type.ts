/*
 * Upload type detection from the file's first bytes. The client's Content-Type and file name are
 * never trusted: a renamed .exe still starts with "MZ", not "%PDF-".
 */

export type DetectedFileType = 'application/pdf' | 'image/jpeg' | 'image/png';

interface FileSignature {
  mimeType: DetectedFileType;
  magic: readonly number[];
}

const FILE_SIGNATURES: readonly FileSignature[] = [
  // "%PDF-"
  { mimeType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mimeType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((byte, index) => bytes[index] === byte);
}

/** The file's real type by magic bytes, or null when it is not a PDF, JPEG or PNG. */
export function detectFileType(bytes: Uint8Array): DetectedFileType | null {
  return FILE_SIGNATURES.find((signature) => startsWith(bytes, signature.magic))?.mimeType ?? null;
}
