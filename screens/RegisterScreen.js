import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { APP_CONFIG } from '../constants/config';
import { donorAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RegisterScreen({ navigation }) {
  const { login, setDonorStatus, isAuthenticated } = useAuth();
  const [step, setStep] = useState('register'); // 'register' or 'otp'
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    bloodGroup: '',
    city: '',
    state: 'Tamil Nadu',
    age: '',
    gender: '',
    lastDonationMonth: '',
    lastDonationYear: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');

  const otpInputs = React.useRef([]);

  // Working back button using navigation
  const handleBackPress = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@user');
      if (navigation && navigation.replace) {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSendOTP = async () => {
    // Validation
    if (!form.name || form.name.trim() === '') {
      setError('Please enter your name');
      return;
    }
    if (!form.mobile || form.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!form.bloodGroup) {
      setError('Please select your blood group');
      return;
    }
    if (!form.city) {
      setError('Please enter your city');
      return;
    }
    if (form.age && (parseInt(form.age) < 18 || parseInt(form.age) > 65)) {
      setError('Age must be between 18 and 65');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register({
        name: form.name,
        mobile: form.mobile,
      });
      setUserId(response.data.userId);
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your mobile number');
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

    setLoading(true);
    setError('');
    try {
      const response = await authAPI.verifyOTP({
        mobile: form.mobile,
        otp: otpCode,
      });

      await AsyncStorage.setItem('@token', response.data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
      login(response.data.user);

      let lastDonationDate = null;
      if (form.lastDonationMonth && form.lastDonationYear) {
        const monthIndex = MONTHS.indexOf(form.lastDonationMonth);
        lastDonationDate = new Date(parseInt(form.lastDonationYear), monthIndex, 1);
      }

      const donorData = {
        bloodGroup: form.bloodGroup,
        location: form.city,
        district: '',
        state: form.state || 'Tamil Nadu',
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        lastDonationDate: lastDonationDate,
      };

      await donorAPI.registerDonor(donorData);
      setDonorStatus(true);
      
      Alert.alert(
        'Registration Successful! 🎉',
        'You are now registered as a blood donor. Thank you for saving lives!',
        [{ text: 'Continue', onPress: () => handleSuccess() }]
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Navigate to Main (tab navigator) instead of Home
  const handleSuccess = () => {
    if (navigation && navigation.replace) {
      navigation.replace('Main'); // 'Main' is your main tab navigator
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // OTP Screen
  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('register')}>
          <MaterialIcons name="arrow-back" size={24} color={colors.gray700} />
        </TouchableOpacity>
        
        <View style={styles.otpContainer}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="message" size={50} color={colors.primary} />
          </View>
          <Text style={styles.otpTitle}>Verify OTP</Text>
          <Text style={styles.otpSubtitle}>Sent to +91 {form.mobile}</Text>

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
              <Text style={styles.verifyButtonText}>Verify & Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendOTP}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Registration Form
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <MaterialIcons name="arrow-back" size={24} color={colors.gray700} />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="favorite" size={50} color={colors.primary} />
        </View>
        <Text style={styles.title}>Register as Blood Donor</Text>
        <Text style={styles.subtitle}>Your donation can save up to 3 lives</Text>
      </View>

      <View style={styles.form}>
        {/* Name - Required */}
        <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="person" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />
        </View>

        {/* Mobile Number - Required */}
        <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="phone" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={form.mobile}
            onChangeText={(t) => setForm({ ...form, mobile: t.replace(/[^0-9]/g, '') })}
          />
        </View>

        {/* Blood Group - Required */}
        <Text style={styles.label}>Blood Group <Text style={styles.required}>*</Text></Text>
        <View style={styles.bloodGroupContainer}>
          {APP_CONFIG.bloodGroups.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodOption, form.bloodGroup === bg && styles.bloodOptionSelected]}
              onPress={() => setForm({ ...form, bloodGroup: bg })}
            >
              <Text style={[styles.bloodOptionText, form.bloodGroup === bg && styles.bloodOptionTextSelected]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* City - Required */}
        <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="location-on" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Chennai"
            value={form.city}
            onChangeText={(t) => setForm({ ...form, city: t })}
          />
        </View>

        {/* State - Optional */}
        <Text style={styles.label}>State</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="map" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tamil Nadu"
            value={form.state}
            onChangeText={(t) => setForm({ ...form, state: t })}
          />
        </View>

        {/* Age - Optional */}
        <Text style={styles.label}>Age (18-65)</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="calendar-today" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 25"
            keyboardType="numeric"
            maxLength={2}
            value={form.age}
            onChangeText={(t) => setForm({ ...form, age: t })}
          />
        </View>

        {/* Gender - Optional */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderOption, form.gender === g && styles.genderOptionSelected]}
              onPress={() => setForm({ ...form, gender: g })}
            >
              <Text style={[styles.genderOptionText, form.gender === g && styles.genderOptionTextSelected]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Last Donation - Month/Year Selector */}
        <Text style={styles.label}>Last Donation (Optional)</Text>
        <TouchableOpacity 
          style={styles.monthSelector}
          onPress={() => setShowMonthPicker(true)}
        >
          <MaterialIcons name="event" size={20} color={colors.gray500} />
          <Text style={styles.monthSelectorText}>
            {form.lastDonationMonth && form.lastDonationYear 
              ? `${form.lastDonationMonth} ${form.lastDonationYear}`
              : 'Select month and year'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.gray500} />
        </TouchableOpacity>

        {form.lastDonationMonth && form.lastDonationYear && (
          <TouchableOpacity 
            style={styles.clearDateButton}
            onPress={() => setForm({ ...form, lastDonationMonth: '', lastDonationYear: '' })}
          >
            <Text style={styles.clearDateText}>Clear</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Register Button - Sends OTP */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSendOTP} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP to Register</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Month/Year Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Last Donation</Text>
            
            <Text style={styles.modalLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {MONTHS.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[styles.monthOption, form.lastDonationMonth === month && styles.monthOptionSelected]}
                  onPress={() => setForm({ ...form, lastDonationMonth: month })}
                >
                  <Text style={[styles.monthOptionText, form.lastDonationMonth === month && styles.monthOptionTextSelected]}>
                    {month.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearOption, form.lastDonationYear === year && styles.yearOptionSelected]}
                  onPress={() => setForm({ ...form, lastDonationYear: year })}
                >
                  <Text style={[styles.yearOptionText, form.lastDonationYear === year && styles.yearOptionTextSelected]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setForm({ ...form, lastDonationMonth: '', lastDonationYear: '' });
                  setShowMonthPicker(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.doneButton]} 
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  headerIcon: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: colors.primary + '15', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.gray600, marginTop: 8, textAlign: 'center' },
  form: { paddingHorizontal: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray900, marginBottom: 8, marginTop: 16 },
  required: { color: colors.error },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, 
    paddingHorizontal: 12, backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  bloodGroupContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  bloodOption: { 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20, 
    paddingVertical: 10, paddingHorizontal: 18, margin: 4, backgroundColor: '#fff',
  },
  bloodOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  bloodOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  bloodOptionTextSelected: { color: '#fff', fontWeight: '600' },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  genderOption: { 
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, 
    paddingVertical: 12, marginHorizontal: 4, alignItems: 'center', backgroundColor: '#fff',
  },
  genderOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderOptionText: { fontSize: 14, color: '#333' },
  genderOptionTextSelected: { color: '#fff', fontWeight: '600' },
  
  monthSelector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#fff',
  },
  monthSelectorText: { flex: 1, fontSize: 16, color: colors.gray900, marginLeft: 8 },
  clearDateButton: { alignItems: 'flex-end', marginTop: 4 },
  clearDateText: { color: colors.primary, fontSize: 12 },
  
  button: { 
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 25, 
    alignItems: 'center', marginTop: 30,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 10 },
  
  // OTP Screen
  otpContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  otpTitle: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 20 },
  otpSubtitle: { fontSize: 16, color: colors.gray600, marginTop: 8, marginBottom: 30 },
  otpInputContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  verifyButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 25, alignItems: 'center', width: '100%' },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendText: { color: colors.primary, fontSize: 14, marginTop: 20 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  monthScroll: { flexDirection: 'row', marginBottom: 16 },
  monthOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  monthOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthOptionText: { fontSize: 14, color: '#333' },
  monthOptionTextSelected: { color: '#fff', fontWeight: '600' },
  yearScroll: { flexDirection: 'row', marginBottom: 20 },
  yearOption: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  yearOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearOptionText: { fontSize: 14, color: '#333' },
  yearOptionTextSelected: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f5f5f5', marginRight: 8 },
  doneButton: { backgroundColor: colors.primary, marginLeft: 8 },
  cancelButtonText: { color: colors.gray700, fontWeight: '600' },
  doneButtonText: { color: '#fff', fontWeight: '600' },
});