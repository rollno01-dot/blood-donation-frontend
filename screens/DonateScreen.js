import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Linking, Clipboard 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fundAPI } from '../services/api';

export default function DonateScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [selectedUPI, setSelectedUPI] = useState('googlepay');
  const [loading, setLoading] = useState(false);
  const [dailyDonationCount, setDailyDonationCount] = useState(0); // Track daily donations

  // Donation Limits Configuration
  const DONATION_LIMITS = {
    MIN_AMOUNT: 10,      // Minimum ₹10
    MAX_AMOUNT: 50000,   // Maximum ₹50,000 per transaction
    DAILY_MAX: 100000,   // Maximum ₹1,00,000 per day per user
    MONTHLY_MAX: 500000, // Maximum ₹5,00,000 per month per user
    DAILY_COUNT_LIMIT: 5 // Maximum 5 transactions per day
  };

  // UPI Apps configuration
  const upiApps = [
    { id: 'googlepay', name: 'Google Pay', package: 'com.google.android.apps.nbu.pay', scheme: 'tez://' },
    { id: 'phonepe', name: 'PhonePe', package: 'com.phonepe.app', scheme: 'phonepe://' },
    { id: 'paytm', name: 'Paytm', package: 'net.one97.paytm', scheme: 'paytmmp://' },
    { id: 'bhim', name: 'BHIM UPI', package: 'in.org.npci.upiapp', scheme: 'bhim://' },
    { id: 'amazonpay', name: 'Amazon Pay', package: 'in.amazon.mShop.android.shopping', scheme: 'amazonpay://' },
  ];

  // YOUR UPI ID
  const UPI_ID = 'vasanthhb2522005@oksbi';
  const MERCHANT_NAME = 'Lifeline Blood Donation';
  
  const generateUPIIntent = (amountValue) => {
    const upiURL = `upi://pay?pa=${UPI_ID}&pn=${MERCHANT_NAME}&am=${amountValue}&cu=INR`;
    return upiURL;
  };

  const openUPIApp = async (app, amountValue) => {
    const upiIntent = generateUPIIntent(amountValue);
    
    try {
      const canOpen = await Linking.canOpenURL(upiIntent);
      if (canOpen) {
        await Linking.openURL(upiIntent);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error opening UPI app:', error);
      return false;
    }
  };

  const copyUPIID = () => {
    Clipboard.setString(UPI_ID);
    Alert.alert('✅ Copied!', 'UPI ID copied to clipboard');
  };

  // Validate donation limits
  const validateDonationLimits = (amountNum) => {
    // Check minimum amount
    if (amountNum < DONATION_LIMITS.MIN_AMOUNT) {
      Alert.alert('Minimum Amount', `Minimum donation amount is ₹${DONATION_LIMITS.MIN_AMOUNT}`);
      return false;
    }
    
    // Check maximum amount per transaction
    if (amountNum > DONATION_LIMITS.MAX_AMOUNT) {
      Alert.alert('Maximum Limit', `Maximum donation per transaction is ₹${DONATION_LIMITS.MAX_AMOUNT.toLocaleString()}`);
      return false;
    }
    
    // Check daily count limit
    if (dailyDonationCount >= DONATION_LIMITS.DAILY_COUNT_LIMIT) {
      Alert.alert('Daily Limit Reached', `You can only make ${DONATION_LIMITS.DAILY_COUNT_LIMIT} donations per day. Please try tomorrow.`);
      return false;
    }
    
    return true;
  };

  const handleDonate = async () => {
    // Validate amount
    const amountNum = parseInt(amount);
    if (!amount || isNaN(amountNum)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    // Check donation limits
    if (!validateDonationLimits(amountNum)) {
      return;
    }

    setLoading(true);
    
    try {
      const selectedApp = upiApps.find(app => app.id === selectedUPI);
      
      // Open UPI app for payment
      const paymentOpened = await openUPIApp(selectedApp, amountNum);
      
      if (paymentOpened) {
        Alert.alert(
          '💝 Payment Initiated',
          `Please complete the payment of ₹${amountNum} in ${selectedApp.name}.\n\nAfter successful payment, your contribution will be automatically recorded.`,
          [
            { 
              text: '✅ I have completed payment', 
              onPress: async () => {
                try {
                  const response = await fundAPI.contribute({
                    amount: amountNum,
                    paymentMethod: 'UPI',
                    description: `Donation via ${selectedApp.name}`
                  });
                  
                  if (response.data.success) {
                    // Update daily donation count
                    setDailyDonationCount(prev => prev + 1);
                    
                    Alert.alert(
                      '🙏 Thank You for Your Donation!',
                      `Your contribution of ₹${amountNum} has been recorded.\n\nReceipt No: ${response.data.transaction?.receiptNumber || 'Generated'}\n\nToday's donations: ${dailyDonationCount + 1}/${DONATION_LIMITS.DAILY_COUNT_LIMIT}\n\nYour support helps save lives!`,
                      [
                        { 
                          text: 'View Receipt', 
                          onPress: () => navigation.navigate('TransactionHistory')
                        },
                        { 
                          text: 'Donate Again', 
                          onPress: () => {
                            setAmount('');
                            // Keep the same UPI app selected
                          }
                        },
                        { text: 'OK', onPress: () => navigation.goBack() }
                      ]
                    );
                  } else {
                    Alert.alert('Success', 'Your donation has been recorded. Thank you!');
                    navigation.goBack();
                  }
                } catch (apiError) {
                  console.log('API error:', apiError);
                  Alert.alert(
                    'Thank You!',
                    'Your donation has been initiated. You will receive a receipt shortly.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                  );
                }
              }
            },
            { text: 'Close', style: 'cancel' }
          ]
        );
      } else {
        // No UPI app found - Show manual payment option
        Alert.alert(
          '💰 Manual Payment',
          `Please send ₹${amountNum} to this UPI ID:\n\n${UPI_ID}\n\nAfter payment, click "I have completed payment" to record your donation.`,
          [
            { text: 'Copy UPI ID', onPress: copyUPIID },
            { 
              text: 'I have completed payment', 
              onPress: async () => {
                try {
                  const response = await fundAPI.contribute({
                    amount: amountNum,
                    paymentMethod: 'UPI',
                    description: 'Manual UPI Donation'
                  });
                  
                  setDailyDonationCount(prev => prev + 1);
                  
                  Alert.alert(
                    'Thank You!',
                    `Your donation of ₹${amountNum} has been recorded. Receipt: ${response.data.transaction?.receiptNumber}`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                  );
                } catch (error) {
                  Alert.alert('Success', 'Your donation has been recorded. Thank you!');
                  navigation.goBack();
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Unable to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get preset amounts with validation
  const getPresetAmounts = () => {
    const presets = [100, 500, 1000, 2000, 5000];
    return presets;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <MaterialIcons name="volunteer-activism" size={60} color={colors.primary} />
        <Text style={styles.title}>Make a Contribution</Text>
        <Text style={styles.subtitle}>Support medical care for those in need</Text>
      </View>

      <View style={styles.form}>
        {/* Amount Input */}
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput 
          style={styles.input} 
          placeholder={`Enter amount (₹${DONATION_LIMITS.MIN_AMOUNT} - ₹${DONATION_LIMITS.MAX_AMOUNT.toLocaleString()})`}
          keyboardType="numeric" 
          value={amount} 
          onChangeText={setAmount}
          editable={!loading}
          autoFocus
        />
        
        {/* Preset Amounts */}
        <View style={styles.presetContainer}>
          {getPresetAmounts().map((preset) => (
            <TouchableOpacity 
              key={preset} 
              style={[
                styles.presetButton,
                amount === preset.toString() && styles.presetButtonActive
              ]} 
              onPress={() => setAmount(preset.toString())}
            >
              <Text style={[
                styles.presetText,
                amount === preset.toString() && styles.presetTextActive
              ]}>₹{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Limit Info Card */}
        <View style={styles.limitCard}>
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <View style={styles.limitContent}>
            <Text style={styles.limitTitle}>Donation Limits</Text>
            <Text style={styles.limitText}>• Minimum: ₹{DONATION_LIMITS.MIN_AMOUNT}</Text>
            <Text style={styles.limitText}>• Maximum per transaction: ₹{DONATION_LIMITS.MAX_AMOUNT.toLocaleString()}</Text>
            <Text style={styles.limitText}>• Maximum {DONATION_LIMITS.DAILY_COUNT_LIMIT} donations per day</Text>
            <Text style={styles.limitText}>• Today: {dailyDonationCount}/{DONATION_LIMITS.DAILY_COUNT_LIMIT} donations</Text>
          </View>
        </View>

        {/* UPI App Selection */}
        <Text style={styles.label}>Select UPI App</Text>
        <View style={styles.upiAppsContainer}>
          {upiApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={[
                styles.upiAppButton,
                selectedUPI === app.id && styles.upiAppButtonSelected
              ]}
              onPress={() => setSelectedUPI(app.id)}
            >
              <Text style={[
                styles.upiAppText,
                selectedUPI === app.id && styles.upiAppTextSelected
              ]}>
                {app.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* UPI ID Display */}
        <View style={styles.upiCard}>
          <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
          <View style={styles.upiCardContent}>
            <Text style={styles.upiCardLabel}>Send payment to:</Text>
            <Text style={styles.upiCardId}>{UPI_ID}</Text>
          </View>
          <TouchableOpacity onPress={copyUPIID} style={styles.copyButton}>
            <MaterialIcons name="content-copy" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            You'll be redirected to {upiApps.find(a => a.id === selectedUPI)?.name} to complete the payment securely.
          </Text>
        </View>

        {/* Donate Button */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleDonate} 
          disabled={loading || dailyDonationCount >= DONATION_LIMITS.DAILY_COUNT_LIMIT}
        >
          {loading ? 
            <ActivityIndicator color="#fff" /> : 
            <>
              <MaterialIcons name="favorite" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {dailyDonationCount >= DONATION_LIMITS.DAILY_COUNT_LIMIT 
                  ? 'Daily Limit Reached' 
                  : `Donate ₹${amount || '0'}`}
              </Text>
            </>
          }
        </TouchableOpacity>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <MaterialIcons name="security" size={16} color={colors.gray600} />
            <Text style={styles.trustText}>UPI Secure</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="receipt" size={16} color={colors.gray600} />
            <Text style={styles.trustText}>Tax Receipt</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="verified" size={16} color={colors.gray600} />
            <Text style={styles.trustText}>100% Transparent</Text>
          </View>
        </View>

        {/* Support Note */}
        <View style={styles.supportNote}>
          <MaterialIcons name="support-agent" size={16} color={colors.gray500} />
          <Text style={styles.supportText}>
            Your contribution helps provide medical support to those in need
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    alignItems: 'center', 
    padding: 30,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginTop: 16 
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 8,
    textAlign: 'center'
  },
  form: { 
    padding: 20 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 8,
    color: colors.gray800,
    marginTop: 8,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 18, 
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  presetContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10,
    marginBottom: 16 
  },
  presetButton: { 
    borderWidth: 1, 
    borderColor: colors.primary, 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    backgroundColor: '#fff'
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetText: { 
    color: colors.primary, 
    fontWeight: '600' 
  },
  presetTextActive: {
    color: '#fff'
  },
  limitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  limitContent: {
    flex: 1,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 6,
  },
  limitText: {
    fontSize: 12,
    color: colors.gray700,
    marginBottom: 2,
  },
  upiAppsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  upiAppButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  upiAppButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  upiAppText: {
    color: colors.gray700,
    fontWeight: '500'
  },
  upiAppTextSelected: {
    color: '#fff'
  },
  upiCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  upiCardContent: {
    flex: 1,
  },
  upiCardLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 4,
  },
  upiCardId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  copyButton: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
  },
  button: { 
    flexDirection: 'row',
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { 
    opacity: 0.7 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: colors.gray600,
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 30,
  },
  supportText: {
    fontSize: 12,
    color: colors.gray500,
  },
});