// 管理系統腳本 - Firebase版本

// 全局變數
let currentSection = 'upload';
let capturedPhoto = null;
let currentItemData = null;
let firebaseApp, db, storage;

// 初始化 Firebase
function initializeFirebase() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyDm1Arp6DTUerSdTKjC4T4ndMRNDog4fuI",
            authDomain: "story-wall-7af82.firebaseapp.com",
            projectId: "story-wall-7af82",
            storageBucket: "story-wall-7af82.firebasestorage.app",
            messagingSenderId: "308812034466",
            appId: "1:308812034466:web:afa66ee199a49a5f49c2fb",
            measurementId: "G-QSEJ431VV0"
        };

        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        console.log('✅ 管理系統 Firebase 客戶端已初始化');
        return true;
    } catch (error) {
        console.error('❌ Firebase 初始化失敗:', error);
        return false;
    }
}

// AI 故事生成模板
const storyTemplates = [
    "哈囉！我是{name}！今天{time}，我在{location}被發現了。我好想念我的小主人，希望他快來帶我回家。我會乖乖地等待，直到我們重新相遇的那一刻！",
    "大家好，我是{name}！我在{location}孤單地等待著。我記得小主人總是很愛護我，現在我好想念那溫暖的感覺。如果你認識我的主人，請告訴他我在這裡等他！",
    "嗨！我是{name}！{time}我在{location}和小主人走散了。我每天都在想念我們一起度過的快樂時光。我相信小主人一定很擔心我，快來找我吧！",
    "你好！我是{name}！我在{location}被好心人發現。雖然現在很孤單，但我相信小主人一定會來找我的。我會耐心等待，因為我知道我們的緣分還沒結束！"
];

// 頁面載入初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('管理系統已載入');
    
    if (initializeFirebase()) {
        initializeAdmin();
        setupEventListeners();
        loadItemsFromDatabase();
        updateStatisticsFromDatabase();
    } else {
        showError('Firebase 初始化失敗，請重新整理頁面');
    }
    
    // 設置當前時間
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16);
    const foundTimeElement = document.getElementById('foundTime');
    if (foundTimeElement) {
        foundTimeElement.value = formattedTime;
    }
});

// 初始化管理系統
function initializeAdmin() {
    showSection('upload');
}

// 設置事件監聽器
function setupEventListeners() {
    // 相機按鈕
    const startCameraBtn = document.getElementById('startCameraBtn');
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startCamera);
    }
    
    // 拍照按鈕
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }
    
    // 檔案選擇
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 生成故事按鈕
    const generateStoryBtn = document.getElementById('generateStoryBtn');
    if (generateStoryBtn) {
        generateStoryBtn.addEventListener('click', generateStory);
    }
    
    // 儲存失物按鈕
    const saveItemBtn = document.getElementById('saveItemBtn');
    if (saveItemBtn) {
        saveItemBtn.addEventListener('click', saveItem);
    }
}

// 顯示錯誤訊息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 9999;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

// 顯示成功訊息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 9999;
        max-width: 300px;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}

// 切換顯示區域
function showSection(sectionName) {
    // 隱藏所有區域
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 移除所有導航項目的 active 類
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 顯示選中的區域
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // 添加 active 類到對應的導航項目
    const activeNavItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // 如果是管理區域，載入失物資料
    if (sectionName === 'manage') {
        loadItemsFromDatabase();
    }
    
    // 如果是統計區域，更新統計資料
    if (sectionName === 'stats') {
        updateStatisticsFromDatabase();
    }
}

// 回到展示頁面
function backToDisplay() {
    window.location.href = 'index.html';
}

// 相機功能
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        const video = document.getElementById('cameraVideo');
        video.srcObject = stream;
        
        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'block';
        
        console.log('相機已啟動');
    } catch (error) {
        console.error('無法啟動相機:', error);
        showError('無法啟動相機，請檢查權限設定或使用檔案上傳功能');
    }
}

// 拍照功能
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
    
    // 停止相機
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    
    // 顯示拍攝的照片
    video.style.display = 'none';
    const img = document.createElement('img');
    img.src = capturedPhoto;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '15px';
    
    const container = document.getElementById('cameraContainer');
    container.innerHTML = '';
    container.appendChild(img);
    
    // 添加重新拍照按鈕
    const retakeBtn = document.createElement('button');
    retakeBtn.innerHTML = '重新拍照';
    retakeBtn.className = 'camera-btn primary';
    retakeBtn.style.position = 'absolute';
    retakeBtn.style.bottom = '10px';
    retakeBtn.style.right = '10px';
    retakeBtn.onclick = resetCamera;
    container.appendChild(retakeBtn);
    
    // 更新步驟狀態
    updateStepStatus(2);
    
    console.log('照片已拍攝');
}

// 重置相機
function resetCamera() {
    const container = document.getElementById('cameraContainer');
    container.innerHTML = `
        <video id="cameraVideo" autoplay muted></video>
        <canvas id="photoCanvas" style="display: none;"></canvas>
    `;
    
    document.getElementById('startCameraBtn').style.display = 'block';
    document.getElementById('captureBtn').style.display = 'none';
    
    capturedPhoto = null;
    updateStepStatus(1);
}

// 處理檔案選擇
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedPhoto = e.target.result;
            
            // 顯示選擇的圖片
            const container = document.getElementById('cameraContainer');
            container.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = capturedPhoto;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '15px';
            
            container.appendChild(img);
            
            // 添加重新選擇按鈕
            const retakeBtn = document.createElement('button');
            retakeBtn.innerHTML = '重新選擇';
            retakeBtn.className = 'camera-btn primary';
            retakeBtn.style.position = 'absolute';
            retakeBtn.style.bottom = '10px';
            retakeBtn.style.right = '10px';
            retakeBtn.onclick = resetCamera;
            container.appendChild(retakeBtn);
            
            updateStepStatus(2);
        };
        reader.readAsDataURL(file);
    } else {
        showError('請選擇有效的圖片檔案');
    }
}

// 生成故事
function generateStory() {
    const itemName = document.getElementById('itemName').value.trim();
    const foundLocation = document.getElementById('foundLocation').value;
    const foundTime = document.getElementById('foundTime').value;
    
    if (!itemName || !foundLocation) {
        showError('請填寫失物名稱和發現地點');
        return;
    }
    
    // 使用模板生成故事
    const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
    const timeStr = foundTime ? new Date(foundTime).toLocaleDateString() : '今天';
    
    const story = template
        .replace(/{name}/g, itemName)
        .replace(/{location}/g, foundLocation)
        .replace(/{time}/g, timeStr);
    
    document.getElementById('storyText').value = story;
    updateStepStatus(3);
    
    showSuccess('故事已生成！');
}

// 儲存失物
async function saveItem() {
    try {
        // 收集表單資料
        const itemData = {
            item_name: document.getElementById('itemName').value.trim(),
            found_location: document.getElementById('foundLocation').value,
            description: document.getElementById('description').value.trim(),
            finder_name: document.getElementById('finderName').value.trim(),
            story: document.getElementById('storyText').value.trim(),
            found_time: document.getElementById('foundTime').value
        };
        
        // 驗證必填欄位
        if (!itemData.item_name || !itemData.found_location) {
            showError('請填寫失物名稱和發現地點');
            return;
        }
        
        if (!capturedPhoto) {
            showError('請先拍照或選擇圖片');
            return;
        }
        
        // 顯示載入狀態
        const saveBtn = document.getElementById('saveItemBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '儲存中...';
        saveBtn.disabled = true;
        
        // 轉換圖片為 Blob
        const imageBlob = dataURLtoBlob(capturedPhoto);
        
        // 上傳到 Firebase
        const result = await uploadLostItemToFirebase(itemData, imageBlob);
        
        if (result.success) {
            showSuccess('失物已成功儲存！');
            resetForm();
            updateStepStatus(1);
            
            // 如果在管理區域，重新載入列表
            if (currentSection === 'manage') {
                loadItemsFromDatabase();
            }
        } else {
            throw new Error('儲存失敗');
        }
        
    } catch (error) {
        console.error('❌ 儲存失物失敗:', error);
        showError('儲存失敗，請稍後重試');
    } finally {
        // 恢復按鈕狀態
        const saveBtn = document.getElementById('saveItemBtn');
        saveBtn.textContent = '儲存失物';
        saveBtn.disabled = false;
    }
}

// 上傳失物到 Firebase
async function uploadLostItemToFirebase(itemData, imageFile) {
    try {
        let imageUrl = '';
        
        // 上傳圖片到 Firebase Storage
        if (imageFile) {
            const timestamp = Date.now();
            const fileName = `lost-items-images/${timestamp}_${itemData.item_name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            const storageRef = storage.ref(fileName);
            
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
        }
        
        // 準備要儲存的資料
        const lostItemData = {
            item_name: itemData.item_name,
            found_location: itemData.found_location,
            description: itemData.description || '',
            finder_name: itemData.finder_name || '',
            story: itemData.story || '',
            image_url: imageUrl,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 儲存到 Firestore
        const docRef = await db.collection('lost_items').add(lostItemData);
        
        return {
            success: true,
            id: docRef.id,
            imageUrl: imageUrl
        };
        
    } catch (error) {
        console.error('❌ 上傳失物失敗:', error);
        throw error;
    }
}

// 載入失物資料
async function loadItemsFromDatabase() {
    try {
        console.log('📦 開始載入失物資料...');
        
        // 載入失物資料
        const lostItemsSnapshot = await db.collection('lost_items')
            .orderBy('created_at', 'desc')
            .get();
        
        const lostItems = [];
        lostItemsSnapshot.forEach(doc => {
            const data = doc.data();
            lostItems.push({
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.() || new Date(data.created_at),
                updated_at: data.updated_at?.toDate?.() || new Date(data.updated_at || data.created_at)
            });
        });
        
        // 載入已歸還資料
        const returnedItemsSnapshot = await db.collection('returned_items')
            .orderBy('returned_at', 'desc')
            .get();
        
        const returnedItems = [];
        returnedItemsSnapshot.forEach(doc => {
            const data = doc.data();
            returnedItems.push({
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.() || new Date(data.created_at),
                returned_at: data.returned_at?.toDate?.() || new Date(data.returned_at)
            });
        });
        
        console.log(`✅ 載入完成 - 失物: ${lostItems.length} 筆，已歸還: ${returnedItems.length} 筆`);
        
        // 顯示資料
        displayLostItems(lostItems);
        displayReturnedItems(returnedItems);
        
    } catch (error) {
        console.error('❌ 載入失物資料失敗:', error);
        showError('載入資料失敗，請重新整理頁面');
    }
}

// 顯示失物列表
function displayLostItems(items) {
    const container = document.getElementById('itemsTableBody');
    if (!container) {
        console.error('❌ 找不到 itemsTableBody 容器');
        return;
    }
    
    console.log(`📋 準備顯示 ${items.length} 筆失物資料`);
    
    if (items.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #999;">目前沒有失物</td></tr>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <tr data-item-id="${item.id}">
            <td>
                <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.item_name}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4xNTkgNzYuNzM2IDk1IDE4NUg5NUMxMDUgODUgMTE1IDg1IDEyNSA4NUMxMzUgODUgMTQ1IDc2LjczNiAxNDUgODVIMTQ1QzE0NS4xNTkgNzYuNzM2IDEzMi4yODQgNzAgMTI1IDcwSDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'">
            </td>
            <td>
                <strong>${escapeHtml(item.item_name)}</strong>
                ${item.finder_name ? `<br><small>拾得者: ${escapeHtml(item.finder_name)}</small>` : ''}
            </td>
            <td>${escapeHtml(item.found_location)}</td>
            <td>${item.created_at ? new Date(item.created_at).toLocaleString('zh-TW') : '未知'}</td>
            <td><span class="status-badge unclaimed">未認領</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="markAsReturned('${item.id}')" class="action-btn success" title="標記為已歸還">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button onclick="deleteItem('${item.id}')" class="action-btn danger" title="刪除">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 顯示已歸還列表（在同一個表格中顯示）
function displayReturnedItems(items) {
    // admin.html 只有一個表格，已歸還的物品不單獨顯示
    // 統計數據會在 updateStatisticsFromDatabase 中更新
    console.log(`📦 已歸還物品數量: ${items.length}`);
}

// 標記為已歸還
async function markAsReturned(itemId) {
    const ownerName = prompt('請輸入物品主人姓名：');
    if (!ownerName) return;
    
    try {
        // 獲取原始失物資料
        const itemDoc = await db.collection('lost_items').doc(itemId).get();
        
        if (!itemDoc.exists) {
            showError('找不到指定的失物');
            return;
        }
        
        const itemData = itemDoc.data();
        
        // 準備歸還記錄
        const returnedItemData = {
            ...itemData,
            owner_name: ownerName,
            returned_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 使用批次操作
        const batch = db.batch();
        
        // 新增到 returned_items
        const returnedItemRef = db.collection('returned_items').doc(itemId);
        batch.set(returnedItemRef, returnedItemData);
        
        // 從 lost_items 刪除
        const lostItemRef = db.collection('lost_items').doc(itemId);
        batch.delete(lostItemRef);
        
        // 執行批次操作
        await batch.commit();
        
        showSuccess('失物已標記為已歸還');
        loadItemsFromDatabase();
        
    } catch (error) {
        console.error('❌ 標記為已歸還失敗:', error);
        showError('操作失敗，請稍後重試');
    }
}

// 刪除失物
async function deleteItem(itemId) {
    if (!confirm('確定要刪除這個失物嗎？')) return;
    
    try {
        await db.collection('lost_items').doc(itemId).delete();
        showSuccess('失物已刪除');
        loadItemsFromDatabase();
    } catch (error) {
        console.error('❌ 刪除失物失敗:', error);
        showError('刪除失敗，請稍後重試');
    }
}

// 刪除已歸還記錄
async function deleteReturnedItem(itemId) {
    if (!confirm('確定要刪除這個歸還記錄嗎？')) return;
    
    try {
        await db.collection('returned_items').doc(itemId).delete();
        showSuccess('歸還記錄已刪除');
        loadItemsFromDatabase();
    } catch (error) {
        console.error('❌ 刪除歸還記錄失敗:', error);
        showError('刪除失敗，請稍後重試');
    }
}

// 更新統計資料
async function updateStatisticsFromDatabase() {
    try {
        console.log('📊 開始更新統計資料...');
        
        // 獲取失物統計
        const lostItemsSnapshot = await db.collection('lost_items').get();
        const returnedItemsSnapshot = await db.collection('returned_items').get();
        
        const lostCount = lostItemsSnapshot.size;
        const returnedCount = returnedItemsSnapshot.size;
        const totalCount = lostCount + returnedCount;
        const returnRate = totalCount > 0 ? ((returnedCount / totalCount) * 100).toFixed(1) : 0;
        
        console.log(`📊 統計: 總計=${totalCount}, 未認領=${lostCount}, 已認領=${returnedCount}, 認領率=${returnRate}%`);
        
        // 更新統計顯示 - 使用 admin.html 中的正確 ID
        const totalElement = document.getElementById('totalItems');
        const claimedElement = document.getElementById('claimedItems');
        const unclaimedElement = document.getElementById('unclaimedItems');
        const rateElement = document.getElementById('claimRate');
        
        if (totalElement) totalElement.textContent = totalCount;
        if (claimedElement) claimedElement.textContent = returnedCount;
        if (unclaimedElement) unclaimedElement.textContent = lostCount;
        if (rateElement) rateElement.textContent = returnRate + '%';
        
        console.log('✅ 統計資料更新完成');
        
    } catch (error) {
        console.error('❌ 更新統計資料失敗:', error);
        showError('統計資料更新失敗');
    }
}

// 工具函數
function updateStepStatus(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((stepEl, index) => {
        if (index < step) {
            stepEl.classList.add('completed');
        } else {
            stepEl.classList.remove('completed');
        }
    });
}

function resetForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('foundLocation').value = '';
    document.getElementById('description').value = '';
    document.getElementById('finderName').value = '';
    document.getElementById('storyText').value = '';
    
    const now = new Date();
    document.getElementById('foundTime').value = now.toISOString().slice(0, 16);
    
    resetCamera();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
