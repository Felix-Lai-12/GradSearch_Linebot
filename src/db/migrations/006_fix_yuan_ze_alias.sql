-- Fix wrong alias mapping for 元智
-- "元智" mapped to 中原大學 (d714e0b6-770a-4845-ba03-d5b2179a3b38) previously.
-- First, find the correct school_id for 元智大學 from the schools table and use it safely.
UPDATE school_aliases 
SET school_id = (SELECT school_id FROM schools WHERE name = '元智大學' LIMIT 1)
WHERE alias = '元智';
