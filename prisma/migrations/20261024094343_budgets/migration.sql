-- CreateEnum
CREATE TYPE "BudgetMode" AS ENUM ('MONITOR', 'ENFORCE');

-- CreateEnum
CREATE TYPE "CapAction" AS ENUM ('ALERT', 'CAP');

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "manager_email" TEXT;

-- CreateTable
CREATE TABLE "spend_policies" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "default_amount_cents" DECIMAL(18,6) NOT NULL,
    "mode" "BudgetMode" NOT NULL DEFAULT 'MONITOR',
    "action_at_100" "CapAction" NOT NULL DEFAULT 'ALERT',
    "slack_webhook_enc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spend_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_budgets" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "amount_cents" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_alerts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "cycle_start" TIMESTAMP(3) NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spend_policies_org_id_key" ON "spend_policies"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_budgets_person_id_key" ON "person_budgets"("person_id");

-- CreateIndex
CREATE INDEX "person_budgets_org_id_idx" ON "person_budgets"("org_id");

-- CreateIndex
CREATE INDEX "budget_alerts_org_id_cycle_start_idx" ON "budget_alerts"("org_id", "cycle_start");

-- CreateIndex
CREATE UNIQUE INDEX "budget_alerts_person_id_cycle_start_level_key" ON "budget_alerts"("person_id", "cycle_start", "level");

-- AddForeignKey
ALTER TABLE "spend_policies" ADD CONSTRAINT "spend_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_budgets" ADD CONSTRAINT "person_budgets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_budgets" ADD CONSTRAINT "person_budgets_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
