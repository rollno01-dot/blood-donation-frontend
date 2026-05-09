import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { donorAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDonor, setIsDonor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user');
      const token = await AsyncStorage.getItem('@token');
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        await checkDonorStatus(parsedUser._id);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDonorStatus = async (userId) => {
    try {
      const response = await donorAPI.getDonors({ userId });
      const donorExists = response.data.donors?.length > 0;
      setIsDonor(donorExists);
      return donorExists;
    } catch (error) {
      setIsDonor(false);
      return false;
    }
  };

  const login = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    await checkDonorStatus(userData._id);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@user', '@token']);
    setUser(null);
    setIsAuthenticated(false);
    setIsDonor(false);
  };

  const updateDonorStatus = async () => {
    if (user?._id) {
      await checkDonorStatus(user._id);
    }
  };

  const setDonorStatus = (status) => {
    setIsDonor(status);
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isDonor,
      loading,
      login,
      logout,
      updateDonorStatus,
      setDonorStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};