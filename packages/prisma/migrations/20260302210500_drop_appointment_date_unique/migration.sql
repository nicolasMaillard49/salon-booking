-- Remove the legacy unique index created before time slots existed.
DROP INDEX IF EXISTS "Appointment_date_key";

-- Some databases may have the old uniqueness as a table constraint instead.
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_date_key";

-- Ensure the active uniqueness matches one booking per date/timeSlot pair.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Appointment_date_timeSlot_key'
  ) THEN
    ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_date_timeSlot_key" UNIQUE ("date", "timeSlot");
  END IF;
END $$;
