-- CreateEnum
CREATE TYPE "RoundRobinRescheduleAction" AS ENUM ('RESCHEDULE_WITH_ANY_HOST', 'RESCHEDULE_WITH_SAME_HOST', 'ATTENDEE_DECIDES');

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN "roundRobinRescheduleAction" "RoundRobinRescheduleAction" NOT NULL DEFAULT 'RESCHEDULE_WITH_ANY_HOST';

-- Backfill: sync new column from existing boolean
UPDATE "EventType"
SET "roundRobinRescheduleAction" = 'RESCHEDULE_WITH_SAME_HOST'
WHERE "rescheduleWithSameRoundRobinHost" = true;
