-- CreateIndex
CREATE INDEX "Issue_importId_idx" ON "Issue"("importId");

-- CreateIndex
CREATE INDEX "Issue_organizationId_idx" ON "Issue"("organizationId");

-- CreateIndex
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");

-- CreateIndex
CREATE INDEX "Issue_importId_severity_idx" ON "Issue"("importId", "severity");

-- CreateIndex
CREATE INDEX "Issue_host_idx" ON "Issue"("host");

-- CreateIndex
CREATE INDEX "Issue_matchedDomain_idx" ON "Issue"("matchedDomain");
