-- Add school_id to program_applications for easier querying
ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(school_id);

-- Backfill school_id from programs table
UPDATE program_applications pa
SET school_id = p.school_id
FROM programs p
WHERE pa.program_id = p.program_id
  AND pa.school_id IS NULL; -- only update if not already set

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_program_applications_school_id 
  ON program_applications(school_id);
