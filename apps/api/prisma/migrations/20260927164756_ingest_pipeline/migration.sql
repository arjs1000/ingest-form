-- CreateEnum
CREATE TYPE "SubmissionSource" AS ENUM ('api', 'ui');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('received', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "StepName" AS ENUM ('validate', 'normalise', 'geocode', 'transform', 'persist', 'notify');

-- CreateEnum
CREATE TYPE "StepRunStatus" AS ENUM ('success', 'warning', 'error', 'skipped');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'prefer-not-to-say');

-- CreateTable
CREATE TABLE "IngestProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestApiKey" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "label" TEXT,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "IngestApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestSubmission" (
    "id" TEXT NOT NULL,
    "source" "SubmissionSource" NOT NULL,
    "providerId" TEXT,
    "apiKeyId" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'received',
    "lastStep" "StepName",
    "failedStep" "StepName",
    "rawBody" TEXT NOT NULL,
    "applicationReference" TEXT,
    "sessionId" TEXT,
    "duplicateOfId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestStepRun" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "step" "StepName" NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" "StepRunStatus" NOT NULL,
    "output" JSONB,
    "issues" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestStepRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "applicationReference" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "phoneNumber" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT NOT NULL,
    "addressLine3" TEXT,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestProvider_name_key" ON "IngestProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngestApiKey_keyHash_key" ON "IngestApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "IngestApiKey_providerId_idx" ON "IngestApiKey"("providerId");

-- CreateIndex
CREATE INDEX "IngestSubmission_applicationReference_idx" ON "IngestSubmission"("applicationReference");

-- CreateIndex
CREATE INDEX "IngestSubmission_status_failedStep_idx" ON "IngestSubmission"("status", "failedStep");

-- CreateIndex
CREATE INDEX "IngestSubmission_receivedAt_idx" ON "IngestSubmission"("receivedAt");

-- CreateIndex
CREATE INDEX "IngestStepRun_submissionId_step_idx" ON "IngestStepRun"("submissionId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "Application_submissionId_key" ON "Application"("submissionId");

-- CreateIndex
CREATE INDEX "Application_applicationReference_idx" ON "Application"("applicationReference");

-- AddForeignKey
ALTER TABLE "IngestApiKey" ADD CONSTRAINT "IngestApiKey_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "IngestProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestSubmission" ADD CONSTRAINT "IngestSubmission_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "IngestProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestSubmission" ADD CONSTRAINT "IngestSubmission_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "IngestApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestStepRun" ADD CONSTRAINT "IngestStepRun_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "IngestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "IngestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
