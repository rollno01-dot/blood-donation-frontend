import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { donorAPI, fundAPI } from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, isDonor } = useAuth();
  const [stats, setStats] = useState({ donors: 0, fund: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const [donorsRes, fundRes] = await Promise.all([
        donorAPI.getDonors({ limit: 1 }),
        fundAPI.getFundDetails(),
      ]);
      
      setStats({
        donors: donorsRes.data.pagination?.total || 0,
        fund: fundRes.data.fund?.totalAmount || 0,
      });
    } catch (error) {
      console.log('Error loading stats:', error);
      setStats({
        donors: 0,
        fund: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  // Navigation functions
  const goToProfile = () => {
    navigation.getParent()?.navigate('Profile');
  };

  const goToDonors = () => {
    navigation.getParent()?.navigate('Donors');
  };

  const goToFund = () => {
    navigation.getParent()?.navigate('Fund');
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="bloodtype" size={32} color={colors.primary} />
            <Text style={styles.logoText}>Sevai</Text>
          </View>
          <TouchableOpacity onPress={goToProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'}! 👋</Text>
          {isDonor && (
            <View style={styles.donorBadge}>
              <MaterialIcons name="verified" size={14} color={colors.success} />
              <Text style={styles.donorBadgeText}>Verified Donor</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Every drop counts. Save a life today.</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="people" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.donors}+</Text>
          <Text style={styles.statLabel}>Active Donors</Text>
        </View>

        <View style={[styles.statCard, styles.statCardSuccess]}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="volunteer-activism" size={24} color={colors.fund || '#4CAF50'} />
          </View>
          <Text style={[styles.statNumber, { color: colors.fund || '#4CAF50' }]}>{formatCurrency(stats.fund)}</Text>
          <Text style={styles.statLabel}>Community Fund</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionCard, styles.actionCardPrimary]} 
          onPress={goToDonors}
          activeOpacity={0.9}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="search" size={28} color="#fff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Find Blood Donors</Text>
            <Text style={styles.actionDescription}>Search by blood group and location</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, styles.actionCardSuccess]} 
          onPress={goToFund}
          activeOpacity={0.9}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.fund || '#4CAF50' }]}>
            <MaterialIcons name="favorite" size={28} color="#fff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Community Medical Fund</Text>
            <Text style={styles.actionDescription}>Support patients who cannot afford treatment</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color={colors.gray400} />
        </TouchableOpacity>
      </View>

      {/* Donation Guidelines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Donation Guidelines</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.infoText}>You must be 18-65 years old</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.infoText}>Weight at least 50 kg</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.infoText}>Wait 3 months between donations</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.infoText}>Stay hydrated before donation</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  
  // Header
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 3 
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginLeft: 8 
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    fontSize: 18, 
    color: '#fff', 
    fontWeight: '600' 
  },
  welcomeSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.gray900 
  },
  donorBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 16 
  },
  donorBadgeText: { 
    fontSize: 12, 
    color: colors.success, 
    fontWeight: '500', 
    marginLeft: 4 
  },
  subtitle: { 
    fontSize: 14, 
    color: colors.gray600, 
    marginTop: 6 
  },

  // Stats
  statsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginTop: 20, 
    gap: 12 
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  statCardPrimary: { 
    borderTopWidth: 3, 
    borderTopColor: colors.primary 
  },
  statCardSuccess: { 
    borderTopWidth: 3, 
    borderTopColor: colors.fund || '#4CAF50' 
  },
  statIconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 13, 
    color: colors.gray600 
  },

  // Section
  section: { 
    paddingHorizontal: 20, 
    marginTop: 24 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: colors.gray900, 
    marginBottom: 16 
  },

  // Action Cards
  actionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  actionCardPrimary: { 
    borderLeftWidth: 4, 
    borderLeftColor: colors.primary 
  },
  actionCardSuccess: { 
    borderLeftWidth: 4, 
    borderLeftColor: colors.fund || '#4CAF50' 
  },
  actionIconContainer: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  actionContent: { 
    flex: 1 
  },
  actionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: colors.gray900, 
    marginBottom: 4 
  },
  actionDescription: { 
    fontSize: 13, 
    color: colors.gray600 
  },

  // Info Card
  infoCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoText: { 
    fontSize: 14, 
    color: colors.gray700, 
    marginLeft: 12 
  },

  // Bottom Spacing
  bottomSpacing: { 
    height: 30 
  },
});