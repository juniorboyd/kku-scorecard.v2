-- Stores the failure reason for an import so the status endpoint can surface it.
ALTER TABLE "Import" ADD COLUMN "errorMessage" TEXT;
