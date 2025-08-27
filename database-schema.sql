-- 失物故事牆資料庫架構設計
-- 適用於 Supabase PostgreSQL

-- 創建失物表（展示中的失物）
CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '失物名稱',
    description TEXT COMMENT '失物描述',
    image_url TEXT COMMENT '失物照片URL',
    image_data TEXT COMMENT '失物照片Base64資料',
    found_location VARCHAR(50) NOT NULL COMMENT '發現地點',
    found_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() COMMENT '發現時間',
    story TEXT COMMENT 'AI生成的失物故事',
    finder_name VARCHAR(50) COMMENT '拾得者姓名',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() COMMENT '記錄建立時間',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() COMMENT '記錄更新時間'
);

-- 創建已歸還物品表
CREATE TABLE returned_items (
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

-- 創建地點管理表
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '地點名稱',
    description TEXT COMMENT '地點描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否啟用',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入預設地點
INSERT INTO locations (name, description) VALUES
('操場', '學校操場區域'),
('圖書館', '學校圖書館'),
('體育館', '學校體育館'),
('教室', '各教室區域'),
('餐廳', '學校餐廳'),
('走廊', '各樓層走廊'),
('廁所', '廁所區域'),
('其他', '其他未分類地點');

-- 創建管理員表
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '管理員帳號',
    password_hash VARCHAR(255) NOT NULL COMMENT '密碼雜湊',
    name VARCHAR(50) NOT NULL COMMENT '管理員姓名',
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')) COMMENT '角色',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否啟用',
    last_login TIMESTAMP WITH TIME ZONE COMMENT '最後登入時間',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建故事模板表
CREATE TABLE story_templates (
    id SERIAL PRIMARY KEY,
    template TEXT NOT NULL COMMENT '故事模板內容',
    category VARCHAR(50) COMMENT '模板分類',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否啟用',
    usage_count INTEGER DEFAULT 0 COMMENT '使用次數',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入預設故事模板
INSERT INTO story_templates (template, category) VALUES
('哈囉！我是{name}！今天{time}，我在{location}被發現了。我好想念我的小主人，希望他快來帶我回家。我會乖乖地等待，直到我們重新相遇的那一刻！', 'friendly'),
('大家好，我是{name}！我在{location}孤單地等待著。我記得小主人總是很愛護我，現在我好想念那溫暖的感覺。如果你認識我的主人，請告訴他我在這裡等他！', 'lonely'),
('嗨！我是{name}！{time}我在{location}和小主人走散了。我每天都在想念我們一起度過的快樂時光。我相信小主人一定很擔心我，快來找我吧！', 'hopeful'),
('你好！我是{name}！我在{location}被好心人發現。雖然現在很孤單，但我相信小主人一定會來找我的。我會耐心等待，因為我知道我們的緣分還沒結束！', 'patient');

-- 創建系統設定表
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE COMMENT '設定鍵',
    setting_value TEXT COMMENT '設定值',
    description TEXT COMMENT '設定描述',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入預設系統設定
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_title', '凱旋失物故事牆', '網站標題'),
('auto_story_generation', 'true', '是否啟用自動故事生成'),
('max_image_size', '5242880', '最大圖片大小（位元組）'),
('claim_notification', 'true', '是否啟用認領通知'),
('story_voice_enabled', 'true', '是否啟用語音播放');

-- 創建操作日誌表
CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    action VARCHAR(50) NOT NULL COMMENT '操作類型',
    target_type VARCHAR(50) COMMENT '目標類型',
    target_id INTEGER COMMENT '目標ID',
    description TEXT COMMENT '操作描述',
    ip_address INET COMMENT '操作IP',
    user_agent TEXT COMMENT '用戶代理',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建統計視圖
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_items,
    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_items,
    COUNT(CASE WHEN status = 'unclaimed' THEN 1 END) as unclaimed_items,
    ROUND(
        COUNT(CASE WHEN status = 'claimed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as claim_rate
FROM lost_items 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 創建地點統計視圖
CREATE OR REPLACE VIEW location_statistics AS
SELECT 
    found_location,
    COUNT(*) as total_items,
    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_items,
    COUNT(CASE WHEN status = 'unclaimed' THEN 1 END) as unclaimed_items,
    ROUND(
        COUNT(CASE WHEN status = 'claimed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as claim_rate
FROM lost_items 
GROUP BY found_location
ORDER BY total_items DESC;

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表添加觸發器
CREATE TRIGGER update_lost_items_updated_at 
    BEFORE UPDATE ON lost_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 創建索引以提升查詢效能
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_lost_items_location ON lost_items(found_location);
CREATE INDEX idx_lost_items_found_time ON lost_items(found_time);
CREATE INDEX idx_lost_items_created_at ON lost_items(created_at);

-- RLS (Row Level Security) 設定
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 公開讀取失物資料的政策（用於展示牆）
CREATE POLICY "公開讀取失物" ON lost_items
    FOR SELECT USING (true);

-- 管理員完整權限政策
CREATE POLICY "管理員完整權限" ON lost_items
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- 建立範例資料
INSERT INTO lost_items (name, description, found_location, story, finder_name, image_url) VALUES
('紅色水壺', '一個紅色的保溫水壺，表面有小磨損', '操場', '哈囉！我是一個紅色的水壺！今天早上，我的小主人匆匆忙忙地跑到操場玩耍，結果把我忘在長椅上了。現在太陽好大，我好想念小主人溫暖的手，也好想為他裝滿清涼的水。如果你是我的主人，快來帶我回家吧！我會乖乖地為你保存每一滴珍貴的水分。', '李老師', 'placeholder_image_1.jpg'),
('藍色鉛筆盒', '藍色塑膠鉛筆盒，內有文具', '圖書館', '大家好，我是一個藍色的鉛筆盒！我的肚子裡住著好多文具朋友：鉛筆、橡皮擦、尺子...他們現在都好擔心，因為我們在圖書館和小主人走散了。我記得小主人今天在認真看書，可能太專心了就忘記帶走我們。我們都很想念小主人的書包，那是我們溫暖的家。快來找我們吧！', '王老師', 'placeholder_image_2.jpg'),
('橘色帽子', '橘色棒球帽，帽沿有些彎曲', '體育館', '嗨！我是一頂橘色的帽子！三天前在體育館，我正在保護小主人的頭不被太陽曬到，結果體育課結束後，小主人匆忙地跑去喝水，就把我落在運動器材旁邊了。現在我每天都在等待，希望能再次戴在小主人的頭上，為他遮風擋雨。我的橘色很亮眼，相信小主人一定能認出我來！', '張老師', 'placeholder_image_3.jpg');

-- 註釋說明
COMMENT ON TABLE lost_items IS '失物記錄表';
COMMENT ON TABLE locations IS '地點管理表';
COMMENT ON TABLE admins IS '管理員帳號表';
COMMENT ON TABLE story_templates IS '故事模板表';
COMMENT ON TABLE system_settings IS '系統設定表';
COMMENT ON TABLE operation_logs IS '操作日誌表';
