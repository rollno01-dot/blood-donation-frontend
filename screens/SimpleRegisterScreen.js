import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { authAPI } from '../services/api';

export default function SimpleRegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  const [step, setStep] = useState('register');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(route.params?.mobile || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputs = useRef([]);

  const handleSendOTP = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (mobile.length !== 10) {
      setError('Enter valid 10-digit mobile number');
      return;
    }

    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register({ name, mobile });
      
      if (response.data.otp) {
        Alert.alert('Registration OTP', `Your OTP is: ${response.data.otp}`);
      }
      
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
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
      await login(response.data.user);
      
      // Clear OTP state to prevent reuse
      setOtp(['', '', '', '', '', '']);
      
      Alert.alert(
        'Success',
        'Account created! Complete your donor profile.',
        [{ 
          text: 'Continue', 
          onPress: () => {
            // ✅ FIXED: Use reset instead of replace
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'Register', 
                params: { mobile, name } 
              }],
            });
          }
        }]
      );
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
      const response = await authAPI.register({ name, mobile });
      setOtp(['', '', '', '', '', '']);
      if (response.data.otp) {
        Alert.alert('Registration OTP', `Your OTP is: ${response.data.otp}`);
      }
    } catch (err) {
      Alert.alert('Info', 'Check backend console for OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP Screen
  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          setStep('register');
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
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Registration Form
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.gray700} />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="person-add" size={50} color={colors.primary} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Enter your details to continue</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="person" size={20} color={colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="phone" size={20} color={colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
              editable={!route.params?.mobile}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
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