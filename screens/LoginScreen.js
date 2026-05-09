import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { authAPI } from '../services/api';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputs = useRef([]);

  const handleSendOTP = async () => {
    if (mobile.length !== 10) {
      setError('Enter valid 10-digit mobile number');
      return;
    }

    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register({
        name: `User${mobile.slice(-4)}`,
        mobile: mobile,
      });
      
      if (response.data.otp) {
        Alert.alert('Login OTP', `Your OTP is: ${response.data.otp}`);
      } else {
        Alert.alert('Success', 'OTP sent to your mobile number');
      }
      
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } catch (err) {
      Alert.alert('Info', 'Check backend console for OTP');
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyOTP({ mobile, otp: otpCode });
      
      await AsyncStorage.setItem('@token', response.data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
      
      // Clear OTP state
      setOtp(['', '', '', '', '', '']);
      
      login(response.data.user);
      
      // Use replace to prevent going back
      navigation.replace('Main');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: `User${mobile.slice(-4)}`,
        mobile: mobile,
      });
      setOtp(['', '', '', '', '', '']);
      if (response.data.otp) {
        Alert.alert('Login OTP', `Your OTP is: ${response.data.otp}`);
      }
    } catch (err) {
      Alert.alert('Info', 'Check backend console for OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'mobile') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="bloodtype" size={50} color={colors.primary} />
            </View>
            <Text style={styles.title}>LifeLine</Text>
            <Text style={styles.subtitle}>Blood Donation & Community Fund</Text>
          </View>
          
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="phone" size={20} color={colors.gray500} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter 10-digit mobile number" 
                keyboardType="phone-pad" 
                maxLength={10} 
                value={mobile} 
                onChangeText={setMobile}
                autoFocus
              />
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSendOTP} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.registerContainer}>
              <View style={styles.registerRow}>
                <TouchableOpacity 
                  style={[styles.registerOption, styles.userOption]}
                  onPress={() => navigation.navigate('SimpleRegister', { mobile })}
                >
                  <MaterialIcons name="person" size={18} color={colors.secondary} />
                  <Text style={styles.registerOptionText}>New User</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.registerOption, styles.donorOption]}
                  onPress={() => navigation.navigate('Register', { mobile })}
                >
                  <MaterialIcons name="favorite" size={18} color={colors.primary} />
                  <Text style={[styles.registerOptionText, styles.donorOptionText]}>New Donor</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        setStep('mobile');
        setOtp(['', '', '', '', '', '']);
        setError('');
      }}>
        <MaterialIcons name="arrow-back" size={24} color={colors.gray700} />
      </TouchableOpacity>
      
      <View style={styles.otpContainer}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="message" size={50} color={colors.primary} />
        </View>
        <Text style={styles.otpTitle}>Verify OTP</Text>
        <Text style={styles.otpSubtitle}>Enter the code sent to +91 {mobile}</Text>

        <View style={styles.otpInputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => otpInputs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOTPChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.buttonDisabled]} 
          onPress={handleVerifyOTP} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerIcon: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: colors.primary + '15', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.gray600, marginTop: 8 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray900, marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, 
    paddingHorizontal: 12, marginBottom: 20, backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  button: { 
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 25, 
    alignItems: 'center', marginTop: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 10 },
  registerContainer: { marginTop: 24 },
  registerRow: { flexDirection: 'row', gap: 10 },
  registerOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: colors.secondary },
  userOption: { borderColor: colors.secondary },
  donorOption: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  registerOptionText: { fontSize: 14, fontWeight: '500', color: colors.secondary, marginLeft: 6 },
  donorOptionText: { color: colors.primary },
  
  otpContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  otpTitle: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 20 },
  otpSubtitle: { fontSize: 16, color: colors.gray600, marginTop: 8, marginBottom: 30 },
  otpInputContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  verifyButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 25, alignItems: 'center', width: '100%' },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendText: { color: colors.primary, fontSize: 14, marginTop: 20 },
});