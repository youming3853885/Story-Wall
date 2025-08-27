-- 修復 returned_items 表結構
-- 確保所有必要的欄位都存在

-- 檢查並創建 returned_items 表（如果不存在）
CREATE TABLE IF NOT EXISTS returned_items (
    id SERIAL PRIMARY KEY,
    original_lost_item_id INTEGER COMMENT '原失物記錄ID',
    name VARCHAR(100) NOT NULL COMMENT '失物名稱',
    description TEXT COMMENT '失物描述',
    image_url TEXT COMMENT '失物照片URL',
    image_data TEXT COMMENT '失物照片Base64資料',
    found_location VARCHAR(50) NOT NULL COMMENT '發現地點',
    found_time TIMESTAMP WITH TIME ZONE COMMENT '發現時間',
    story TEXT COMMENT 'AI生成的失物故事',
    finder_name VARCHAR(50) COMMENT '拾得者姓名',
    claimer_name VARCHAR(50) COMMENT '認領者姓名',
    claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() COMMENT '認領時間',
    returned_by VARCHAR(50) COMMENT '處理歸還的管理員',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() COMMENT '記錄建立時間',
    notes TEXT COMMENT '歸還備註'
);

-- 確保所有欄位都存在，如果不存在則添加
DO $$
BEGIN
    -- 檢查並添加 description 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'description'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN description TEXT;
        RAISE NOTICE '已添加 description 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 image_url 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN image_url TEXT;
        RAISE NOTICE '已添加 image_url 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 image_data 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'image_data'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN image_data TEXT;
        RAISE NOTICE '已添加 image_data 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 story 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'story'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN story TEXT;
        RAISE NOTICE '已添加 story 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 finder_name 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'finder_name'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN finder_name VARCHAR(50);
        RAISE NOTICE '已添加 finder_name 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 found_time 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'found_time'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN found_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '已添加 found_time 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 claimer_name 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'claimer_name'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN claimer_name VARCHAR(50);
        RAISE NOTICE '已添加 claimer_name 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 claim_time 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'claim_time'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '已添加 claim_time 欄位到 returned_items 表';
    END IF;

    -- 檢查並添加 original_lost_item_id 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returned_items' AND column_name = 'original_lost_item_id'
    ) THEN
        ALTER TABLE returned_items ADD COLUMN original_lost_item_id INTEGER;
        RAISE NOTICE '已添加 original_lost_item_id 欄位到 returned_items 表';
    END IF;

END $$;

-- 禁用 RLS（Row Level Security）以便應用程式可以正常操作
ALTER TABLE returned_items DISABLE ROW LEVEL SECURITY;

-- 確保表格有正確的權限
GRANT ALL ON returned_items TO anon;
GRANT ALL ON returned_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE returned_items_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE returned_items_id_seq TO authenticated;

-- 重新整理 schema cache
NOTIFY pgrst, 'reload schema';

-- 顯示表格結構確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'returned_items'
ORDER BY ordinal_position;
