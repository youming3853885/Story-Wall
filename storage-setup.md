# 📁 Supabase Storage 設置指南

## 🎯 概述
為了讓照片上傳功能正常運作，您需要在 Supabase 後台設置一個 Storage Bucket。

## 📋 設置步驟

### **步驟 1: 登入 Supabase Dashboard**
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案 `凱旋-失物故事牆`

### **步驟 2: 創建 Storage Bucket**
1. 在左側導航中點擊 **"Storage"**
2. 點擊 **"Create bucket"** 按鈕
3. 填寫以下資訊：
   - **Name**: `lost-items-images`
   - **Public bucket**: ✅ **勾選** (讓圖片可以公開訪問)
   - **File size limit**: `5MB` (可選)
   - **Allowed MIME types**: `image/*` (可選)

### **步驟 3: 設置 Bucket 政策**
1. 在 Bucket 列表中找到 `lost-items-images`
2. 點擊右側的 **"Settings"** (齒輪圖標)
3. 在 **"Policies"** 標籤中設置以下政策：

#### **上傳政策 (INSERT)**
```sql
-- 允許匿名用戶上傳圖片
CREATE POLICY "允許公開上傳圖片" ON storage.objects
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'lost-items-images');
```

#### **讀取政策 (SELECT)**
```sql
-- 允許公開讀取圖片
CREATE POLICY "允許公開讀取圖片" ON storage.objects
FOR SELECT 
TO public 
USING (bucket_id = 'lost-items-images');
```

### **步驟 4: 驗證設置**
1. 回到您的失物故事牆網站
2. 嘗試上傳一張照片
3. 檢查瀏覽器 Console 是否有錯誤訊息

## 🔧 故障排除

### **錯誤 1: "Bucket not found"**
- **原因**: Bucket 名稱不正確或不存在
- **解決**: 確認 Bucket 名稱為 `lost-items-images`

### **錯誤 2: "Access denied"**
- **原因**: 缺少上傳權限
- **解決**: 檢查並設置上述的 Storage 政策

### **錯誤 3: "File too large"**
- **原因**: 檔案超過 5MB 限制
- **解決**: 系統會自動壓縮照片，如果仍有問題請調整限制

## 📂 檔案結構
成功設置後，上傳的圖片將按以下結構組織：
```
lost-items-images/
└── lost-items/
    ├── 1705575068123-abc123-紅色水壺.jpg
    ├── 1705575125456-def456-藍色鉛筆盒.jpg
    └── ...
```

## ✅ 完成確認
設置完成後，您的系統將：
- ✅ 自動將照片上傳到 Supabase Storage
- ✅ 在資料庫中儲存圖片的公開 URL
- ✅ 在網頁上正確顯示高品質圖片
- ✅ 如果 Storage 上傳失敗，會自動回退到 Base64 儲存

---

**📞 需要協助？**
如果設置過程中遇到問題，請檢查瀏覽器 Console 的錯誤訊息，大部分問題都與權限設置有關。
