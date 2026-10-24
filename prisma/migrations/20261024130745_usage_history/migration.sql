-- CreateTable
CREATE TABLE "daily_usage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "usage_based_reqs" INTEGER NOT NULL DEFAULT 0,
    "agent_requests" INTEGER NOT NULL DEFAULT 0,
    "most_used_model" TEXT,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "rule" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "baseline" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digest_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digest_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_usage_org_id_day_idx" ON "daily_usage"("org_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_org_id_person_id_day_key" ON "daily_usage"("org_id", "person_id", "day");

-- CreateIndex
CREATE INDEX "anomaly_events_org_id_day_idx" ON "anomaly_events"("org_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_events_person_id_day_rule_key" ON "anomaly_events"("person_id", "day", "rule");

-- CreateIndex
CREATE UNIQUE INDEX "digest_logs_org_id_week_start_key" ON "digest_logs"("org_id", "week_start");

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly_events" ADD CONSTRAINT "anomaly_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly_events" ADD CONSTRAINT "anomaly_events_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digest_logs" ADD CONSTRAINT "digest_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
