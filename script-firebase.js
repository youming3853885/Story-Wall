// 失物故事牆 - Firebase版本主要互動腳本

// 初始化 Firebase 客戶端
let firebaseApp, db, storage;
let uploadedPhoto = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 頁面載入完成，開始初始化 Firebase...');
    
    // 檢查必要的依賴
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase CDN 未載入');
        showErrorState('Firebase 函式庫載入失敗，請檢查網路連線');
        return;
    }
    
    // 初始化 Firebase
    try {
        if (typeof window.LostItemsConfig !== 'undefined') {
            const config = window.LostItemsConfig.config;
            firebaseApp = firebase.initializeApp(config.firebase);
            db = firebase.firestore();
            storage = firebase.storage();
            console.log('✅ Firebase 客戶端已初始化');
        } else {
            console.warn('⚠️ 配置文件未載入，使用備用配置...');
            
            // 使用備用配置
            const fallbackConfig = {
                firebase: {
                    apiKey: "AIzaSyDm1Arp6DTUerSdTKjC4T4ndMRNDog4fuI",
                    authDomain: "story-wall-7af82.firebaseapp.com",
                    projectId: "story-wall-7af82",
                    storageBucket: "story-wall-7af82.firebasestorage.app",
                    messagingSenderId: "308812034466",
                    appId: "1:308812034466:web:afa66ee199a49a5f49c2fb",
                    measurementId: "G-QSEJ431VV0"
                },
                app: {
                    adminPassword: '1234'
                }
            };
            
            window.LostItemsConfig = { config: fallbackConfig };
            firebaseApp = firebase.initializeApp(fallbackConfig.firebase);
            db = firebase.firestore();
            storage = firebase.storage();
            console.log('✅ 備用配置載入成功');
        }
        
        // 初始化其他功能
        initializeApp();
        setupUploadEventListeners();
        loadLostItemsFromDatabase();
        
    } catch (error) {
        console.error('❌ 初始化過程發生錯誤:', error);
        showErrorState('系統初始化失敗，請重新整理頁面');
    }
});

// 應用程式初始化
function initializeApp() {
    console.log('🎯 初始化應用程式功能...');
    
    // 設定語音合成
    if ('speechSynthesis' in window) {
        console.log('✅ 語音合成功能可用');
    } else {
        console.warn('⚠️ 瀏覽器不支援語音合成');
    }
    
    // 設定相機功能檢測
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('✅ 相機功能可用');
    } else {
        console.warn('⚠️ 瀏覽器不支援相機功能');
    }
    
    console.log('✅ 應用程式初始化完成');
}

// 從 Firebase 載入失物資料
async function loadLostItemsFromDatabase() {
    console.log('📦 開始從 Firebase 載入失物資料...');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const lostItemsGrid = document.getElementById('lostItemsGrid');
    
    // 顯示載入狀態
    loadingIndicator.style.display = 'block';
    noItemsMessage.style.display = 'none';
    lostItemsGrid.innerHTML = '';
    
    try {
        // 從 Firebase Firestore 獲取資料
        const snapshot = await db.collection('lost_items')
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();
        
        const lostItems = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            lostItems.push({
                id: doc.id,
                ...data,
                // 轉換 Firebase Timestamp 為 Date
                created_at: data.created_at?.toDate?.() || new Date(data.created_at),
                updated_at: data.updated_at?.toDate?.() || new Date(data.updated_at || data.created_at)
            });
        });
        
        console.log(`✅ 成功載入 ${lostItems.length} 筆失物資料`);
        
        // 隱藏載入狀態
        loadingIndicator.style.display = 'none';
        
        if (lostItems.length === 0) {
            noItemsMessage.style.display = 'block';
        } else {
            displayLostItems(lostItems);
        }
        
    } catch (error) {
        console.error('❌ 載入失物資料失敗:', error);
        loadingIndicator.style.display = 'none';
        showErrorState('載入失物資料失敗，請檢查網路連線或重新整理頁面');
    }
}

// 顯示失物資料
function displayLostItems(items) {
    const grid = document.getElementById('lostItemsGrid');
    grid.innerHTML = '';
    
    items.forEach(item => {
        const itemCard = createLostItemCard(item);
        grid.appendChild(itemCard);
    });
    
    console.log(`✅ 顯示 ${items.length} 個失物卡片`);
    
    // 設置找到主人按鈕的事件監聽
    setupOwnerFoundButtons();
}

// 設置找到主人按鈕的事件委託
function setupOwnerFoundButtons() {
    const grid = document.getElementById('lostItemsGrid');
    
    // 移除舊的監聽器（如果有）
    const oldHandler = grid.ownerFoundHandler;
    if (oldHandler) {
        grid.removeEventListener('click', oldHandler);
    }
    
    // 添加新的事件委託
    const handler = function(e) {
        const btn = e.target.closest('.found-owner-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            
            const itemId = btn.getAttribute('data-item-id');
            console.log('🎯 點擊找到主人按鈕，物品ID:', itemId);
            
            if (itemId) {
                showOwnerInputModal(itemId);
            }
        }
    };
    
    grid.addEventListener('click', handler);
    grid.ownerFoundHandler = handler; // 保存引用以便後續移除
    
    console.log('✅ 找到主人按鈕事件監聽器已設置');
}

// 建立失物卡片
function createLostItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.setAttribute('data-item-id', item.id);
    
    // 決定要顯示的圖片
    let imageSource = '';
    if (item.image_url) {
        imageSource = item.image_url;
    } else if (item.image_data) {
        imageSource = item.image_data;
    } else {
        imageSource = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4xNTkgNzYuNzM2IDk1IDE4NUg5NUMxMDUgODUgMTE1IDg1IDEyNSA4NUMxMzUgODUgMTQ1IDc2LjczNiAxNDUgODVIMTQ1QzE0NS4xNTkgNzYuNzM2IDEzMi4yODQgNzAgMTI1IDcwSDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+';
    }
    
    // 格式化時間
    const timeAgo = formatTimeAgo(item.created_at);
    
    card.innerHTML = `
        <div class="item-image-container" onclick="showStory('${item.id}')">
            <img src="${imageSource}" alt="${item.item_name}" class="item-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4xNTkgNzYuNzM2IDk1IDE4NUg5NUMxMDUgODUgMTE1IDg1IDEyNSA4NUMxMzUgODUgMTQ1IDc2LjczNiAxNDUgODVIMTQ1QzE0NS4xNTkgNzYuNzM2IDEzMi4yODQgNzAgMTI1IDcwSDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'">
            <div class="play-overlay">
                <svg class="play-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M8 5v14l11-7z" fill="#fff"/>
                </svg>
            </div>
            <button class="found-owner-btn" data-item-id="${item.id}" title="找到主人">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L8.5,10L11,12.5L15.5,8L17.5,10L11,16.5Z" fill="currentColor"/>
                </svg>
            </button>
        </div>
        <div class="item-info">
            <h3 class="item-name">${escapeHtml(item.item_name)}</h3>
            <div class="item-details">
                <p class="item-location">📍 ${escapeHtml(item.found_location)}</p>
                <p class="item-time">🕒 ${timeAgo}</p>
                ${item.finder_name ? `<p class="item-finder">👤 ${escapeHtml(item.finder_name)}</p>` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// 上傳失物到 Firebase
async function uploadLostItemToFirebase(itemData, imageFile = null) {
    console.log('📤 開始上傳失物到 Firebase...');
    
    try {
        let imageUrl = '';
        
        // 如果有圖片，先上傳到 Firebase Storage
        if (imageFile) {
            console.log('📷 上傳圖片到 Firebase Storage...');
            
            const timestamp = Date.now();
            const fileName = `lost-items-images/${timestamp}_${itemData.item_name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            const storageRef = storage.ref(fileName);
            
            // 上傳圖片
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
            
            console.log('✅ 圖片上傳成功:', imageUrl);
        }
        
        // 準備要儲存的資料
        const lostItemData = {
            item_name: itemData.item_name,
            found_location: itemData.found_location,
            description: itemData.description || '',
            finder_name: itemData.finder_name || '',
            story: itemData.story || '',
            image_url: imageUrl,
            image_data: itemData.image_data || '', // Base64 備用
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 儲存到 Firestore
        const docRef = await db.collection('lost_items').add(lostItemData);
        
        console.log('✅ 失物資料儲存成功，ID:', docRef.id);
        
        return {
            success: true,
            id: docRef.id,
            imageUrl: imageUrl
        };
        
    } catch (error) {
        console.error('❌ 上傳失物失敗:', error);
        throw new Error(`上傳失敗: ${error.message}`);
    }
}

// 找到主人 - 將失物從 lost_items 移到 returned_items
async function markItemAsReturned(itemId, ownerName) {
    console.log(`🎯 標記失物 ${itemId} 為已歸還，主人：${ownerName}`);
    
    try {
        // 獲取原始失物資料
        const itemDoc = await db.collection('lost_items').doc(itemId).get();
        
        if (!itemDoc.exists) {
            throw new Error('找不到指定的失物');
        }
        
        const itemData = itemDoc.data();
        
        // 準備歸還記錄
        const returnedItemData = {
            ...itemData,
            owner_name: ownerName,
            returned_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 使用批次操作確保資料一致性
        const batch = db.batch();
        
        // 新增到 returned_items
        const returnedItemRef = db.collection('returned_items').doc(itemId);
        batch.set(returnedItemRef, returnedItemData);
        
        // 從 lost_items 刪除
        const lostItemRef = db.collection('lost_items').doc(itemId);
        batch.delete(lostItemRef);
        
        // 執行批次操作
        await batch.commit();
        
        console.log('✅ 失物歸還處理完成');
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ 標記失物為已歸還失敗:', error);
        throw new Error(`歸還處理失敗: ${error.message}`);
    }
}

// 管理員功能 - 載入所有失物
async function loadAllItemsForAdmin() {
    console.log('👨‍💼 管理員載入所有失物資料...');
    
    try {
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
        
        return {
            lostItems,
            returnedItems
        };
        
    } catch (error) {
        console.error('❌ 管理員載入資料失敗:', error);
        throw error;
    }
}

// 工具函數 - 時間格式化
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays <= 7) return `${diffDays}天前`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}週前`;
    return `${Math.floor(diffDays / 30)}個月前`;
}

// 工具函數 - HTML 轉義
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

// 錯誤狀態顯示
function showErrorState(message) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const lostItemsGrid = document.getElementById('lostItemsGrid');
    
    loadingIndicator.style.display = 'none';
    noItemsMessage.style.display = 'none';
    lostItemsGrid.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>載入失敗</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">重新載入</button>
        </div>
    `;
}

// 顯示故事彈窗
async function showStory(itemId) {
    console.log(`📖 顯示失物故事: ${itemId}`);
    
    try {
        // 從 Firebase 獲取失物資料
        const itemDoc = await db.collection('lost_items').doc(itemId).get();
        
        if (!itemDoc.exists) {
            console.error('找不到指定的失物');
            return;
        }
        
        const item = itemDoc.data();
        
        // 顯示故事彈窗
        const modal = document.getElementById('storyModal');
        const image = document.getElementById('storyImage');
        const title = document.getElementById('storyTitle');
        const text = document.getElementById('storyText');
        
        // 設定圖片
        if (item.image_url) {
            image.src = item.image_url;
        } else if (item.image_data) {
            image.src = item.image_data;
        }
        
        // 設定標題和故事
        title.textContent = `${item.item_name} 的故事`;
        text.textContent = item.story || '這個失物還沒有故事，但它一定很想念主人...';
        
        // 顯示彈窗
        modal.style.display = 'flex';
        
        // 儲存當前故事用於語音播放
        window.currentStory = {
            text: item.story || `我是 ${item.item_name}，我在 ${item.found_location} 被發現，我很想念我的主人，希望能快點回到主人身邊。`,
            isPlaying: false
        };
        
    } catch (error) {
        console.error('❌ 載入故事失敗:', error);
    }
}

// 關閉故事彈窗
function closeStory() {
    const modal = document.getElementById('storyModal');
    modal.style.display = 'none';
    
    // 停止語音播放
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // 重置播放狀態
    const playBtn = document.getElementById('playStoryBtn');
    playBtn.innerHTML = `
        <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 5v14l11-7z" fill="#fff"/>
        </svg>
        聽我說話
    `;
    
    if (window.currentStory) {
        window.currentStory.isPlaying = false;
    }
}

// 語音播放切換
function toggleStoryAudio() {
    if (!window.currentStory) return;
    
    const playBtn = document.getElementById('playStoryBtn');
    const speakingAnimation = document.getElementById('speakingAnimation');
    
    if (window.currentStory.isPlaying) {
        // 停止播放
        window.speechSynthesis.cancel();
        window.currentStory.isPlaying = false;
        
        playBtn.innerHTML = `
            <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M8 5v14l11-7z" fill="#fff"/>
            </svg>
            聽我說話
        `;
        speakingAnimation.style.display = 'none';
        
    } else {
        // 開始播放
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(window.currentStory.text);
            utterance.lang = 'zh-TW';
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            
            utterance.onstart = () => {
                window.currentStory.isPlaying = true;
                playBtn.innerHTML = `
                    <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#fff"/>
                    </svg>
                    停止播放
                `;
                speakingAnimation.style.display = 'flex';
            };
            
            utterance.onend = () => {
                window.currentStory.isPlaying = false;
                playBtn.innerHTML = `
                    <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M8 5v14l11-7z" fill="#fff"/>
                    </svg>
                    聽我說話
                `;
                speakingAnimation.style.display = 'none';
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            alert('您的瀏覽器不支援語音功能');
        }
    }
}

// 管理員登入功能
function showAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    modal.style.display = 'flex';
    document.getElementById('adminPassword').focus();
}

function hideAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    modal.style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const correctPassword = window.LostItemsConfig ? window.LostItemsConfig.config.app.adminPassword : '1234';
    
    if (password === correctPassword) {
        hideAdminLogin();
        window.location.href = 'admin.html';
    } else {
        alert('密碼錯誤，請重新輸入！');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// 上傳功能
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'flex';
}

function hideUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';
    resetUploadForm();
}

function resetUploadForm() {
    document.getElementById('uploadItemName').value = '';
    document.getElementById('uploadFoundLocation').value = '';
    document.getElementById('uploadDescription').value = '';
    document.getElementById('uploadFinderName').value = '';
    uploadedPhoto = null;
}

// 找到主人功能
let currentFoundItemId = null;

function showOwnerInputModal(itemId) {
    console.log('🎯 開啟找到主人modal，物品ID:', itemId);
    currentFoundItemId = itemId;
    const modal = document.getElementById('ownerInputModal');
    if (!modal) {
        console.error('❌ 找不到 ownerInputModal 元素');
        return;
    }
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // 設置焦點
    setTimeout(() => {
        const input = document.getElementById('ownerNameInput');
        if (input) input.focus();
    }, 100);
}

function hideOwnerInputModal() {
    console.log('❌ 關閉找到主人modal');
    const modal = document.getElementById('ownerInputModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // 等待動畫完成
    
    const input = document.getElementById('ownerNameInput');
    if (input) input.value = '';
    currentFoundItemId = null;
}

function confirmOwnerName() {
    const ownerName = document.getElementById('ownerNameInput').value.trim();
    
    if (!ownerName) {
        alert('請輸入主人姓名');
        return;
    }
    
    hideOwnerInputModal();
    showOwnerConfirmModal(ownerName);
}

function showOwnerConfirmModal(ownerName) {
    console.log('✅ 顯示確認modal，主人:', ownerName);
    const modal = document.getElementById('ownerConfirmModal');
    if (!modal) {
        console.error('❌ 找不到 ownerConfirmModal 元素');
        // 直接執行歸還
        finalizeOwnerFound(ownerName);
        return;
    }
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // 顯示確認資訊後自動執行
    setTimeout(() => {
        finalizeOwnerFound(ownerName);
    }, 1000);
}

function hideOwnerConfirmModal() {
    console.log('❌ 關閉確認modal');
    const modal = document.getElementById('ownerConfirmModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // 等待動畫完成
}

async function finalizeOwnerFound(ownerName) {
    if (!currentFoundItemId) return;
    
    try {
        await markItemAsReturned(currentFoundItemId, ownerName);
        
        // 播放感謝語音
        const thankMessages = [
            '太好了！失物找到主人了！',
            '謝謝您幫助失物回家！',
            '真是太棒了！又一個溫暖的重逢！'
        ];
        
        const randomMessage = thankMessages[Math.floor(Math.random() * thankMessages.length)];
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(randomMessage);
            utterance.lang = 'zh-TW';
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            window.speechSynthesis.speak(utterance);
        }
        
        hideOwnerConfirmModal();
        
        // 重新載入失物列表
        setTimeout(() => {
            loadLostItemsFromDatabase();
        }, 2000);
        
    } catch (error) {
        console.error('❌ 歸還處理失敗:', error);
        alert('歸還處理失敗，請稍後重試');
    }
}

// 上傳事件監聽器設定
function setupUploadEventListeners() {
    // 確保元素存在後再添加事件監聽器
    const startCameraBtn = document.getElementById('startUploadCameraBtn');
    const captureBtn = document.getElementById('captureUploadBtn');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInput = document.getElementById('uploadFileInput');
    const generateBtn = document.getElementById('generateUploadStoryBtn');
    
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startUploadCamera);
    }
    
    if (captureBtn) {
        captureBtn.addEventListener('click', captureUploadPhoto);
    }
    
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            document.getElementById('uploadFileInput').click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleUploadFileSelect);
    }
    
    if (generateBtn) {
        // 移除可能存在的舊監聽器，添加新的
        generateBtn.removeEventListener('click', generateAndSaveItem);
        generateBtn.addEventListener('click', generateAndSaveItem);
    }
    
    console.log('📷 上傳事件監聽器已設定');
}

// 啟動上傳相機
async function startUploadCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        const video = document.getElementById('uploadCameraVideo');
        video.srcObject = stream;
        video.style.display = 'block';
        
        // 隱藏佔位符
        document.getElementById('cameraPlaceholder').style.display = 'none';
        
        document.getElementById('startUploadCameraBtn').style.display = 'none';
        document.getElementById('captureUploadBtn').style.display = 'block';
        
        console.log('上傳相機已啟動');
    } catch (error) {
        console.error('無法啟動相機:', error);
        alert('無法啟動相機，請檢查權限設定或使用檔案上傳功能');
    }
}

// 拍攝上傳照片
function captureUploadPhoto() {
    const video = document.getElementById('uploadCameraVideo');
    const canvas = document.getElementById('uploadPhotoCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    uploadedPhoto = canvas.toDataURL('image/jpeg', 0.8);
    
    // 停止相機
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    
    // 顯示拍攝的照片
    showCapturedPhoto(uploadedPhoto);
    
    console.log('照片已拍攝');
}

// 處理檔案選擇
function handleUploadFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedPhoto = e.target.result;
            showCapturedPhoto(uploadedPhoto);
        };
        reader.readAsDataURL(file);
    } else {
        alert('請選擇有效的圖片檔案');
    }
}

// 顯示拍攝的照片
function showCapturedPhoto(photoData) {
    const placeholder = document.getElementById('cameraPlaceholder');
    const video = document.getElementById('uploadCameraVideo');
    
    // 隱藏相機和佔位符
    video.style.display = 'none';
    placeholder.style.display = 'none';
    
    // 創建並顯示圖片
    const img = document.createElement('img');
    img.src = photoData;
    img.style.width = '100%';
    img.style.height = '300px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '15px';
    
    const container = document.getElementById('uploadCameraContainer');
    container.appendChild(img);
    
    // 隱藏拍照按鈕，顯示重新拍照按鈕
    document.getElementById('captureUploadBtn').style.display = 'none';
    document.getElementById('startUploadCameraBtn').textContent = '重新拍照';
    document.getElementById('startUploadCameraBtn').style.display = 'block';
    document.getElementById('startUploadCameraBtn').onclick = resetUploadCamera;
}

// 重置上傳相機
function resetUploadCamera() {
    const container = document.getElementById('uploadCameraContainer');
    const placeholder = document.getElementById('cameraPlaceholder');
    
    // 移除圖片
    const img = container.querySelector('img');
    if (img) {
        container.removeChild(img);
    }
    
    // 重置按鈕
    document.getElementById('startUploadCameraBtn').textContent = '開啟相機';
    document.getElementById('startUploadCameraBtn').onclick = null;
    document.getElementById('startUploadCameraBtn').style.display = 'block';
    document.getElementById('captureUploadBtn').style.display = 'none';
    
    // 顯示佔位符
    placeholder.style.display = 'block';
    
    uploadedPhoto = null;
}

// 生成故事並儲存失物
async function generateAndSaveItem() {
    const itemName = document.getElementById('uploadItemName').value.trim();
    const foundLocation = document.getElementById('uploadFoundLocation').value;
    const customLocation = document.getElementById('customLocationInput').value.trim();
    const description = document.getElementById('uploadDescription').value.trim();
    const finderName = document.getElementById('uploadFinderName').value.trim();
    
    // 驗證必填欄位
    if (!itemName) {
        alert('請輸入失物名稱');
        return;
    }
    
    if (!foundLocation) {
        alert('請選擇發現地點');
        return;
    }
    
    // 使用自訂地點（如果有）
    const finalLocation = foundLocation === '其他' ? customLocation : foundLocation;
    
    if (foundLocation === '其他' && !customLocation) {
        alert('請輸入其他地點');
        return;
    }
    
    try {
        // 顯示載入狀態
        const generateBtn = document.getElementById('generateUploadStoryBtn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = '正在生成故事...';
        generateBtn.disabled = true;
        
        // 生成故事
        const story = generateSimpleStory(itemName, finalLocation, description);
        
        // 準備資料
        const itemData = {
            item_name: itemName,
            found_location: finalLocation,
            description: description,
            finder_name: finderName,
            story: story
        };
        
        // 如果有照片，轉換為 Blob
        let imageFile = null;
        if (uploadedPhoto) {
            imageFile = dataURLtoBlob(uploadedPhoto);
        }
        
        // 上傳到 Firebase
        const result = await uploadLostItemToFirebase(itemData, imageFile);
        
        if (result.success) {
            alert('失物已成功上傳！');
            hideUploadModal();
            
            // 重新載入失物列表
            setTimeout(() => {
                loadLostItemsFromDatabase();
            }, 1000);
        } else {
            throw new Error('上傳失敗');
        }
        
    } catch (error) {
        console.error('❌ 生成故事或儲存失敗:', error);
        alert('上傳失敗，請稍後重試');
    } finally {
        // 恢復按鈕狀態
        const generateBtn = document.getElementById('generateUploadStoryBtn');
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    }
}

// 簡單故事生成（備用方案）
function generateSimpleStory(itemName, location, description) {
    const stories = [
        `哈囉！我是${itemName}！我在${location}被發現了。我好想念我的小主人，希望他快來帶我回家。我會乖乖地等待，直到我們重新相遇的那一刻！`,
        `大家好，我是${itemName}！我在${location}孤單地等待著。我記得小主人總是很愛護我，現在我好想念那溫暖的感覺。如果你認識我的主人，請告訴他我在這裡等他！`,
        `嗨！我是${itemName}！我在${location}和小主人走散了。我每天都在想念我們一起度過的快樂時光。我相信小主人一定很擔心我，快來找我吧！`,
        `你好！我是${itemName}！我在${location}被好心人發現。雖然現在很孤單，但我相信小主人一定會來找我的。我會耐心等待，因為我知道我們的緣分還沒結束！`
    ];
    
    let story = stories[Math.floor(Math.random() * stories.length)];
    
    if (description) {
        story += ` 我的特徵是：${description}。`;
    }
    
    return story;
}

// 將 DataURL 轉換為 Blob
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

// 處理地點變更
function handleLocationChange(select) {
    const customInput = document.getElementById('customLocationInput');
    if (select.value === '其他') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}

// 鍵盤事件處理
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // 關閉所有彈窗
        closeStory();
        hideAdminLogin();
        hideUploadModal();
        hideOwnerInputModal();
        hideOwnerConfirmModal();
    }
    
    if (event.key === 'Enter') {
        // 處理 Enter 鍵
        if (document.getElementById('adminLoginModal').style.display === 'flex') {
            adminLogin();
        }
        if (document.getElementById('ownerInputModal').style.display === 'flex') {
            confirmOwnerName();
        }
    }
});
