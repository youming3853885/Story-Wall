// 管理系統腳本

// 全局變數
let currentSection = 'upload';
let capturedPhoto = null;
let currentItemData = null;
let supabase;

// 初始化 Supabase
function initializeSupabase() {
    if (typeof window.LostItemsConfig !== 'undefined') {
        const config = window.LostItemsConfig.config;
        supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
        console.log('管理系統 Supabase 客戶端已初始化');
    } else {
        console.error('配置文件未載入');
    }
}

// 注意：不再使用靜態示範資料，所有資料都從 Supabase 資料庫載入

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
    initializeSupabase();
    initializeAdmin();
    setupEventListeners();
    loadItemsFromDatabase();
    updateStatisticsFromDatabase();
    
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
    // 相機相關
    document.getElementById('startCameraBtn').addEventListener('click', startCamera);
    document.getElementById('captureBtn').addEventListener('click', capturePhoto);
    document.getElementById('uploadFileBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // 故事生成
    document.getElementById('generateStoryBtn').addEventListener('click', generateStory);
    document.getElementById('regenerateStoryBtn').addEventListener('click', regenerateStory);
    document.getElementById('saveItemBtn').addEventListener('click', saveItem);
    
    // 搜尋和篩選
    document.getElementById('searchInput').addEventListener('input', searchItems);
    document.getElementById('statusFilter').addEventListener('change', searchItems);
    document.getElementById('locationFilter').addEventListener('change', searchItems);
    
    // 搜尋按鈕點擊事件
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchItems);
    }
}

// 顯示指定區域
function showSection(sectionName) {
    // 隱藏所有區域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有導航項目的active狀態
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 顯示指定區域
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // 設置對應導航項目為active
    const navItems = document.querySelectorAll('.nav-item');
    if (sectionName === 'upload') navItems[0].classList.add('active');
    else if (sectionName === 'manage') {
        navItems[1].classList.add('active');
        // 切換到管理頁面時載入失物資料
        loadItemsFromDatabase();
    }
    else if (sectionName === 'stats') {
        navItems[2].classList.add('active');
        // 切換到統計頁面時更新統計
        updateStatisticsFromDatabase();
    }
    
    currentSection = sectionName;
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
        alert('無法啟動相機，請檢查權限設定或使用檔案上傳功能');
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
        <div class="camera-overlay">
            <button id="startCameraBtn" class="camera-btn primary">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" fill="currentColor"/>
                </svg>
                開啟相機
            </button>
        </div>
    `;
    
    document.getElementById('startCameraBtn').addEventListener('click', startCamera);
    capturedPhoto = null;
    updateStepStatus(1);
}

// 處理檔案上傳
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedPhoto = e.target.result;
            
            // 顯示上傳的圖片
            const container = document.getElementById('cameraContainer');
            container.innerHTML = `
                <img src="${capturedPhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;">
                <button onclick="resetCamera()" class="camera-btn primary" style="position: absolute; bottom: 10px; right: 10px;">重新選擇</button>
            `;
            
            updateStepStatus(2);
            console.log('檔案已上傳');
        };
        reader.readAsDataURL(file);
    }
}

// 更新步驟狀態
function updateStepStatus(activeStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index + 1 <= activeStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// 生成失物故事
function generateStory() {
    const itemName = document.getElementById('itemName').value;
    const foundLocation = document.getElementById('foundLocation').value;
    const foundTime = document.getElementById('foundTime').value;
    
    if (!itemName || !foundLocation) {
        alert('請填寫失物名稱和發現地點！');
        return;
    }
    
    if (!capturedPhoto) {
        alert('請先拍照或上傳失物照片！');
        return;
    }
    
    // 模擬AI故事生成
    const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
    const timeStr = foundTime ? formatTime(foundTime) : '今天';
    
    const story = template
        .replace('{name}', itemName)
        .replace('{location}', foundLocation)
        .replace('{time}', timeStr);
    
    // 顯示故事預覽
    document.getElementById('storyPreview').style.display = 'block';
    document.getElementById('generatedStory').textContent = story;
    document.getElementById('saveItemBtn').style.display = 'inline-flex';
    
    updateStepStatus(3);
    
    // 保存當前資料
    currentItemData = {
        name: itemName,
        location: foundLocation,
        foundTime: foundTime,
        description: document.getElementById('itemDescription').value,
        finder: document.getElementById('finderName').value,
        image: capturedPhoto,
        story: story,
        status: 'unclaimed'
    };
    
    console.log('故事已生成');
}

// 重新生成故事
function regenerateStory() {
    if (currentItemData) {
        const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
        const timeStr = currentItemData.foundTime ? formatTime(currentItemData.foundTime) : '今天';
        
        const newStory = template
            .replace('{name}', currentItemData.name)
            .replace('{location}', currentItemData.location)
            .replace('{time}', timeStr);
        
        document.getElementById('generatedStory').textContent = newStory;
        currentItemData.story = newStory;
        
        console.log('故事已重新生成');
    }
}

// 儲存失物資料
async function saveItem() {
    if (!currentItemData) {
        alert('請先生成故事！');
        return;
    }
    
    // 保存到 Supabase 資料庫
    try {
        const { data, error } = await supabase
            .from('lost_items')
            .insert([{
                name: currentItemData.name,
                found_location: currentItemData.location,
                story: currentItemData.story,
                image_data: currentItemData.image,
                finder_name: currentItemData.finder,
                found_time: currentItemData.foundTime
            }])
            .select();

        if (error) {
            console.error('❌ 儲存失物到資料庫失敗:', error);
            alert(`儲存失敗：${error.message}`);
            return;
        }

        console.log('✅ 失物已成功儲存到資料庫:', data);
        alert('失物資料已成功儲存！');
        
        // 重新載入資料庫資料
        await loadItemsFromDatabase();
        
    } catch (err) {
        console.error('❌ 儲存失物時發生錯誤:', err);
        alert('發生錯誤，請稍後重試');
        return;
    }
    
    // 重置表單
    resetUploadForm();
    console.log('失物已儲存:', currentItemData);
}

// 重置上傳表單
function resetUploadForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('foundLocation').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('finderName').value = '';
    document.getElementById('storyPreview').style.display = 'none';
    document.getElementById('saveItemBtn').style.display = 'none';
    
    resetCamera();
    updateStepStatus(1);
    
    // 重設時間為當前時間
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16);
    document.getElementById('foundTime').value = formattedTime;
    
    currentItemData = null;
}

// 格式化時間
function formatTime(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    return `${diffDays}天前`;
}

// 從資料庫載入失物
async function loadItemsFromDatabase() {
    try {
        console.log('🔄 管理員頁面：開始載入失物資料...');
        
        if (!supabase) {
            console.error('❌ Supabase 客戶端未初始化');
            showLoadError('資料庫連線失敗，請重新整理頁面');
            return;
        }

        const { data, error } = await supabase
            .from('lost_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ 載入失物資料失敗:', error);
            showLoadError(`載入失敗：${error.message}`);
            return;
        }

        console.log(`✅ 從資料庫載入了 ${data.length} 筆失物資料`);
        
        if (data.length === 0) {
            showEmptyState();
        } else {
            displayItemsInTable(data);
        }
        
        updateStatisticsFromDatabase();
    } catch (err) {
        console.error('❌ 載入失物資料時發生錯誤:', err);
        showLoadError('發生未預期的錯誤，請重新整理頁面');
    }
}

// 顯示載入錯誤
function showLoadError(message) {
    const tableBody = document.querySelector('#itemsTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    <div style="margin-bottom: 1rem;">❌ ${message}</div>
                    <button onclick="loadItemsFromDatabase()" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔄 重新載入
                    </button>
                </td>
            </tr>
        `;
    }
}

// 顯示空狀態
function showEmptyState() {
    const tableBody = document.querySelector('#itemsTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    <div style="margin-bottom: 1rem;">📝 目前沒有失物資料</div>
                    <p style="color: #999; font-size: 0.9rem;">失物將在用戶上傳後顯示在這裡</p>
                </td>
            </tr>
        `;
    }
}

// 在表格中顯示失物
function displayItemsInTable(items) {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #7F8C8D;">目前沒有失物記錄</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        const imageSource = item.image_data || item.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"%3E%3Crect width="60" height="60" fill="%23F0F0F0"/%3E%3Ctext x="30" y="35" text-anchor="middle" font-family="Arial" font-size="10" fill="%23999"%3E無圖%3C/text%3E%3C/svg%3E';
        const timeString = formatTimeFromDatabase(item.found_time || item.created_at);
        
        row.innerHTML = `
            <td><img src="${imageSource}" alt="${item.name}" class="item-image-thumb"></td>
            <td>${item.name}</td>
            <td>${item.found_location}</td>
            <td>${timeString}</td>
            <td><span class="status-badge unclaimed">展示中</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editDatabaseItem(${item.id})">編輯</button>
                    <button class="action-btn claim" onclick="returnItem(${item.id}, '${item.name}')">物品已歸還</button>
                    <button class="action-btn delete" onclick="deleteDatabaseItem(${item.id})">刪除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 格式化資料庫時間
function formatTimeFromDatabase(timeString) {
    if (!timeString) return '未知';
    
    const date = new Date(timeString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return `${Math.floor(diffDays / 7)}週前`;
}

// 搜尋和篩選失物 - 基於資料庫資料
async function searchItems() {
    try {
        console.log('🔍 開始搜尋失物...');
        
        if (!supabase) {
            console.error('❌ Supabase 客戶端未初始化');
            return;
        }

        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const locationFilter = document.getElementById('locationFilter').value;

        console.log('搜尋條件:', { searchTerm, statusFilter, locationFilter });

        // 從資料庫獲取所有失物資料
        const { data: items, error } = await supabase
            .from('lost_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ 載入失物資料失敗:', error);
            return;
        }

        // 篩選資料
        let filteredItems = items;

        // 文字搜尋
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => {
                return item.name.toLowerCase().includes(searchTerm) || 
                       (item.found_location && item.found_location.toLowerCase().includes(searchTerm)) ||
                       (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                       (item.finder_name && item.finder_name.toLowerCase().includes(searchTerm));
            });
        }

        // 地點篩選
        if (locationFilter) {
            filteredItems = filteredItems.filter(item => 
                item.found_location === locationFilter
            );
        }

        // 注意：狀態篩選暫時不使用，因為所有 lost_items 都是「展示中」狀態
        // 已歸還的失物會移到 returned_items 表

        console.log(`✅ 篩選結果：${filteredItems.length} 個失物`);
        
        // 顯示篩選結果
        displayItemsInTable(filteredItems);
        
    } catch (err) {
        console.error('❌ 搜尋失物時發生錯誤:', err);
    }
}

// 注意：舊的 claimItem, unclaimItem 函數已移除，現在使用 returnItem 函數

// 注意：舊的 editItem 函數已移除，現在使用 editDatabaseItem 函數

// 注意：舊的 deleteItem 函數已移除，現在使用 deleteDatabaseItem 函數

// 更新統計資料（從資料庫）
async function updateStatisticsFromDatabase() {
    try {
        if (!supabase) {
            console.error('Supabase 客戶端未初始化');
            return;
        }

        // 獲取展示中的失物數量
        const { count: totalCount, error: totalError } = await supabase
            .from('lost_items')
            .select('*', { count: 'exact', head: true });

        // 獲取已歸還的失物數量
        const { count: returnedCount, error: returnedError } = await supabase
            .from('returned_items')
            .select('*', { count: 'exact', head: true });

        if (totalError || returnedError) {
            console.error('載入統計資料失敗:', totalError || returnedError);
            return;
        }

        const totalItems = (totalCount || 0) + (returnedCount || 0);
        const claimedItems = returnedCount || 0;
        const unclaimedItems = totalCount || 0;
        const claimRate = totalItems > 0 ? Math.round((claimedItems / totalItems) * 100) : 0;

        // 更新統計顯示
        const totalItemsElement = document.getElementById('totalItems');
        const claimedItemsElement = document.getElementById('claimedItems');
        const unclaimedItemsElement = document.getElementById('unclaimedItems');
        const claimRateElement = document.getElementById('claimRate');

        if (totalItemsElement) totalItemsElement.textContent = totalItems;
        if (claimedItemsElement) claimedItemsElement.textContent = claimedItems;
        if (unclaimedItemsElement) unclaimedItemsElement.textContent = unclaimedItems;
        if (claimRateElement) claimRateElement.textContent = claimRate + '%';

    } catch (err) {
        console.error('更新統計資料時發生錯誤:', err);
    }
}

// 物品歸還功能
async function returnItem(itemId, itemName) {
    if (!confirm(`確定要將「${itemName}」標記為已歸還嗎？\n\n此操作將：\n1. 從展示牆移除這個失物\n2. 將資料轉移到已歸還物品記錄\n3. 無法復原`)) {
        return;
    }

    try {
        // 首先獲取失物的完整資料
        const { data: lostItem, error: fetchError } = await supabase
            .from('lost_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (fetchError) {
            console.error('獲取失物資料失敗:', fetchError);
            alert('獲取失物資料失敗，請稍後重試');
            return;
        }

        // 將資料插入到已歸還物品表
        const { data: returnedData, error: insertError } = await supabase
            .from('returned_items')
            .insert([
                {
                    original_lost_item_id: lostItem.id,
                    name: lostItem.name,
                    description: lostItem.description,
                    image_data: lostItem.image_data,
                    image_url: lostItem.image_url,
                    found_location: lostItem.found_location,
                    found_time: lostItem.found_time,
                    story: lostItem.story,
                    finder_name: lostItem.finder_name,
                    claimer_name: prompt('請輸入認領者姓名（可選）:') || '未填寫',
                    returned_by: '管理員',
                    claim_time: new Date().toISOString(),
                    notes: `物品已於 ${new Date().toLocaleString('zh-TW')} 歸還`
                }
            ]);

        if (insertError) {
            console.error('儲存已歸還物品失敗:', insertError);
            alert('儲存已歸還物品失敗，請稍後重試');
            return;
        }

        // 從失物表中刪除
        const { error: deleteError } = await supabase
            .from('lost_items')
            .delete()
            .eq('id', itemId);

        if (deleteError) {
            console.error('刪除失物記錄失敗:', deleteError);
            alert('刪除失物記錄失敗，請稍後重試');
            return;
        }

        console.log(`失物「${itemName}」已成功歸還並轉移到歷史記錄`);
        alert(`失物「${itemName}」已成功標記為已歸還！`);

        // 重新載入數據
        await loadItemsFromDatabase();
        await updateStatisticsFromDatabase();

    } catch (err) {
        console.error('處理物品歸還時發生錯誤:', err);
        alert('處理失敗，請稍後重試');
    }
}

// 刪除資料庫中的失物
async function deleteDatabaseItem(itemId) {
    if (!confirm('確定要刪除這個失物記錄嗎？此操作無法復原！')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('lost_items')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('刪除失物失敗:', error);
            alert('刪除失敗，請稍後重試');
            return;
        }

        console.log(`失物 ID ${itemId} 已刪除`);
        alert('失物記錄已刪除');

        // 重新載入數據
        await loadItemsFromDatabase();
        await updateStatisticsFromDatabase();

    } catch (err) {
        console.error('刪除失物時發生錯誤:', err);
        alert('刪除失敗，請稍後重試');
    }
}

// 編輯資料庫中的失物
async function editDatabaseItem(itemId) {
    try {
        const { data: item, error } = await supabase
            .from('lost_items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) {
            console.error('獲取失物資料失敗:', error);
            alert('獲取失物資料失敗');
            return;
        }

        // 跳轉到上傳區域並填入資料
        showSection('upload');
        
        // 填入表單數據
        const itemNameElement = document.getElementById('itemName');
        const foundLocationElement = document.getElementById('foundLocation');
        const foundTimeElement = document.getElementById('foundTime');
        const itemDescriptionElement = document.getElementById('itemDescription');
        const finderNameElement = document.getElementById('finderName');

        if (itemNameElement) itemNameElement.value = item.name || '';
        if (foundLocationElement) foundLocationElement.value = item.found_location || '';
        if (foundTimeElement) foundTimeElement.value = item.found_time ? item.found_time.slice(0, 16) : '';
        if (itemDescriptionElement) itemDescriptionElement.value = item.description || '';
        if (finderNameElement) finderNameElement.value = item.finder_name || '';

        // 如果有圖片數據，顯示圖片
        if (item.image_data) {
            capturedPhoto = item.image_data;
            const container = document.getElementById('cameraContainer');
            if (container) {
                container.innerHTML = `
                    <img src="${item.image_data}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;">
                    <button onclick="resetCamera()" class="camera-btn primary" style="position: absolute; bottom: 10px; right: 10px;">重新選擇</button>
                `;
            }
        }

        // 如果有故事，顯示故事預覽
        if (item.story) {
            const storyPreviewElement = document.getElementById('storyPreview');
            const generatedStoryElement = document.getElementById('generatedStory');
            const saveItemBtnElement = document.getElementById('saveItemBtn');
            
            if (storyPreviewElement) storyPreviewElement.style.display = 'block';
            if (generatedStoryElement) generatedStoryElement.textContent = item.story;
            if (saveItemBtnElement) {
                saveItemBtnElement.style.display = 'inline-flex';
                saveItemBtnElement.textContent = '更新失物資料';
            }
            updateStepStatus(3);
        }

        // 設置編輯模式
        currentItemData = { ...item, isEditing: true };
        
        console.log(`開始編輯失物: ${item.name}`);

    } catch (err) {
        console.error('編輯失物時發生錯誤:', err);
        alert('編輯失敗，請稍後重試');
    }
}

// 輔助功能
window.showSection = showSection;
window.backToDisplay = backToDisplay;
window.returnItem = returnItem;
window.editDatabaseItem = editDatabaseItem;
window.deleteDatabaseItem = deleteDatabaseItem;
window.resetCamera = resetCamera;
