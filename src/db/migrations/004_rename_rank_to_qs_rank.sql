-- 004_rename_rank_to_qs_rank.sql
-- 把 rank_taiwan 欄位名稱改成 qs_rank，並將型別改為 VARCHAR，因為會有 '1001-1200' 這種範圍和 '1400+' 這種字串
ALTER TABLE schools RENAME COLUMN rank_taiwan TO qs_rank;
ALTER TABLE schools ALTER COLUMN qs_rank TYPE VARCHAR(50);
