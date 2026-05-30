-- 为已存在的库补「作者单位」列（万方 CSV 已有「作者单位」字段，初版入库时被丢弃）。
-- 迁移运行器对 "duplicate column name" 错误做容忍处理，因此本语句可在新旧库上重复执行。
ALTER TABLE papers_master ADD COLUMN affiliation TEXT;
