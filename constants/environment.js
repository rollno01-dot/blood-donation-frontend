// frontend/constants/environment.js
// Easy switching between local and public access

// ============================================
// 🔧 CHANGE THIS LINE TO SWITCH ENVIRONMENTS
// ============================================
// Set to 'public' when using tunnel (testing from anywhere)
// Set to 'local' when phone is on same WiFi
const ACTIVE_ENV = 'public';  // <---- CHANGE THIS

// ============================================
// Environment Configurations
// ============================================
const environments = {
  // 🌐 PUBLIC TUNNEL - Use for testing from anywhere
  public: {
    API_URL: 'https://bloodapp-prxy.ayooub.me/api',  // Your tunnel URL
    name: '🌐 Public Internet',
    description: 'Accessible from anywhere with tunnel running',
  },
  
  // 📱 LOCAL NETWORK - Use when phone is on same WiFi
  local: {
    API_URL: 'http://10.61.106.230:5000/api',  // Your network IP
    name: '📱 Local Network',
    description: 'Same WiFi network only',
  },
  
  // 🏠 EMULATOR - Use for Android/iOS emulator only
  emulator: {
    API_URL: 'http://localhost:5000/api',
    name: '🏠 Emulator',
    description: 'Local emulator only',
  },
};

// Select current environment
const current = environments[ACTIVE_ENV];

export const API_URL = current.API_URL;
export const ENV_NAME = current.name;
export const ENV_DESCRIPTION = current.description;

// Debug log (shows in Metro bundler)
console.log(`\n${'='.repeat(50)}`);
console.log(`🩸 LifeLine App Configuration`);
console.log(`${'='.repeat(50)}`);
console.log(`📡 Environment: ${ENV_NAME}`);
console.log(`🔗 API URL: ${API_URL}`);
console.log(`📝 ${ENV_DESCRIPTION}`);
console.log(`${'='.repeat(50)}\n`);