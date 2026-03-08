-- AlterTable
ALTER TABLE "User" ADD COLUMN     "brandIndustry" TEXT,
ADD COLUMN     "brandKeywords" TEXT[],
ADD COLUMN     "brandTone" TEXT,
ADD COLUMN     "brandVoiceExample" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
