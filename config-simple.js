// 簡化的配置文件 - 用於測試
console.log('🔄 開始載入簡化配置...');

// 基本配置
const SIMPLE_CONFIG = {
    supabase: {
        url: 'https://oytgyizrtuqyxvxtgrlv.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dGd5aXpydHVxeXh2eHRncmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzUwNjgsImV4cCI6MjA3MTE1MTA2OH0.OiHI8KP-p0OOKo6XvPOARsz0pYqWBEMowJbL0wOzrQs'
    },
    app: {
        adminPassword: '1234'
    }
};

// 簡化的地點映射
const SIMPLE_LOCATION_MAP = {
    'playground': '操場',
    'library': '圖書館',
    'gym': '川堂',
    'cafeteria': '校外',
    'classroom': '教室',
    'corridor': '走廊',
    'toilet': '廁所',
    'other': '其他'
};

// 設置全域變數
if (typeof window !== 'undefined') {
    console.log('✅ 在瀏覽器環境中設置全域配置');
    
    window.LostItemsConfig = {
        config: SIMPLE_CONFIG,
        locationMap: SIMPLE_LOCATION_MAP
    };
    
    console.log('✅ window.LostItemsConfig 已設置:', window.LostItemsConfig);
} else {
    console.log('❌ 不在瀏覽器環境中');
}

console.log('✅ 簡化配置載入完成');
