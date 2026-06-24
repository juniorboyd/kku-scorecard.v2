-- Merge duplicate organizations (case-insensitive) before enforcing uniqueness.
-- For each set of same-named orgs, keep the lowest id, reassign its Issues and
-- Domains to that id, then delete the duplicates. No-op when there are none.

-- Move Issues from duplicate orgs to the canonical (lowest-id) org.
WITH dup AS (
  SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "Organization"
)
UPDATE "Issue" i
SET "organizationId" = d.keep_id
FROM dup d
WHERE i."organizationId" = d.id AND d.id <> d.keep_id;

-- Move Domains from duplicate orgs to the canonical org.
WITH dup AS (
  SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "Organization"
)
UPDATE "Domain" dm
SET "organizationId" = d.keep_id
FROM dup d
WHERE dm."organizationId" = d.id AND d.id <> d.keep_id;

-- Delete the now-empty duplicate orgs.
WITH dup AS (
  SELECT id, min(id) OVER (PARTITION BY lower(name)) AS keep_id FROM "Organization"
)
DELETE FROM "Organization" o
USING dup d
WHERE o.id = d.id AND d.id <> d.keep_id;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");
