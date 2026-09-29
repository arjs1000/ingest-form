-- CreateEnum
CREATE TYPE "DuplicateReason" AS ENUM ('same_reference', 'same_person_email', 'same_person_mobile');

-- AlterTable
ALTER TABLE "IngestSubmission" ADD COLUMN     "duplicateReason" "DuplicateReason";

-- CreateIndex
CREATE INDEX "Application_lastName_firstName_idx" ON "Application"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "IngestSubmission_duplicateOfId_idx" ON "IngestSubmission"("duplicateOfId");

-- Existing links were set by the reference rule; record that reason.
UPDATE "IngestSubmission" SET "duplicateReason" = 'same_reference' WHERE "duplicateOfId" IS NOT NULL;

-- duplicateOfId had no foreign key, so a manual DELETE could leave links pointing at a missing row.
-- Clear those before the constraint is added, or adding it fails.
UPDATE "IngestSubmission"
SET "duplicateOfId" = NULL, "duplicateReason" = NULL
WHERE "duplicateOfId" IS NOT NULL
  AND "duplicateOfId" NOT IN (SELECT "id" FROM "IngestSubmission");

-- AddForeignKey
ALTER TABLE "IngestSubmission" ADD CONSTRAINT "IngestSubmission_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "IngestSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
