# 失物故事牆部署指南 🚀

## 📋 部署前準備

### 1. 環境需求
- 現代化瀏覽器（支援相機和語音API）
- Supabase 帳號（用於資料庫）
- OpenAI API Key（用於AI故事生成）
- 網頁伺服器（可使用 GitHub Pages、Netlify、Vercel 等）

### 2. 帳號申請

#### Supabase 設定
1. 前往 [Supabase](https://supabase.com) 創建帳號
2. 創建新專案
3. 在專案設定中獲取：
   - `Project URL`
   - `Anon Key`
4. 執行 `database-schema.sql` 創建資料表

#### OpenAI API 設定
1. 前往 [OpenAI](https://platform.openai.com) 註冊
2. 創建 API Key
3. 確保帳戶有足夠額度

## 🔧 配置設定

### 1. 修改配置文件
編輯 `config.js` 文件，替換以下配置：

```javascript
// 替換 Supabase 配置
supabase: {
    url: 'YOUR_SUPABASE_URL',        // 替換為您的 Supabase URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // 替換為您的 Anon Key
},

// 替換 OpenAI 配置
ai: {
    apiKey: 'YOUR_OPENAI_API_KEY'    // 替換為您的 OpenAI API Key
}
```

### 2. 管理員密碼設定
在 `config.js` 中修改管理員密碼：

```javascript
app: {
    adminPassword: 'your_secure_password' // 設定安全的管理員密碼
}
```

## 📁 檔案結構
```
失物故事牆/
├── index.html              # 主要展示頁面
├── admin.html              # 管理後台頁面
├── styles.css              # 主要樣式文件
├── admin-styles.css        # 管理後台樣式
├── script.js               # 主要互動腳本
├── admin-script.js         # 管理後台腳本
├── config.js               # 系統配置文件
├── database-schema.sql     # 資料庫架構
├── README.md               # 專案說明
├── DEPLOYMENT.md           # 部署指南
└── assets/                 # 資源文件夾（如需要）
```

## 🌐 部署方式

### 方式一：GitHub Pages（推薦）
1. 將所有檔案上傳到 GitHub 倉庫
2. 進入倉庫設定 → Pages
3. 選擇 source 為主分支
4. 獲取生成的網址

### 方式二：Netlify
1. 將檔案上傳到 GitHub
2. 在 Netlify 中連接 GitHub 倉庫
3. 自動部署

### 方式三：Vercel
1. 使用 Vercel CLI 或網頁界面
2. 連接 GitHub 倉庫
3. 一鍵部署

### 方式四：本地伺服器
如果需要在校園內網部署：

```bash
# 使用 Python 3
python -m http.server 8000

# 使用 Node.js http-server
npx http-server -p 8000

# 使用 Live Server（VSCode 擴展）
# 直接在 VSCode 中右鍵 index.html 選擇 "Open with Live Server"
```

## 🗄️ 資料庫設定

### 1. 在 Supabase 中執行 SQL
1. 進入 Supabase 專案控制台
2. 點擊左側選單的 "SQL Editor"
3. 複製 `database-schema.sql` 內容並執行
4. 確認所有表格成功創建

### 2. 設定 RLS 政策
```sql
-- 如果需要修改權限政策
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

-- 允許公開讀取（展示牆使用）
CREATE POLICY "公開讀取失物" ON lost_items
    FOR SELECT USING (true);
```

### 3. 圖片儲存設定
如果需要儲存實際圖片而非 base64：

1. 在 Supabase 中創建 Storage Bucket：
```sql
-- 創建公開的圖片儲存桶
INSERT INTO storage.buckets (id, name, public) VALUES ('lost-items-images', 'lost-items-images', true);
```

2. 設定儲存政策：
```sql
-- 允許所有人讀取圖片
CREATE POLICY "公開讀取圖片" ON storage.objects
    FOR SELECT USING (bucket_id = 'lost-items-images');

-- 允許上傳圖片（需要驗證）
CREATE POLICY "允許上傳圖片" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'lost-items-images');
```

## 🔒 安全性考量

### 1. API Key 安全
- 不要將 API Key 直接寫在前端代碼中
- 考慮使用後端代理來呼叫 OpenAI API
- 設定 API Key 的使用限制

### 2. 管理員認證
- 使用強密碼
- 考慮實作更安全的認證機制
- 定期更換密碼

### 3. 資料保護
- 設定適當的 RLS 政策
- 定期備份資料
- 監控異常訪問

## 📱 瀏覽器相容性

### 支援的功能
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### 功能需求
- 相機功能需要 HTTPS 或 localhost
- 語音合成需要現代瀏覽器支援
- 檔案上傳需要 HTML5 支援

## 🧪 測試部署

### 1. 本地測試
```bash
# 啟動本地伺服器
python -m http.server 8000

# 在瀏覽器中訪問
http://localhost:8000
```

### 2. 功能測試清單
- [ ] 主頁正常載入
- [ ] 失物卡片顯示正常
- [ ] 語音播放功能正常
- [ ] 管理員登入功能
- [ ] 相機拍照功能
- [ ] 故事生成功能
- [ ] 資料儲存功能

## 🚨 常見問題

### Q: 相機無法啟動
A: 檢查以下項目：
1. 確保使用 HTTPS 或 localhost
2. 檢查瀏覽器相機權限
3. 確認設備有可用的相機

### Q: 語音無法播放
A: 可能原因：
1. 瀏覽器不支援 Web Speech API
2. 系統音量設定問題
3. 需要用戶交互後才能播放

### Q: AI 故事生成失敗
A: 檢查項目：
1. OpenAI API Key 是否正確
2. 帳戶是否有足夠額度
3. 網路連線是否正常

### Q: 資料無法儲存
A: 可能原因：
1. Supabase 配置錯誤
2. 資料庫連線問題
3. RLS 政策設定問題

## 📞 技術支援

如需技術支援，請提供：
1. 瀏覽器版本和類型
2. 錯誤訊息截圖
3. 部署環境說明
4. 相關配置資訊

---

### 📝 更新日誌
- v1.0.0 - 初始版本發布
- 包含基本展示功能
- 管理後台系統
- AI 故事生成
- 語音播放功能

### 🔮 未來規劃
- [ ] 手機 APP 版本
- [ ] 多語言支援
- [ ] 進階統計報表
- [ ] 自動通知系統
- [ ] 更多 AI 模型支援
