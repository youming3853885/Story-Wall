-- 創建最基本的 returned_items 表
-- 只包含必要的欄位，避免複雜的結構問題

-- 刪除現有表格（如果存在問題）
DROP TABLE IF EXISTS returned_items;

-- 創建新的 returned_items 表（簡化版本）
CREATE TABLE returned_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    found_location VARCHAR(50) NOT NULL,
    claimer_name VARCHAR(50) NOT NULL,
    description TEXT,
    story TEXT,
    finder_name VARCHAR(50),
    found_time TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    image_data TEXT,
    original_lost_item_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 禁用 RLS（Row Level Security）
ALTER TABLE returned_items DISABLE ROW LEVEL SECURITY;

-- 設置權限
GRANT ALL ON returned_items TO anon;
GRANT ALL ON returned_items TO authenticated;
GRANT ALL ON returned_items TO service_role;

-- 設置序列權限
GRANT USAGE, SELECT ON SEQUENCE returned_items_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE returned_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE returned_items_id_seq TO service_role;

-- 刷新 schema cache
NOTIFY pgrst, 'reload schema';

-- 插入一筆測試資料確認表格運作正常
INSERT INTO returned_items (name, found_location, claimer_name, description) 
VALUES ('測試物品', '測試地點', '測試主人', '測試描述');

-- 檢查插入是否成功
SELECT * FROM returned_items WHERE name = '測試物品';

-- 刪除測試資料
DELETE FROM returned_items WHERE name = '測試物品';
