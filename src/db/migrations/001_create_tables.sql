-- GradSearch Database Migration 001
-- Creates all 8 tables for the MVP

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. schools
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  school_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country       TEXT NOT NULL DEFAULT 'TW',
  name          TEXT NOT NULL,
  short_name    TEXT,
  city          TEXT,
  website       TEXT,
  public_private TEXT,
  rank_taiwan   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_name_trgm
  ON schools USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_schools_short_name_trgm
  ON schools USING GIN (short_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_schools_country
  ON schools (country);

-- ============================================================
-- 2. programs
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  program_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  country       TEXT NOT NULL DEFAULT 'TW',
  name          TEXT NOT NULL,
  degree        TEXT NOT NULL,
  department    TEXT,
  discipline    TEXT,
  website       TEXT,
  language      TEXT DEFAULT '中文',
  thesis_required BOOLEAN,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_school_id
  ON programs (school_id);

CREATE INDEX IF NOT EXISTS idx_programs_name_trgm
  ON programs USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_programs_country
  ON programs (country);

-- ============================================================
-- 3. program_applications
-- ============================================================
CREATE TABLE IF NOT EXISTS program_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  admission_type TEXT NOT NULL DEFAULT '甄試',
  admission_year INTEGER NOT NULL,
  deadline       DATE,
  application_fee INTEGER,
  required_documents JSONB DEFAULT '{}',
  interview_required BOOLEAN DEFAULT false,
  written_exam_required BOOLEAN DEFAULT false,
  portfolio_required BOOLEAN DEFAULT false,
  tests_required TEXT,
  source_url     TEXT,
  last_updated   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence     INTEGER DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_program_applications_program_id
  ON program_applications (program_id);

CREATE INDEX IF NOT EXISTS idx_program_applications_deadline
  ON program_applications (deadline);

-- ============================================================
-- 4. school_aliases
-- ============================================================
CREATE TABLE IF NOT EXISTS school_aliases (
  alias_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  alias      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_aliases_alias_trgm
  ON school_aliases USING GIN (alias gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_school_aliases_school_id
  ON school_aliases (school_id);

-- ============================================================
-- 5. program_aliases
-- ============================================================
CREATE TABLE IF NOT EXISTS program_aliases (
  alias_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  alias       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_aliases_alias_trgm
  ON program_aliases USING GIN (alias gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_program_aliases_program_id
  ON program_aliases (program_id);

-- ============================================================
-- 6. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id  TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_line_user_id
  ON users (line_user_id);

-- ============================================================
-- 7. user_favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  program_id  UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, program_id)
);

-- ============================================================
-- 8. search_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS search_logs (
  log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  parsed_school   TEXT,
  parsed_program  TEXT,
  results_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id
  ON search_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at
  ON search_logs (created_at);
