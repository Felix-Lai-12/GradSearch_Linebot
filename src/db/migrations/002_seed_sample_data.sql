-- GradSearch Seed Data 002
-- Sample data for testing: 1 Test School, 1 Test Program, aliases, and 1 application

-- ============================================================
-- Schools
-- ============================================================
INSERT INTO schools (school_id, country, name, short_name, city, website, public_private, rank_taiwan) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'TW', '測試大學', '測大', '測試市', 'https://www.test.edu.tw', '公立', 999)
ON CONFLICT DO NOTHING;

-- ============================================================
-- School Aliases
-- ============================================================
INSERT INTO school_aliases (school_id, alias) VALUES
  ('a0000000-0000-0000-0000-000000000000', '測大'),
  ('a0000000-0000-0000-0000-000000000000', '測試大學')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Programs
-- ============================================================
INSERT INTO programs (program_id, school_id, country, name, degree, department, discipline) VALUES
  ('b0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'TW', '測試學系碩士班', '碩士', '測試學系', 'Test')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Program Aliases
-- ============================================================
INSERT INTO program_aliases (program_id, alias) VALUES
  ('b0000000-0000-0000-0000-000000000000', '測試所'),
  ('b0000000-0000-0000-0000-000000000000', '測所')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Sample Application (測試大學 甄試)
-- ============================================================
INSERT INTO program_applications (program_id, admission_type, admission_year, deadline, application_fee, required_documents, interview_required, written_exam_required, source_url, confidence) VALUES
  ('b0000000-0000-0000-0000-000000000000', '甄試', 115, '2026-10-15', 1500,
   '{"sop": true, "recommendation_letters": 2, "transcript": true, "resume": true, "portfolio": false}',
   true, false, 'https://www.test.edu.tw/admissions', 4)
ON CONFLICT DO NOTHING;
