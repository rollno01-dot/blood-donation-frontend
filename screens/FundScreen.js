import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { fundAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function FundScreen() {
  const navigation = useNavigation();
  const [fundData, setFundData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFundData();
    startAnimations();
    startPulseAnimation();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadFundData = async () => {
    try {
      const response = await fundAPI.getFundDetails();
      setFundData(response.data.fund);
    } catch (error) {
      console.log('Error loading fund:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInstagram = () => {
    const instagramUrl = 'instagram://user?username=lifeline_blood_donation';
    const webUrl = 'https://instagram.com/lifeline_blood_donation';
    
    Linking.canOpenURL(instagramUrl).then(supported => {
      if (supported) {
        Linking.openURL(instagramUrl);
      } else {
        Linking.openURL(webUrl);
      }
    }).catch(() => {
      Linking.openURL(webUrl);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading fund details...</Text>
      </View>
    );
  }

  const totalAmount = fundData?.totalAmount || 0;
  const monthlyAmount = fundData?.monthlyCollection || 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Animated.View style={[styles.heroContent, { transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <MaterialIcons name="volunteer-activism" size={70} color="#fff" />
          </Animated.View>
          <Text style={styles.heroTitle}>Community Medical Fund</Text>
          <Text style={styles.heroSubtitle}>
            Together we can ensure no one is denied healthcare due to financial constraints
          </Text>
        </Animated.View>
        <View style={styles.heroOverlay} />
      </View>

      {/* Main Fund Card */}
      <Animated.View style={[styles.mainFundCard, { opacity: fadeAnim }]}>
        <View style={styles.fundRow}>
          <View style={styles.fundItem}>
            <MaterialIcons name="account-balance" size={20} color={colors.gray600} />
            <Text style={styles.fundItemLabel}>Total Fund</Text>
            <Text style={styles.fundItemValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.fundDivider} />
          <View style={styles.fundItem}>
            <MaterialIcons name="trending-up" size={20} color={colors.gray600} />
            <Text style={styles.fundItemLabel}>This Month</Text>
            <Text style={styles.fundItemValue}>₹{monthlyAmount.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.donateButton}
          onPress={() => navigation.navigate('Donate')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="favorite" size={20} color="#fff" />
          <Text style={styles.donateButtonText}>Make a Contribution</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* What We Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Contribution Supports</Text>
        <View style={styles.supportContainer}>
          <View style={styles.supportCard}>
            <MaterialIcons name="medical-services" size={28} color={colors.primary} />
            <Text style={styles.supportTitle}>Medical Treatment</Text>
            <Text style={styles.supportText}>Surgeries, medicines, and hospital care</Text>
          </View>
          <View style={styles.supportCard}>
            <MaterialIcons name="home" size={28} color={colors.fund} />
            <Text style={styles.supportTitle}>Shelter for Homeless</Text>
            <Text style={styles.supportText}>Safe housing and basic amenities</Text>
          </View>
          <View style={styles.supportCard}>
            <MaterialIcons name="restaurant" size={28} color={colors.warning} />
            <Text style={styles.supportTitle}>Nutrition Support</Text>
            <Text style={styles.supportText}>Healthy meals for patients</Text>
          </View>
          <View style={styles.supportCard}>
            <MaterialIcons name="local-pharmacy" size={28} color={colors.secondary} />
            <Text style={styles.supportTitle}>Emergency Medicine</Text>
            <Text style={styles.supportText}>Critical medicines for emergencies</Text>
          </View>
        </View>
      </View>

      {/* Service Running Cost Note */}
      <Animated.View style={[styles.costNoteCard, { opacity: fadeAnim }]}>
        <MaterialIcons name="info-outline" size={20} color={colors.gray600} />
        <Text style={styles.costNoteText}>
          A small portion of funds is used for service running costs (servers, SMS alerts, and support).
        </Text>
      </Animated.View>

      {/* Instagram Updates Card */}
      <Animated.View style={[styles.instagramCard, { opacity: fadeAnim }]}>
        <View style={styles.instagramHeader}>
          <Text style={styles.instagramIcon}>📸</Text>
          <Text style={styles.instagramTitle}>Monthly Updates</Text>
        </View>
        <Text style={styles.instagramText}>
          Follow us on Instagram for monthly fund utilization reports and transparent updates.
        </Text>
        <TouchableOpacity 
          style={styles.instagramButton}
          onPress={openInstagram}
          activeOpacity={0.8}
        >
          <Text style={styles.instagramButtonIcon}>📷</Text>
          <Text style={styles.instagramButtonText}>@lifeline_blood_donation</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Call to Action */}
      <Animated.View style={[styles.ctaCard, { opacity: fadeAnim }]}>
        <MaterialIcons name="favorite" size={40} color="#fff" />
        <Text style={styles.ctaTitle}>Be a Lifesaver Today</Text>
        <Text style={styles.ctaText}>
          Your small contribution can save a life. 100% of donations go directly to patient care.
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Donate')}
        >
          <Text style={styles.ctaButtonText}>Donate Now</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.gray600 },
  
  // Hero Section
  heroSection: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 80,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: colors.primary },
  heroContent: { alignItems: 'center', paddingHorizontal: 24 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 16, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  
  // Main Fund Card
  mainFundCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -40,
    padding: 24,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  fundRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  fundItem: { flex: 1, alignItems: 'center' },
  fundItemLabel: { fontSize: 13, color: colors.gray600, marginTop: 4 },
  fundItemValue: { fontSize: 22, fontWeight: 'bold', color: colors.gray900, marginTop: 4 },
  fundDivider: { width: 1, height: 40, backgroundColor: colors.gray300 },
  
  // Donate Button
  donateButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  donateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.gray900, marginBottom: 16 },
  
  // Support Cards
  supportContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  supportCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  supportTitle: { fontSize: 14, fontWeight: '600', color: colors.gray900, marginTop: 8, marginBottom: 4 },
  supportText: { fontSize: 11, color: colors.gray600, lineHeight: 15 },
  
  // Cost Note Card
  costNoteCard: {
    backgroundColor: colors.gray100,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costNoteText: { flex: 1, fontSize: 13, color: colors.gray700, lineHeight: 18 },
  
  // Instagram Card
  instagramCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E1306C20',
  },
  instagramHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  instagramIcon: { fontSize: 24 },
  instagramTitle: { fontSize: 18, fontWeight: 'bold', color: '#E1306C' },
  instagramText: { fontSize: 14, color: colors.gray700, lineHeight: 20, marginBottom: 16 },
  instagramButton: {
    flexDirection: 'row',
    backgroundColor: '#E1306C',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instagramButtonIcon: { fontSize: 20, color: '#fff' },
  instagramButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // CTA Card
  ctaCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  ctaTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 8 },
  ctaText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  
  bottomSpacing: { height: 30 },
});