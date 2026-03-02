-- AlterTable: add timeSlot with default for existing rows
ALTER TABLE "Appointment" ADD COLUMN "timeSlot" TEXT NOT NULL DEFAULT '12:00';

-- Drop old unique constraint on date only
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_date_key";

-- Create new unique constraint on date + timeSlot
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_date_timeSlot_key" UNIQUE ("date", "timeSlot");

-- Remove the default (schema says it's required, no default)
ALTER TABLE "Appointment" ALTER COLUMN "timeSlot" DROP DEFAULT;
