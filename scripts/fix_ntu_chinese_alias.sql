-- 修復錯誤的 "Ntu中文" alias
-- 應該只新增 "中文" 作為中國文學系的 alias

-- 1. 刪除錯誤的 "Ntu中文" alias
DELETE FROM program_aliases WHERE alias = 'Ntu中文';

-- 2. 檢查 "中文" alias 是否已存在
-- 如果不存在，新增它
INSERT INTO program_aliases (program_id, alias)
SELECT p.program_id, '中文'
FROM programs p
JOIN schools s ON p.school_id = s.school_id
WHERE s.name LIKE '%臺灣大學%' 
  AND p.name LIKE '%中國文學%'
  AND NOT EXISTS (
    SELECT 1 FROM program_aliases 
    WHERE program_id = p.program_id AND alias = '中文'
  )
LIMIT 1;

-- 3. 確認結果
SELECT pa.alias, p.name as program_name, s.name as school_name
FROM program_aliases pa
JOIN programs p ON pa.program_id = p.program_id
JOIN schools s ON p.school_id = s.school_id
WHERE pa.alias IN ('中文', 'Ntu中文')
ORDER BY pa.alias;
