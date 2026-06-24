-- Generic key/value settings store. Sensitive values are stored AES-256-GCM encrypted.
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
