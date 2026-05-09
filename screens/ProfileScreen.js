import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, Share, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { donorAPI, fundAPI } from '../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, isDonor, logout } = useAuth();
  const [donorProfile, setDonorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalFund: 0,
    totalDonations: 0,
    lastDonationDate: null
  });
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [isDonor, user])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [donorsRes, fundRes] = await Promise.all([
        donorAPI.getDonors({ limit: 1 }),
        fundAPI.getFundDetails(),
      ]);
      
      let totalDonations = 0;
      let lastDonationDate = null;
      
      if (isDonor && user?._id) {
        const donorRes = await donorAPI.getDonors({ userId: user._id });
        if (donorRes.data.donors?.length > 0) {
          const donor = donorRes.data.donors[0];
          setDonorProfile(donor);
          totalDonations = donor.totalDonations || 0;
          lastDonationDate = donor.lastDonationDate || donor.lastDonatedAt || null;
        }
      }
      
      setStats({
        totalDonors: donorsRes.data.pagination?.total || 0,
        totalFund: fundRes.data.fund?.totalAmount || 0,
        totalDonations: totalDonations,
        lastDonationDate: lastDonationDate
      });
      
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not donated yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Sevai - Blood Donation App',
        message: `🩸 Save Lives with Sevai Blood Donation App!\n\nJoin our community of real blood donors. Download now!`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share at this moment.');
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'About Sevai',
      `Sevai - Blood Donation Platform\n\n` +
      `Version: 1.0.0\n` +
      `Platform: ${Platform.OS === 'ios' ? 'iOS' : 'Android'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 Our Mission\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Connecting blood donors with recipients in real-time to save lives.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👨‍💻 Developer\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Vasanth & Team\n` +
      `PKIET College, Karaikal\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📱 Key Features\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• Real-time donor matching\n` +
      `• Emergency blood requests\n` +
      `• Donation tracking\n` +
      `• Community medical fund\n` +
      `• Instant donor alerts\n\n` +
      `© 2026 Sevai Foundation\n` +
      `Made with ❤️ for Humanity`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyPolicyModal(true);
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color = colors.primary, badge }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{badge}</Text>
        </View>
      )}
      <MaterialIcons name="chevron-right" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            {isDonor && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color={colors.success} />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.mobile}>+91 {user?.mobile || 'XXXXXXXXXX'}</Text>
          
          {isDonor && donorProfile && (
            <View style={styles.donorInfo}>
              <View style={styles.bloodGroupTag}>
                <Text style={styles.bloodGroupText}>{donorProfile.bloodGroup}</Text>
              </View>
              {donorProfile.createdAt && (
                <Text style={styles.donorSince}>
                  Donor since {new Date(donorProfile.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
          
          {!isDonor && (
            <TouchableOpacity 
              style={styles.becomeDonorButton}
              onPress={() => navigation.navigate('Register')}
            >
              <MaterialIcons name="favorite" size={18} color="#fff" />
              <Text style={styles.becomeDonorText}>Become a Donor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalDonors}</Text>
            <Text style={styles.statLabel}>Total Donors</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="volunteer-activism" size={24} color={colors.fund || '#4CAF50'} />
            <Text style={styles.statValue}>{formatCurrency(stats.totalFund)}</Text>
            <Text style={styles.statLabel}>Community Fund</Text>
          </View>
        </View>

        {/* Donor Stats - Only for donors */}
        {isDonor && (
          <View style={styles.donorStatsContainer}>
            <View style={styles.donorStatCard}>
              <MaterialIcons name="bloodtype" size={22} color={colors.error} />
              <Text style={styles.donorStatValue}>{stats.totalDonations}</Text>
              <Text style={styles.donorStatLabel}>Total Donations</Text>
            </View>
            
            <View style={styles.donorStatCard}>
              <MaterialIcons name="calendar-today" size={22} color={colors.secondary} />
              <Text style={styles.donorStatValue}>
                {formatDate(stats.lastDonationDate)}
              </Text>
              <Text style={styles.donorStatLabel}>Last Donation</Text>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.menuSection}>
          <SectionHeader title="Settings" />
          
          <MenuItem
            icon="gavel"
            title="Privacy Policy"
            subtitle="How we protect your data"
            color={colors.primary}
            onPress={handlePrivacyPolicy}
          />
        </View>

        {/* Support Section */}
        <View style={styles.menuSection}>
          <SectionHeader title="Support" />
          
          <MenuItem
            icon="info"
            title="About Sevai"
            subtitle="Version 1.0.0"
            color={colors.gray600}
            onPress={handleAbout}
          />
          
          <MenuItem
            icon="share"
            title="Share App"
            subtitle="Invite friends to save lives"
            color={colors.secondary}
            onPress={handleShareApp}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, styles.privacyModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyPolicyModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.gray600} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.policyDate}>Last Updated: May 2026</Text>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>1. Information We Collect</Text>
                <Text style={styles.policyText}>
                  • Name and contact information (mobile number){'\n'}
                  • Blood group and donation history{'\n'}
                  • Location data (to find nearby donors){'\n'}
                  • Age and gender for medical compliance{'\n'}
                  • Device information for app functionality
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>2. How We Use Your Information</Text>
                <Text style={styles.policyText}>
                  • Connect blood donors with recipients{'\n'}
                  • Send emergency blood request notifications{'\n'}
                  • Maintain donor eligibility records{'\n'}
                  • Improve our matching services{'\n'}
                  • Comply with legal requirements
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>3. Data Protection</Text>
                <Text style={styles.policyText}>
                  • 256-bit SSL encryption for all data{'\n'}
                  • Secure servers with regular backups{'\n'}
                  • Access limited to authorized personnel{'\n'}
                  • Regular security audits
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>4. Data Sharing</Text>
                <Text style={styles.policyText}>
                  We NEVER sell your personal data. We only share donor information with potential recipients for emergency blood matching purposes with your consent.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>5. Your Rights</Text>
                <Text style={styles.policyText}>
                  • Access your personal data{'\n'}
                  • Request data correction{'\n'}
                  • Request data deletion{'\n'}
                  • Opt-out of notifications{'\n'}
                  • Withdraw consent anytime
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>6. Data Retention</Text>
                <Text style={styles.policyText}>
                  We retain your information as long as you maintain an account. Donation records are kept for medical compliance and legal requirements.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>7. Children's Privacy</Text>
                <Text style={styles.policyText}>
                  Our service is only for individuals aged 18-65. We do not knowingly collect data from minors.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>8. Contact Us</Text>
                <Text style={styles.policyText}>
                  📧 Email: privacy@sevai.org{'\n'}
                  📱 Phone: +91 XXXXXXXXXX{'\n'}
                  📍 Address: PKIET College, Karaikal
                </Text>
              </View>

              <View style={styles.consentBox}>
                <MaterialIcons name="verified-user" size={20} color={colors.success} />
                <Text style={styles.consentText}>
                  By using Sevai, you consent to this Privacy Policy.
                </Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPrivacyPolicyModal(false)}
            >
              <Text style={styles.closeButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.gray600 },
  
  // Header
  header: { 
    alignItems: 'center', 
    padding: 30, 
    backgroundColor: '#fff', 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 3 
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 2 },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.gray900 },
  mobile: { fontSize: 15, color: colors.gray600, marginTop: 4 },
  donorInfo: { alignItems: 'center', marginTop: 12 },
  bloodGroupTag: { backgroundColor: colors.primary + '15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 6 },
  bloodGroupText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  donorSince: { fontSize: 12, color: colors.gray500 },
  
  becomeDonorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
    gap: 8,
  },
  becomeDonorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Stats
  statsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    marginTop: 20, 
    gap: 12,
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: colors.gray900, 
    marginTop: 8 
  },
  statLabel: { 
    fontSize: 12, 
    color: colors.gray600, 
    marginTop: 4 
  },
  
  // Donor Stats
  donorStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  donorStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  donorStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray900,
    marginTop: 6,
    textAlign: 'center',
  },
  donorStatLabel: {
    fontSize: 11,
    color: colors.gray600,
    marginTop: 4,
  },
  
  // Menu Section
  menuSection: { 
    backgroundColor: '#fff', 
    marginTop: 20, 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 8, 
    borderRadius: 16, 
    marginHorizontal: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  sectionHeader: { 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: colors.gray500, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  
  // Menu Item
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14 
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: colors.gray900 },
  menuSubtitle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  
  // Logout
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
    marginBottom: 10, 
    padding: 16 
  },
  logoutText: { 
    fontSize: 16, 
    color: colors.error, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  bottomSpacing: { height: 20 },

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalView: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    width: '90%', 
    maxHeight: '80%', 
    overflow: 'hidden' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.gray900 
  },
  modalContent: { padding: 20 },
  
  // Privacy Policy Modal
  privacyModal: { maxHeight: '90%' },
  policyDate: { 
    textAlign: 'center', 
    color: colors.gray500, 
    fontSize: 12, 
    marginBottom: 20 
  },
  policySection: { marginBottom: 20 },
  policySectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginBottom: 8 
  },
  policyText: { 
    fontSize: 13, 
    color: colors.gray700, 
    lineHeight: 20 
  },
  consentBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.success + '10', 
    padding: 12, 
    borderRadius: 12, 
    marginTop: 10, 
    marginBottom: 20, 
    gap: 8 
  },
  consentText: { 
    flex: 1, 
    fontSize: 12, 
    color: colors.gray700, 
    lineHeight: 18 
  },
  
  closeButton: { 
    backgroundColor: colors.primary, 
    padding: 16, 
    margin: 20, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  closeButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});