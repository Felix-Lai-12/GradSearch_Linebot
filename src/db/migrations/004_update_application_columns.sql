-- GradSearch Database Migration 004
-- Adjust program_applications table for multi-stage results

-- 1. Add new columns
ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS apply_start_date DATE;
ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS apply_end_date DATE;
ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS first_result_announce_date DATE;
ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS second_result_announce_date DATE;

-- 2. Migrate data from old 'deadline' column to 'apply_end_date' if applicable
UPDATE program_applications 
SET apply_end_date = deadline 
WHERE apply_end_date IS NULL AND deadline IS NOT NULL;

-- 3. Drop old 'deadline' column (after verification, for now we keep it or just comment out)
-- ALTER TABLE program_applications DROP COLUMN IF EXISTS deadline;
