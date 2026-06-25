-- CreateTable
CREATE TABLE "FacultyDailyStat" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "totalIssues" INTEGER NOT NULL,
    "highCount" INTEGER NOT NULL,
    "mediumCount" INTEGER NOT NULL,
    "lowCount" INTEGER NOT NULL,
    "infoCount" INTEGER NOT NULL,
    "securityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacultyDailyStat_organizationId_idx" ON "FacultyDailyStat"("organizationId");

-- CreateIndex
CREATE INDEX "FacultyDailyStat_date_idx" ON "FacultyDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyDailyStat_date_organizationId_key" ON "FacultyDailyStat"("date", "organizationId");

-- AddForeignKey
ALTER TABLE "FacultyDailyStat" ADD CONSTRAINT "FacultyDailyStat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
