// 失物故事牆 - 系統配置文件

// 環境配置
const CONFIG = {
    // 開發環境設定
    development: {
        // Firebase 配置
        firebase: {
            apiKey: "AIzaSyDm1Arp6DTUerSdTKjC4T4ndMRNDog4fuI",
            authDomain: "story-wall-7af82.firebaseapp.com",
            projectId: "story-wall-7af82",
            storageBucket: "story-wall-7af82.firebasestorage.app",
            messagingSenderId: "308812034466",
            appId: "1:308812034466:web:afa66ee199a49a5f49c2fb",
            measurementId: "G-QSEJ431VV0"
        },
        
        // AI 服務配置
        ai: {
            provider: 'openai', // 或 'azure', 'google' 等
            apiKey: 'YOUR_OPENAI_API_KEY', // 請替換為您的 OpenAI API Key
            model: 'gpt-3.5-turbo',
            maxTokens: 300,
            temperature: 0.8
        },
        
        // 語音服務配置
        speech: {
            provider: 'browser', // 'browser', 'azure', 'google'
            azureKey: '', // 如使用 Azure Speech
            region: 'eastasia'
        },
        
        // 圖片上傳配置
        upload: {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            compressionQuality: 0.8
        },
        
        // 應用設定
        app: {
            title: '凱旋失物故事牆',
            adminPassword: '1234', // 管理員密碼
            autoSaveInterval: 30000, // 30秒自動儲存
            maxDisplayItems: 50 // 最多顯示失物數量
        }
    },
    
    // 生產環境設定
    production: {
        firebase: {
            apiKey: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) || "AIzaSyDm1Arp6DTUerSdTKjC4T4ndMRNDog4fuI",
            authDomain: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_AUTH_DOMAIN) || "story-wall-7af82.firebaseapp.com",
            projectId: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_PROJECT_ID) || "story-wall-7af82",
            storageBucket: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_STORAGE_BUCKET) || "story-wall-7af82.firebasestorage.app",
            messagingSenderId: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_MESSAGING_SENDER_ID) || "308812034466",
            appId: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_APP_ID) || "1:308812034466:web:afa66ee199a49a5f49c2fb",
            measurementId: (typeof process !== 'undefined' && process.env && process.env.FIREBASE_MEASUREMENT_ID) || "G-QSEJ431VV0"
        },
        
        ai: {
            provider: 'openai',
            apiKey: (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) || 'YOUR_OPENAI_API_KEY',
            model: 'gpt-3.5-turbo',
            maxTokens: 300,
            temperature: 0.8
        },
        
        speech: {
            provider: 'browser',
            azureKey: (typeof process !== 'undefined' && process.env && process.env.AZURE_SPEECH_KEY) || '',
            region: 'eastasia'
        },
        
        upload: {
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            compressionQuality: 0.8
        },
        
        app: {
            title: '凱旋失物故事牆',
            adminPassword: (typeof process !== 'undefined' && process.env && process.env.ADMIN_PASSWORD) || '1234',
            autoSaveInterval: 30000,
            maxDisplayItems: 50
        }
    }
};

// 獲取當前環境配置
function getConfig() {
    // 在瀏覽器環境中，process 可能不存在，所以使用安全的方式檢查
    const env = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';
    return CONFIG[env] || CONFIG.development;
}

// 故事生成提示詞模板
const STORY_PROMPTS = {
    system: `你是一個專門為國小學生創作溫馨失物故事的AI助手。請根據提供的失物資訊，創作一個擬人化的故事，讓失物能夠「說話」表達自己的心情和對主人的思念。

故事要求：
1. 語調要溫馨、可愛、適合國小學生
2. 字數控制在100-150字之間
3. 要包含失物對主人的思念
4. 鼓勵主人來認領
5. 使用第一人稱（"我是..."）
6. 語言要簡單易懂，充滿童趣

請避免：
- 悲傷或恐怖的內容
- 複雜的詞彙
- 太長的句子
- 負面情緒`,

    user: `請為以下失物創作一個故事：
失物名稱：{itemName}
發現地點：{location}
發現時間：{time}
物品描述：{description}

請創作一個溫馨的擬人化故事，讓這個失物能夠表達對主人的思念。`
};

// 地點中文對應
const LOCATION_MAP = {
    'playground': '操場',
    'library': '圖書館',
    'gym': 川堂',
    'classroom': '教室',
    'cafeteria': '校外',
    'hallway': '走廊',
    'restroom': '廁所',
    'other': '其他'
};

// 時間格式化函數
const TIME_FORMATS = {
    // 相對時間格式
    relative: (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays === 2) return '前天';
        if (diffDays <= 7) return `${diffDays}天前`;
        if (diffDays <= 30) return `${Math.floor(diffDays / 7)}週前`;
        return `${Math.floor(diffDays / 30)}個月前`;
    },
    
    // 絕對時間格式
    absolute: (date) => {
        return new Date(date).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// API 端點配置
const API_ENDPOINTS = {
    // Supabase REST API
    items: '/rest/v1/lost_items',
    locations: '/rest/v1/locations',
    admins: '/rest/v1/admins',
    templates: '/rest/v1/story_templates',
    settings: '/rest/v1/system_settings',
    logs: '/rest/v1/operation_logs',
    
    // 自定義 API
    upload: '/api/upload',
    generateStory: '/api/generate-story',
    textToSpeech: '/api/text-to-speech'
};

// 錯誤訊息
const ERROR_MESSAGES = {
    'NETWORK_ERROR': '網路連線異常，請檢查網路狀態',
    'UPLOAD_TOO_LARGE': '圖片檔案太大，請選擇小於5MB的圖片',
    'UPLOAD_INVALID_TYPE': '不支援的圖片格式，請使用JPG、PNG或WebP格式',
    'STORY_GENERATION_FAILED': '故事生成失敗，請稍後重試',
    'SAVE_FAILED': '儲存失敗，請檢查網路連線',
    'INVALID_PASSWORD': '密碼錯誤，請重新輸入',
    'CAMERA_NOT_SUPPORTED': '您的瀏覽器不支援相機功能',
    'CAMERA_PERMISSION_DENIED': '相機權限被拒絕，請在瀏覽器設定中允許相機權限',
    'SPEECH_NOT_SUPPORTED': '您的瀏覽器不支援語音功能'
};

// 成功訊息
const SUCCESS_MESSAGES = {
    'ITEM_SAVED': '失物資料已成功儲存',
    'ITEM_UPDATED': '失物資料已成功更新',
    'ITEM_CLAIMED': '失物已標記為已認領',
    'ITEM_DELETED': '失物記錄已刪除',
    'STORY_GENERATED': '故事已成功生成',
    'IMAGE_UPLOADED': '圖片已成功上傳'
};

// 預設的故事模板（備用）
const DEFAULT_STORY_TEMPLATES = [
    "哈囉！我是{name}！{time}，我在{location}被發現了。我好想念我的小主人，希望他快來帶我回家。我會乖乖地等待，直到我們重新相遇的那一刻！",
    "大家好，我是{name}！我在{location}孤單地等待著。我記得小主人總是很愛護我，現在我好想念那溫暖的感覺。如果你認識我的主人，請告訴他我在這裡等他！",
    "嗨！我是{name}！{time}我在{location}和小主人走散了。我每天都在想念我們一起度過的快樂時光。我相信小主人一定很擔心我，快來找我吧！",
    "你好！我是{name}！我在{location}被好心人發現。雖然現在很孤單，但我相信小主人一定會來找我的。我會耐心等待，因為我知道我們的緣分還沒結束！"
];

// 驗證配置
const VALIDATION = {
    itemName: {
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/
    },
    
    location: {
        required: true,
        validOptions: Object.values(LOCATION_MAP)
    },
    
    description: {
        required: false,
        maxLength: 500
    },
    
    finderName: {
        required: false,
        maxLength: 50,
        pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/
    }
};

// 如果在瀏覽器環境，將配置添加到 window 對象
if (typeof window !== 'undefined') {
    window.LostItemsConfig = {
        config: getConfig(),
        storyPrompts: STORY_PROMPTS,
        locationMap: LOCATION_MAP,
        timeFormats: TIME_FORMATS,
        apiEndpoints: API_ENDPOINTS,
        errorMessages: ERROR_MESSAGES,
        successMessages: SUCCESS_MESSAGES,
        defaultStoryTemplates: DEFAULT_STORY_TEMPLATES,
        validation: VALIDATION
    };
}

// 如果在 Node.js 環境，使用 module.exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getConfig,
        STORY_PROMPTS,
        LOCATION_MAP,
        TIME_FORMATS,
        API_ENDPOINTS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        DEFAULT_STORY_TEMPLATES,
        VALIDATION
    };
}
