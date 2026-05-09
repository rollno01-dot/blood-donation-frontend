// frontend/constants/config.js

// ============================================
// 🔧 PRODUCTION CONFIGURATION
// ============================================

// ✅ Production backend on Render
export const API_URL = 'https://blood-donation-backend-2-dbeu.onrender.com/api';

// ✅ Backup URL (if primary fails - optional)
export const BACKUP_API_URL = 'https://blood-donation-backend-2-dbeu.onrender.com/api';

// ✅ Environment detection
export const IS_DEVELOPMENT = __DEV__;
export const IS_PRODUCTION = !__DEV__;

// ✅ Get current API URL (with fallback)
export const getApiUrl = () => {
  return API_URL;
};

// ✅ Export base URL without /api for health checks
export const BASE_URL = API_URL.replace('/api', '');

export const APP_CONFIG = {
  appName: 'LifeLine',
  version: '1.0.0',
  appVersion: '1.0.0',
  buildNumber: 1,
  
  // Blood groups
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  
  // Urgency levels for blood requests
  urgencyLevels: ['Normal', 'Urgent', 'Emergency'],
  
  // Urgency colors
  urgencyColors: {
    Normal: '#4CAF50',    // Green
    Urgent: '#FF9800',     // Orange
    Emergency: '#F44336'   // Red
  },
  
  // Supported languages
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  ],
  
  // OTP settings
  otpLength: 6,
  otpExpiryMinutes: 10,
  
  // Timeouts (in milliseconds)
  requestTimeout: 30000,      // 30 seconds
  otpResendDelay: 60000,      // 1 minute
  
  // Feature flags
  enableAnalytics: false,
  enablePushNotifications: false,
};

// Debug logs (only in development)
if (__DEV__) {
  console.log('\n🩸 LifeLine App');
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`📱 Mode: ${IS_PRODUCTION ? '🚀 Production' : '🔧 Development'}`);
  console.log(`📦 Version: ${APP_CONFIG.version}\n`);
}