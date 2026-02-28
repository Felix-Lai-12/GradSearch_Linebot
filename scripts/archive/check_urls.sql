SELECT 
  school_name,
  program_name,
  curriculum_url,
  website
FROM programs
WHERE school_name LIKE '%中央%'
  AND (program_name LIKE '%企管%' OR program_name LIKE '%物理%')
LIMIT 5;
