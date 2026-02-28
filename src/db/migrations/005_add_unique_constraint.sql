-- GradSearch Database Migration 005
-- Add unique constraint to program_applications for UPSERT support

-- 1. Remove any potential duplicates before adding constraint (optional but safer)
-- (In a real scenario, we might want to manually check, but for MVP we can just let it fail if duplicates exist or clean up)

-- 2. Add the unique constraint
ALTER TABLE program_applications 
ADD CONSTRAINT unique_program_admission 
UNIQUE (program_id, admission_type, admission_year);
