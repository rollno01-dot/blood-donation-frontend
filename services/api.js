// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

// Create axios instance with /api prefix
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for JWT token
api.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem('token');
    if (!token) token = await AsyncStorage.getItem('@token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.url);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('@token');
    }
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message
    });
    return Promise.reject(error);
  }
);

// ✅ FIXED: Donor API with all methods
export const donorAPI = {
  getAll: () => api.get('/donors'),
  getDonors: () => api.get('/donors'),  // Alias for getAll
  getById: (id) => api.get(`/donors/${id}`),
  getByBloodGroup: (bloodGroup) => api.get(`/donors/blood-group/${bloodGroup}`),
  create: (donorData) => api.post('/donors', donorData),
  update: (id, donorData) => api.put(`/donors/${id}`, donorData),
  delete: (id) => api.delete(`/donors/${id}`),
  search: (query) => api.get(`/donors/search?q=${query}`),
  registerDonor: (donorData) => {
    console.log('📝 Registering donor:', donorData.bloodGroup);
    return api.post('/donors', donorData);
  },
};

// Fund API endpoints
export const fundAPI = {
  getFundDetails: () => api.get('/fund'),
  contribute: (data) => api.post('/fund/contribute', data),
  getTransactionHistory: () => api.get('/transactions'),
};

// Request API endpoints
export const requestAPI = {
  getAll: () => api.get('/requests'),
  getById: (id) => api.get(`/requests/${id}`),
  create: (requestData) => api.post('/requests', requestData),
  update: (id, requestData) => api.put(`/requests/${id}`, requestData),
  delete: (id) => api.delete(`/requests/${id}`),
};

// Auth API endpoints
export const authAPI = {
  register: (userData) => {
    console.log('📱 Registering user:', userData.mobile);
    return api.post('/users/register', userData);
  },
  
  sendOTP: (mobile) => {
    console.log('📤 Sending OTP for:', mobile);
    return api.post('/users/send-otp', { mobile });
  },
  
  verifyOTP: (mobileOrData, otpCode) => {
    let mobile, otp;
    
    if (typeof mobileOrData === 'object' && mobileOrData !== null) {
      mobile = mobileOrData.mobile;
      otp = mobileOrData.otp;
    } else {
      mobile = mobileOrData;
      otp = otpCode;
    }
    
    console.log('🔐 Verifying OTP:', { mobile, otp });
    return api.post('/users/verify-otp', { mobile, otp });
  },
  
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (userData) => api.put('/users/profile', userData),
  logout: () => api.post('/users/logout'),
  deleteAccount: () => api.delete('/users/profile'),
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('@token', token);
      console.log('✅ Token saved');
    }
  },
  
  setUser: async (user) => {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('@user', JSON.stringify(user));
    }
  },
  
  clearAuth: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('@token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('@user');
  },
  
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
  
  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },
  
  getUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default api;