// 失物故事牆 - 主要互動腳本

// 初始化 Supabase 客戶端
let supabase;
let uploadedPhoto = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 頁面載入完成，開始初始化...');
    
    // 檢查必要的依賴
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase CDN 未載入');
        showErrorState('Supabase 函式庫載入失敗，請檢查網路連線');
        return;
    }
    
    // 初始化 Supabase
    try {
        if (typeof window.LostItemsConfig !== 'undefined') {
            const config = window.LostItemsConfig.config;
            supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
            console.log('✅ Supabase 客戶端已初始化');
        } else {
            console.warn('⚠️ 配置文件未載入，使用備用配置...');
            
            // 使用備用配置
            const fallbackConfig = {
                supabase: {
                    url: 'https://oytgyizrtuqyxvxtgrlv.supabase.co',
                    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dGd5aXpydHVxeXh2eHRncmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzUwNjgsImV4cCI6MjA3MTE1MTA2OH0.OiHI8KP-p0OOKo6XvPOARsz0pYqWBEMowJbL0wOzrQs'
                },
                app: {
                    adminPassword: '1234'
                }
            };
            
            window.LostItemsConfig = { config: fallbackConfig };
            supabase = window.supabase.createClient(fallbackConfig.supabase.url, fallbackConfig.supabase.anonKey);
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

// 注意：靜態示範資料已移除，現在完全使用資料庫資料

// 語音合成相關變數
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isPlaying = false;

// 舊的靜態播放函數已移除，現在使用 playStoryFromDatabase

// 關閉故事彈窗
function closeStory() {
    const modal = document.getElementById('storyModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // 停止語音播放
    if (isPlaying) {
        stopStoryAudio();
    }
}

// 播放/暫停故事語音
function toggleStoryAudio() {
    const storyText = document.getElementById('storyText').textContent;
    const playBtn = document.getElementById('playStoryBtn');
    const speakingAnimation = document.getElementById('speakingAnimation');

    if (isPlaying) {
        stopStoryAudio();
    } else {
        startStoryAudio(storyText);
    }
}

// 開始播放語音
function startStoryAudio(text) {
    // 停止之前的播放
    speechSynthesis.cancel();

    // 創建新的語音實例
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'zh-TW';
    currentUtterance.rate = 0.8;
    currentUtterance.pitch = 1.2;
    currentUtterance.volume = 1;

    // 設置語音事件
    currentUtterance.onstart = function() {
        isPlaying = true;
        updatePlayButton();
        document.getElementById('speakingAnimation').classList.add('active');
    };

    currentUtterance.onend = function() {
        isPlaying = false;
        updatePlayButton();
        document.getElementById('speakingAnimation').classList.remove('active');
    };

    currentUtterance.onerror = function() {
        isPlaying = false;
        updatePlayButton();
        document.getElementById('speakingAnimation').classList.remove('active');
    };

    // 開始播放
    speechSynthesis.speak(currentUtterance);
}

// 停止播放語音
function stopStoryAudio() {
    speechSynthesis.cancel();
    isPlaying = false;
    updatePlayButton();
    document.getElementById('speakingAnimation').classList.remove('active');
}

// 更新播放按鈕狀態
function updatePlayButton() {
    const playBtn = document.getElementById('playStoryBtn');
    const playIcon = playBtn.querySelector('.play-icon path');
    
    if (isPlaying) {
        playBtn.innerHTML = `
            <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
                <rect x="6" y="4" width="4" height="16" fill="#fff"/>
                <rect x="14" y="4" width="4" height="16" fill="#fff"/>
            </svg>
            停止播放
        `;
    } else {
        playBtn.innerHTML = `
            <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M8 5v14l11-7z" fill="#fff"/>
            </svg>
            聽我說話
        `;
    }
}

// 管理員登入相關功能
function showAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    modal.classList.add('active');
    document.getElementById('adminPassword').focus();
}

function hideAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    modal.classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    // 從配置文件獲取密碼
    const correctPassword = window.LostItemsConfig ? window.LostItemsConfig.config.app.adminPassword : '1234';
    
    if (password === correctPassword) {
        hideAdminLogin();
        // 跳轉到管理頁面
        window.location.href = 'admin.html';
    } else {
        alert('密碼錯誤，請重新輸入！');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// 鍵盤事件處理
document.addEventListener('keydown', function(event) {
    // ESC 鍵關閉彈窗
    if (event.key === 'Escape') {
        if (document.getElementById('storyModal').classList.contains('active')) {
            closeStory();
        }
        if (document.getElementById('adminLoginModal').classList.contains('active')) {
            hideAdminLogin();
        }
    }
    
    // Enter 鍵確認管理員登入
    if (event.key === 'Enter' && document.getElementById('adminLoginModal').classList.contains('active')) {
        adminLogin();
    }
});

// 點擊彈窗外部關閉
document.getElementById('storyModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeStory();
    }
});

document.getElementById('adminLoginModal').addEventListener('click', function(event) {
    if (event.target === this) {
        hideAdminLogin();
    }
});

// 初始化應用程式
function initializeApp() {
    console.log('🎯 執行應用初始化...');
    
    try {
        // 檢查 Supabase 客戶端是否正確初始化
        if (!supabase) {
            console.error('❌ Supabase 客戶端未初始化');
            showErrorState('資料庫連線失敗，請重新整理頁面');
            return false;
        }
        
        // 檢查配置
        if (!window.LostItemsConfig || !window.LostItemsConfig.config) {
            console.error('❌ 系統配置載入失敗');
            showErrorState('系統配置載入失敗，請重新整理頁面');
            return false;
        }
        
        console.log('✅ 失物故事牆已載入完成！');
        
        // 檢查語音支援
        if (!('speechSynthesis' in window)) {
            console.warn('⚠️ 此瀏覽器不支援語音合成功能');
        } else {
            console.log('✅ 語音合成功能可用');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 應用初始化異常:', error);
        showErrorState('應用初始化失敗，請重新整理頁面');
        return false;
    }
}

// 從資料庫載入失物資料
async function loadLostItemsFromDatabase() {
    try {
        console.log('🔄 開始載入失物資料...');
        
        // 顯示載入指示器
        showLoadingState();
        
        if (!supabase) {
            console.error('Supabase 客戶端未初始化');
            showErrorState('系統初始化失敗，請重新整理頁面');
            return;
        }

        const { data, error } = await supabase
            .from('lost_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('載入失物資料失敗:', error);
            showErrorState('載入失物資料失敗，請稍後重試');
            return;
        }

        console.log(`✅ 從資料庫載入了 ${data.length} 筆失物資料`);
        displayLostItems(data);
        
    } catch (err) {
        console.error('載入失物資料時發生錯誤:', err);
        showErrorState('發生未預期的錯誤，請重新整理頁面');
    }
}

// 顯示載入狀態
function showLoadingState() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const grid = document.getElementById('lostItemsGrid');
    
    loadingIndicator.style.display = 'flex';
    noItemsMessage.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
}

// 顯示錯誤狀態
function showErrorState(message) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const grid = document.getElementById('lostItemsGrid');
    
    loadingIndicator.style.display = 'none';
    noItemsMessage.style.display = 'flex';
    grid.style.display = 'none';
    
    // 更新錯誤訊息
    const emptyState = noItemsMessage.querySelector('.empty-state');
    emptyState.innerHTML = `
        <svg viewBox="0 0 100 100" width="80" height="80" class="empty-icon">
            <circle cx="50" cy="50" r="45" fill="#ffe6e6" stroke="#ff9999" stroke-width="2"/>
            <path d="M35 35 L65 65 M65 35 L35 65" stroke="#ff4444" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <h3>載入失敗</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="primary-btn">
            🔄 重新載入
        </button>
    `;
}

// 顯示失物資料
function displayLostItems(items) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noItemsMessage = document.getElementById('noItemsMessage');
    const grid = document.getElementById('lostItemsGrid');
    
    // 隱藏載入指示器
    loadingIndicator.style.display = 'none';
    
    if (!items || items.length === 0) {
        // 顯示空狀態
        noItemsMessage.style.display = 'flex';
        grid.style.display = 'none';
        console.log('📝 目前沒有失物資料');
    } else {
        // 顯示失物資料
        noItemsMessage.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = '';
        
        console.log(`🎨 開始渲染 ${items.length} 個失物卡片`);
        
        items.forEach((item, index) => {
            try {
                const card = createItemCard(item);
                grid.appendChild(card);
                
                // 添加入場動畫
                setTimeout(() => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    card.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                }, index * 100);
                
            } catch (err) {
                console.error(`渲染失物卡片時發生錯誤 (ID: ${item.id}):`, err);
            }
        });
        
        console.log('✅ 失物卡片渲染完成');
    }
}

// 創建失物卡片
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.position = 'relative'; // 為按鈕定位
    
    // 優先使用 image_url，再使用 image_data，最後使用預設圖片
    const imageSource = item.image_url || item.image_data || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23F0F0F0"/%3E%3Ctext x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3E無圖片%3C/text%3E%3C/svg%3E';
    
    const timeString = formatTimeFromDatabase(item.found_time);
    
    // 安全處理可能的空值
    const itemName = item.name || '未知失物';
    const foundLocation = item.found_location || '未知地點';
    const description = item.description ? ` - ${item.description}` : '';
    
    card.innerHTML = `
        <div class="item-image-container" onclick="playStoryFromDatabase(${item.id})">
            <img src="${imageSource}" alt="${itemName}" class="item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 200 200&quot;%3E%3Crect width=&quot;200&quot; height=&quot;200&quot; fill=&quot;%23F0F0F0&quot;/%3E%3Ctext x=&quot;100&quot; y=&quot;100&quot; text-anchor=&quot;middle&quot; font-family=&quot;Arial&quot; font-size=&quot;16&quot; fill=&quot;%23999&quot;%3E圖片載入失敗%3C/text%3E%3C/svg%3E'">
            <div class="story-indicator">
                <svg class="play-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M8 5v14l11-7z" fill="#fff"/>
                </svg>
            </div>
        </div>
        <div class="item-info" onclick="playStoryFromDatabase(${item.id})">
            <h3 class="item-name">${itemName}</h3>
            <p class="item-date">發現於：${timeString}</p>
            <p class="item-location">📍 ${foundLocation}</p>
            ${description ? `<p class="item-description">${description}</p>` : ''}
        </div>
        <button class="owner-found-btn" onclick="showOwnerInputModal(${item.id}); event.stopPropagation();" title="找到主人了！點擊歸還">
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
            </svg>
        </button>
    `;
    
    return card;
}

// 格式化資料庫時間
function formatTimeFromDatabase(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return `${Math.floor(diffDays / 7)}週前`;
}

// 播放來自資料庫的故事
async function playStoryFromDatabase(itemId) {
    try {
        const { data, error } = await supabase
            .from('lost_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) {
            console.error('載入失物故事失敗:', error);
            return;
        }

        // 顯示故事彈窗
        const modal = document.getElementById('storyModal');
        const storyImage = document.getElementById('storyImage');
        const storyTitle = document.getElementById('storyTitle');
        const storyText = document.getElementById('storyText');

        // 優先使用 image_url，再使用 image_data，最後使用預設圖片
        const imageSource = data.image_url || data.image_data || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23F0F0F0"/%3E%3Ctext x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3E無圖片%3C/text%3E%3C/svg%3E';

        storyImage.src = imageSource;
        storyImage.alt = data.name;
        storyTitle.textContent = data.name + " 的故事";
        storyText.textContent = data.story || "這個失物還沒有故事...";

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error('播放故事時發生錯誤:', err);
    }
}

// 上傳相關功能
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
        console.log('✅ 上傳按鈕事件監聽器已設置');
    } else {
        console.error('❌ 找不到 generateUploadStoryBtn 元素');
    }
}

// 顯示上傳彈窗
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 隱藏上傳彈窗
function hideUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // 重置表單
    resetUploadForm();
}

// 重置上傳表單
function resetUploadForm() {
    document.getElementById('uploadItemName').value = '';
    document.getElementById('uploadFoundLocation').value = '';
    document.getElementById('uploadDescription').value = '';
    document.getElementById('uploadFinderName').value = '';
    
    // 重置相機
    resetUploadCamera();
    uploadedPhoto = null;
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
            console.log('檔案已選擇');
        };
        reader.readAsDataURL(file);
    }
}

// 顯示捕獲的照片
function showCapturedPhoto(imageData) {
    const container = document.getElementById('uploadCameraContainer');
    container.innerHTML = `
        <img src="${imageData}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;">
        <button onclick="resetUploadCamera()" class="camera-control-btn secondary" style="position: absolute; bottom: 10px; right: 10px;">重新拍照</button>
    `;
}

// 重置上傳相機
function resetUploadCamera() {
    const container = document.getElementById('uploadCameraContainer');
    container.innerHTML = `
        <video id="uploadCameraVideo" autoplay muted style="display: none;"></video>
        <canvas id="uploadPhotoCanvas" style="display: none;"></canvas>
        <div class="camera-placeholder" id="cameraPlaceholder">
            <svg viewBox="0 0 24 24" width="64" height="64" class="camera-icon">
                <path d="M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" fill="#ccc"/>
            </svg>
            <p>點擊下方按鈕開始拍照</p>
        </div>
    `;
    
    document.getElementById('startUploadCameraBtn').style.display = 'block';
    document.getElementById('captureUploadBtn').style.display = 'none';
    uploadedPhoto = null;
}

// 生成故事並儲存失物
async function generateAndSaveItem() {
    console.log('🚀 開始執行 generateAndSaveItem 函數');
    
    const itemName = document.getElementById('uploadItemName').value;
    const foundLocation = getActualLocation();
    const description = document.getElementById('uploadDescription').value;
    const finderName = document.getElementById('uploadFinderName').value;
    
    console.log('📝 收集的表單資料:', {
        itemName,
        foundLocation,
        description,
        finderName,
        hasPhoto: !!uploadedPhoto
    });
    
    if (!itemName || !foundLocation) {
        console.error('❌ 必填欄位缺失');
        alert('請填寫失物名稱和發現地點！');
        return;
    }
    
    if (!uploadedPhoto) {
        console.error('❌ 缺少照片');
        alert('請先拍照或上傳失物照片！');
        return;
    }
    
    console.log('✅ 表單驗證通過，開始上傳流程');
    
    try {
        // 顯示載入狀態
        const btn = document.getElementById('generateUploadStoryBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" class="spinning"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/></svg> 處理中...';
        btn.disabled = true;
        
        // 生成故事
        const story = generateStoryLocally(itemName, foundLocation);
        
        let imageUrl = null;
        
        try {
            console.log('☁️ 嘗試上傳照片到 Supabase Storage...');
            // 上傳照片到 Supabase Storage
            imageUrl = await uploadImageToStorage(uploadedPhoto, itemName);
            console.log('✅ 照片已成功上傳到 Supabase Storage:', imageUrl);
        } catch (uploadError) {
            console.warn('⚠️ 照片上傳到 Storage 失敗，將使用 Base64 存儲:', uploadError.message);
            console.error('Storage 上傳錯誤詳情:', uploadError);
            // 如果 Storage 上傳失敗，仍然可以使用 Base64 作為備用方案
        }
        
        // 儲存到資料庫
        const itemData = {
            name: itemName,
            description: description,
            found_location: foundLocation,
            story: story,
            finder_name: finderName,
            found_time: new Date().toISOString()
        };
        
        // 如果成功上傳到 Storage，使用 image_url，否則使用 image_data
        if (imageUrl) {
            itemData.image_url = imageUrl;
        } else {
            itemData.image_data = uploadedPhoto;
        }
        
        console.log('💾 開始插入資料到 lost_items 表...');
        console.log('插入的資料:', JSON.stringify(itemData, null, 2));
        
        const { data, error } = await supabase
            .from('lost_items')
            .insert([itemData])
            .select();

        if (error) {
            console.error('❌ 儲存失物資料失敗:', error);
            console.error('錯誤詳情:', JSON.stringify(error, null, 2));
            console.error('Supabase 錯誤代碼:', error.code);
            console.error('Supabase 錯誤訊息:', error.message);
            alert(`儲存失敗：${error.message}`);
            return;
        }

        console.log('✅ 失物資料已成功儲存:', data);
        console.log('插入的記錄 ID:', data[0]?.id);
        alert('失物資料已成功儲存！');
        
        // 重新載入失物列表
        await loadLostItemsFromDatabase();
        
        // 關閉彈窗
        hideUploadModal();
        
    } catch (err) {
        console.error('儲存失物時發生錯誤:', err);
        alert('發生錯誤，請稍後重試');
    } finally {
        // 恢復按鈕狀態
        const btn = document.getElementById('generateUploadStoryBtn');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 上傳圖片到 Supabase Storage
async function uploadImageToStorage(imageDataUrl, itemName) {
    try {
        // 將 Base64 轉換為 Blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        // 生成唯一的檔案名稱（避免中文字符）
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(7);
        // 將中文和特殊字符轉換為安全的檔案名稱
        const safeItemName = itemName
            .replace(/[\u4e00-\u9fff]/g, 'item') // 將中文字符替換為 'item'
            .replace(/[^a-zA-Z0-9]/g, '-') // 將其他特殊字符替換為 '-'
            .replace(/-+/g, '-') // 合併多個連續的 '-'
            .replace(/^-|-$/g, ''); // 移除開頭和結尾的 '-'
        
        const fileName = `lost-items/${timestamp}-${randomString}-${safeItemName || 'lost-item'}.jpg`;
        
        // 上傳到 Supabase Storage
        const { data, error } = await supabase.storage
            .from('lost-items-images')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });
        
        if (error) {
            console.error('Storage 上傳錯誤:', error);
            throw error;
        }
        
        // 獲取公開 URL
        const { data: urlData } = supabase.storage
            .from('lost-items-images')
            .getPublicUrl(data.path);
        
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('上傳圖片到 Storage 失敗:', error);
        throw error;
    }
}

// 本地故事生成（備用方案）
function generateStoryLocally(itemName, location) {
    const templates = [
        `哈囉！我是${itemName}！今天我在${location}被發現了。我好想念我的小主人，希望他快來帶我回家。我會乖乖地等待，直到我們重新相遇的那一刻！`,
        `大家好，我是${itemName}！我在${location}孤單地等待著。我記得小主人總是很愛護我，現在我好想念那溫暖的感覺。如果你認識我的主人，請告訴他我在這裡等他！`,
        `嗨！我是${itemName}！我在${location}和小主人走散了。我每天都在想念我們一起度過的快樂時光。我相信小主人一定很擔心我，快來找我吧！`,
        `你好！我是${itemName}！我在${location}被好心人發現。雖然現在很孤單，但我相信小主人一定會來找我的。我會耐心等待，因為我知道我們的緣分還沒結束！`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 頁面可見性改變時停止語音播放
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isPlaying) {
        stopStoryAudio();
    }
});

// 防止頁面滾動時的性能問題
let ticking = false;
function updateOnScroll() {
    // 在這裡可以添加滾動相關的動畫或功能
    ticking = false;
}

window.addEventListener('scroll', function() {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
});

// 處理地點選擇變化
function handleLocationChange(selectElement) {
    const customInput = document.getElementById('customLocationInput');
    
    if (selectElement.value === '其他') {
        customInput.style.display = 'block';
        customInput.required = true;
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

// 獲取實際的地點值
function getActualLocation() {
    const select = document.getElementById('uploadFoundLocation');
    const customInput = document.getElementById('customLocationInput');
    
    if (select.value === '其他') {
        return customInput.value.trim() || '其他';
    }
    return select.value;
}

// 將函數添加到全局作用域
window.handleLocationChange = handleLocationChange;

// ==================== 找到主人功能 ====================

// 找到主人功能相關變數
let currentFoundItem = null;
let currentOwnerName = '';

// 顯示主人姓名輸入彈窗
async function showOwnerInputModal(itemId) {
    try {
        console.log(`🎉 準備處理找到主人：物品 ID ${itemId}`);
        
        // 從資料庫獲取失物詳細資訊
        const { data, error } = await supabase
            .from('lost_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) {
            console.error('❌ 獲取失物資訊失敗:', error);
            alert('獲取失物資訊失敗，請稍後重試');
            return;
        }

        currentFoundItem = data;
        
        // 填充物品預覽
        const preview = document.getElementById('foundItemPreview');
        const imageSource = data.image_url || data.image_data || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23F0F0F0"/%3E%3Ctext x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3E無圖片%3C/text%3E%3C/svg%3E';
        
        preview.innerHTML = `
            <img src="${imageSource}" alt="${data.name}">
            <h4>${data.name}</h4>
            <p>📍 發現地點：${data.found_location}</p>
            <p>🕒 發現時間：${formatTimeFromDatabase(data.found_time || data.created_at)}</p>
        `;
        
        // 重置輸入欄位
        document.getElementById('ownerNameInput').value = '';
        
        // 顯示彈窗
        const modal = document.getElementById('ownerInputModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 聚焦到輸入欄位
        setTimeout(() => {
            document.getElementById('ownerNameInput').focus();
        }, 300);
        
    } catch (err) {
        console.error('❌ 顯示主人輸入彈窗時發生錯誤:', err);
        alert('系統錯誤，請稍後重試');
    }
}

// 隱藏主人姓名輸入彈窗
function hideOwnerInputModal() {
    console.log('🔄 hideOwnerInputModal 函數被調用');
    
    const modal = document.getElementById('ownerInputModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('✅ 已隱藏輸入姓名彈窗');
    }
    
    document.body.style.overflow = 'auto';
    
    // 注意：不要在這裡清空 currentFoundItem，因為確認彈窗還需要使用
    // currentFoundItem = null; // 移除這行，改為在最終完成後清空
    
    console.log('📊 保留 currentFoundItem 供確認彈窗使用:', currentFoundItem?.name);
}

// 確認主人姓名
function confirmOwnerName() {
    console.log('🎯 confirmOwnerName 函數被調用');
    
    try {
        const ownerNameInput = document.getElementById('ownerNameInput');
        console.log('📝 找到輸入欄位:', ownerNameInput);
        
        if (!ownerNameInput) {
            console.error('❌ 找不到 ownerNameInput 元素');
            alert('系統錯誤：找不到輸入欄位');
            return;
        }
        
        const ownerName = ownerNameInput.value.trim();
        console.log('📝 輸入的姓名:', `"${ownerName}"`);
        
        if (!ownerName) {
            console.log('⚠️ 姓名為空，顯示提示');
            alert('請輸入物品主人姓名');
            ownerNameInput.focus();
            return;
        }
        
        if (ownerName.length < 2) {
            console.log('⚠️ 姓名長度不足，顯示提示');
            alert('請輸入完整的姓名（至少2個字）');
            ownerNameInput.focus();
            return;
        }
        
        console.log('✅ 姓名驗證通過，設置 currentOwnerName');
        currentOwnerName = ownerName;
        
        console.log('🔄 準備隱藏第一個彈窗');
        // 隱藏第一個彈窗
        hideOwnerInputModal();
        
        console.log('🔄 準備顯示確認彈窗');
        // 顯示確認彈窗
        showOwnerConfirmModal();
        
        console.log('✅ confirmOwnerName 函數執行完成');
        
    } catch (error) {
        console.error('❌ confirmOwnerName 函數執行時發生錯誤:', error);
        alert('系統錯誤，請重新整理頁面後再試');
    }
}

// 顯示確認彈窗
function showOwnerConfirmModal() {
    console.log('🔄 showOwnerConfirmModal 函數被調用');
    console.log('📊 currentFoundItem:', currentFoundItem);
    console.log('📝 currentOwnerName:', currentOwnerName);
    
    try {
        if (!currentFoundItem) {
            console.error('❌ currentFoundItem 為空');
            alert('系統錯誤：失物資訊遺失，請重新選擇失物');
            return;
        }
        
        const confirmInfo = document.getElementById('confirmInfo');
        if (!confirmInfo) {
            console.error('❌ 找不到 confirmInfo 元素');
            alert('系統錯誤：找不到確認資訊區域');
            return;
        }
        
        const timeString = formatTimeFromDatabase(currentFoundItem.found_time || currentFoundItem.created_at);
        console.log('🕒 格式化時間:', timeString);
        
        confirmInfo.innerHTML = `
            <h4>📋 歸還確認資訊</h4>
            <div class="info-row">
                <span class="info-label">失物名稱：</span>
                <span class="info-value">${currentFoundItem.name || '未知'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">發現地點：</span>
                <span class="info-value">${currentFoundItem.found_location || '未知'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">發現時間：</span>
                <span class="info-value">${timeString}</span>
            </div>
            <div class="info-row">
                <span class="info-label">物品主人：</span>
                <span class="info-value"><strong>${currentOwnerName || '未知'}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">歸還時間：</span>
                <span class="info-value">${new Date().toLocaleString('zh-TW')}</span>
            </div>
        `;
        
        const modal = document.getElementById('ownerConfirmModal');
        if (!modal) {
            console.error('❌ 找不到 ownerConfirmModal 元素');
            alert('系統錯誤：找不到確認彈窗');
            return;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ 確認彈窗顯示成功');
        
    } catch (error) {
        console.error('❌ showOwnerConfirmModal 函數執行錯誤:', error);
        alert('顯示確認彈窗時發生錯誤，請重新整理頁面');
    }
}

// 隱藏確認彈窗
function hideOwnerConfirmModal() {
    console.log('🔄 hideOwnerConfirmModal 函數被調用');
    
    const modal = document.getElementById('ownerConfirmModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('✅ 已隱藏確認彈窗');
    }
    
    document.body.style.overflow = 'auto';
    
    // 清空變數（只在取消時清空，成功完成時在 finalizeOwnerFound 中清空）
    currentFoundItem = null;
    currentOwnerName = '';
    console.log('🗑️ 已清空 currentFoundItem 和 currentOwnerName');
}

// 最終確認歸還
async function finalizeOwnerFound() {
    try {
        console.log('🔄 開始處理失物歸還流程...');
        
        const finalBtn = document.getElementById('finalConfirmBtn');
        const originalText = finalBtn.innerHTML;
        finalBtn.innerHTML = '⏳ 處理中...';
        finalBtn.disabled = true;
        
        // 1. 準備 returned_items 資料（只使用基本欄位）
        const returnedItemData = {
            name: currentFoundItem.name,
            found_location: currentFoundItem.found_location,
            claimer_name: currentOwnerName
        };
        
        // 安全地添加可選欄位（如果欄位存在）
        if (currentFoundItem.description) {
            returnedItemData.description = currentFoundItem.description;
        }
        if (currentFoundItem.story) {
            returnedItemData.story = currentFoundItem.story;
        }
        if (currentFoundItem.finder_name) {
            returnedItemData.finder_name = currentFoundItem.finder_name;
        }
        if (currentFoundItem.found_time) {
            returnedItemData.found_time = currentFoundItem.found_time;
        }
        if (currentFoundItem.image_url) {
            returnedItemData.image_url = currentFoundItem.image_url;
        }
        if (currentFoundItem.image_data) {
            returnedItemData.image_data = currentFoundItem.image_data;
        }
        if (currentFoundItem.id) {
            returnedItemData.original_lost_item_id = currentFoundItem.id;
        }
        
        console.log('📋 準備插入的資料:', returnedItemData);
        
        // 2. 插入到 returned_items 表
        const { data: insertData, error: insertError } = await supabase
            .from('returned_items')
            .insert([returnedItemData])
            .select();

        if (insertError) {
            console.error('❌ 插入歸還記錄失敗:', insertError);
            alert(`歸還記錄保存失敗：${insertError.message}`);
            finalBtn.innerHTML = originalText;
            finalBtn.disabled = false;
            return;
        }

        console.log('✅ 歸還記錄已保存:', insertData);

        // 3. 從 lost_items 表刪除
        const { error: deleteError } = await supabase
            .from('lost_items')
            .delete()
            .eq('id', currentFoundItem.id);

        if (deleteError) {
            console.error('❌ 刪除失物記錄失敗:', deleteError);
            alert(`刪除失物記錄失敗：${deleteError.message}`);
            finalBtn.innerHTML = originalText;
            finalBtn.disabled = false;
            return;
        }

        console.log('✅ 失物記錄已刪除');
        
        // 4. 播放感謝語音
        playThankYouSpeech(currentFoundItem.name, currentOwnerName);
        
        // 5. 隱藏彈窗
        hideOwnerConfirmModal();
        
        // 6. 重新載入失物列表
        await loadLostItemsFromDatabase();
        
        console.log('🎉 失物歸還流程完成！');
        
    } catch (err) {
        console.error('❌ 處理失物歸還時發生錯誤:', err);
        alert('系統錯誤，請稍後重試');
        
        const finalBtn = document.getElementById('finalConfirmBtn');
        finalBtn.innerHTML = '🎉 確認歸還';
        finalBtn.disabled = false;
    }
}

// 播放感謝語音
function playThankYouSpeech(itemName, ownerName) {
    console.log('🎵 播放感謝語音...');
    
    if (!('speechSynthesis' in window)) {
        console.warn('⚠️ 瀏覽器不支援語音功能');
        alert(`🎉 太好了！${itemName} 已經找到主人 ${ownerName} 了！\n感謝您的幫助，讓失物回到主人身邊！`);
        return;
    }
    
    const thankYouMessages = [
        `太好了！${itemName} 終於找到主人 ${ownerName} 了！感謝您的幫助！`,
        `真是太棒了！${ownerName} 的 ${itemName} 要回家了！謝謝您讓它們重新團聚！`,
        `好開心啊！${itemName} 可以回到 ${ownerName} 身邊了！您真是個好心人！`,
        `萬歲！${ownerName} 和 ${itemName} 重逢了！感謝您的熱心幫助！`
    ];
    
    const message = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)];
    
    // 停止當前語音
    if (currentUtterance) {
        speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1;
    
    utterance.onstart = function() {
        console.log('🎵 感謝語音播放開始');
        // 顯示語音提示
        showSpeechNotification(message);
    };
    
    utterance.onend = function() {
        console.log('✅ 感謝語音播放結束');
    };
    
    utterance.onerror = function(event) {
        console.error('❌ 語音播放錯誤:', event.error);
        alert(`🎉 ${message}`);
    };
    
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

// 顯示語音通知
function showSpeechNotification(message) {
    // 創建臨時通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4CAF50, #66BB6A);
        color: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        text-align: center;
        max-width: 400px;
        animation: fadeInOut 4s ease-in-out forwards;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">歸還成功！</h3>
        <p style="margin: 0; font-size: 1rem; line-height: 1.5;">${message}</p>
    `;
    
    // 添加CSS動畫
    if (!document.querySelector('#speechNotificationStyle')) {
        const style = document.createElement('style');
        style.id = 'speechNotificationStyle';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 4秒後移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// 為 ESC 鍵添加事件監聽器
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideAdminLogin();
        hideOwnerInputModal();
        hideOwnerConfirmModal();
    }
});

// 將找到主人相關函數添加到全局作用域（確保 HTML onclick 可以訪問）
window.showOwnerInputModal = showOwnerInputModal;
window.hideOwnerInputModal = hideOwnerInputModal;
window.confirmOwnerName = confirmOwnerName;
window.showOwnerConfirmModal = showOwnerConfirmModal;
window.hideOwnerConfirmModal = hideOwnerConfirmModal;
window.finalizeOwnerFound = finalizeOwnerFound;
