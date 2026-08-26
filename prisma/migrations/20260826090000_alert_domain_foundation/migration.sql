-- Alert already exists from the autonomous alert engine. This additive index
-- completes the v1.3 domain search contract without rewriting existing rows.
CREATE INDEX "Alert_category_source_createdAt_idx" ON "Alert"("category", "source", "createdAt");
