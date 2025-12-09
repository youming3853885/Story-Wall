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
}

// 建立失物卡片
function createLostItemCard(item) {
    const card = document.createElement('div');
    card.className = 'lost-item-card';
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
                <svg class="play-icon" viewBox="0 0 24 24" width="32" height="32">
                    <path d="M8 5v14l11-7z" fill="#fff"/>
                </svg>
            </div>
        </div>
        <div class="item-info">
            <h3 class="item-name">${escapeHtml(item.item_name)}</h3>
            <div class="item-details">
                <p class="item-location">📍 ${escapeHtml(item.found_location)}</p>
                <p class="item-time">🕒 ${timeAgo}</p>
                ${item.finder_name ? `<p class="item-finder">👤 ${escapeHtml(item.finder_name)}</p>` : ''}
            </div>
            <button class="found-owner-btn" onclick="showOwnerInputModal('${item.id}')" title="找到主人">
                🎉 找到主人
            </button>
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

// 以下是保持原有功能的函數，但改用 Firebase...

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
    const playIcon = playBtn.querySelector('.play-icon');
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

// 上傳相關功能保持不變，但改用 Firebase...
// (這裡省略了上傳相關的函數，因為它們主要是 UI 邏輯，只需要修改最終的儲存部分)

// 以下是所有其他現有功能的 Firebase 版本...
// (由於篇幅限制，我會在下一個檔案中繼續)
