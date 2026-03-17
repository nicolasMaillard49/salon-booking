-- Cleanup: Drop BlockedDate table if it exists from previous migrations
-- This ensures database schema matches current Prisma schema
DROP TABLE IF EXISTS "BlockedDate" CASCADE;
