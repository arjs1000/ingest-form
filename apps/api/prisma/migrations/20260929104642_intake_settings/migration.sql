-- CreateTable
CREATE TABLE "IntakeSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "acceptPhotos" BOOLEAN NOT NULL,
    "maxFileSizeMb" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeSettings_pkey" PRIMARY KEY ("id")
);
