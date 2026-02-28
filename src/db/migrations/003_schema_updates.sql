-- GradSearch Database Migration 003
-- Schema updates per PRD FR-1 ~ FR-10
-- Run this in Supabase SQL Editor

-- ============================================================
-- program_applications 欄位調整 (FR-1 ~ FR-5)
-- ============================================================

-- FR-1: 報名開始日
ALTER TABLE program_applications
  ADD COLUMN IF NOT EXISTS apply_start_date DATE;

-- FR-2: deadline → apply_end_date (改名)
ALTER TABLE program_applications
  ADD COLUMN IF NOT EXISTS apply_end_date DATE;

-- 回填 deadline → apply_end_date
UPDATE program_applications
  SET apply_end_date = deadline
  WHERE deadline IS NOT NULL AND apply_end_date IS NULL;

-- 移除舊 deadline 欄位 + 舊索引
DROP INDEX IF EXISTS idx_program_applications_deadline;
ALTER TABLE program_applications
  DROP COLUMN IF EXISTS deadline;

-- 建立新索引
CREATE INDEX IF NOT EXISTS idx_program_applications_apply_end_date
  ON program_applications (apply_end_date);

-- FR-3: 放榜日期
ALTER TABLE program_applications
  ADD COLUMN IF NOT EXISTS result_announce_date DATE;

-- FR-4: 資料狀態 (check constraint 限制三種值)
ALTER TABLE program_applications
  ADD COLUMN IF NOT EXISTS data_status TEXT NOT NULL DEFAULT 'unknown';

DO $$ BEGIN
  ALTER TABLE program_applications
    ADD CONSTRAINT chk_data_status
    CHECK (data_status IN ('active', 'deprecated', 'unknown'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- FR-5: 驗證時間
ALTER TABLE program_applications
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ============================================================
-- programs 欄位增補 (FR-6 ~ FR-10)
-- ============================================================

-- FR-6: 招生名額
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS cohort_size INTEGER;

-- FR-7: 系所摘要
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS program_overview TEXT;

-- FR-8: 課程資訊入口
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS curriculum_url TEXT;

-- FR-9: 研究方向 (jsonb 陣列)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS research_areas JSONB DEFAULT '[]'::JSONB;

-- FR-10: 師資/實驗室入口
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS faculty_url TEXT;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS labs_url TEXT;

-- ============================================================
-- 回填種子資料 data_status (已有資料標為 active)
-- ============================================================
UPDATE program_applications
  SET data_status = 'active',
      verified_at = NOW()
  WHERE data_status = 'unknown';
