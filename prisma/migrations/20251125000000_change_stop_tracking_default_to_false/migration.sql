-- ChangeStopTrackingDefaultToFalse
-- This migration changes the default value for stopTrackingOnUnfocus from true to false
-- Note: In SQLite, we cannot directly alter column defaults, but the schema change in schema.prisma
-- will ensure new records get the correct default.
-- 
-- Optionally, we also update existing records to match the new default behavior.
-- Comment out the line below if you want to preserve existing user preferences:
UPDATE NotificationPreferences SET stopTrackingOnUnfocus = 0;

