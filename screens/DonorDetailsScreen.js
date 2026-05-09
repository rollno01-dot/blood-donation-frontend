import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function DonorDetailsScreen({ route }) {
  const { donor } = route.params;

  // ✅ SAME isAvailable logic as DonorListScreen
  const isAvailable = (lastDate) => {
    if (!lastDate) return true;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(lastDate) < threeMonthsAgo;
  };

  // Calculate availability using the same logic
  const available = isAvailable(donor.lastDonationDate);

  const handleCall = () => {
    if (donor.userId?.mobile) {
      Linking.openURL(`tel:${donor.userId.mobile}`);
    } else {
      Alert.alert('Contact Unavailable', 'Phone number not available for this donor.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never donated';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getNextDonationDate = (lastDate) => {
    if (!lastDate) return null;
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 3);
    return nextDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBloodColor = (bloodGroup) => {
    const bloodColors = {
      'A+': '#E53935', 'A-': '#D32F2F',
      'B+': '#7B1FA2', 'B-': '#6A1B9A',
      'AB+': '#1565C0', 'AB-': '#0D47A1',
      'O+': '#E65100', 'O-': '#BF360C',
    };
    return bloodColors[bloodGroup] || colors.primary;
  };

  const DetailRow = ({ icon, label, value, color = colors.gray900 }) => (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon} size={20} color={colors.gray600} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.bloodGroupBadge, { backgroundColor: getBloodColor(donor.bloodGroup) }]}>
          <Text style={styles.bloodGroupText}>{donor.bloodGroup}</Text>
        </View>
        <Text style={styles.name}>{donor.userId?.name || 'Anonymous Donor'}</Text>
        
        {/* Status Badge - Same as list */}
        <View style={[styles.statusBadge, { backgroundColor: available ? '#E8F5E9' : '#FFEBEE' }]}>
          <MaterialIcons name={available ? 'check-circle' : 'cancel'} size={16} color={available ? colors.success : colors.error} />
          <Text style={[styles.statusText, { color: available ? colors.success : colors.error }]}>
            {available ? 'Available for Donation' : 'Currently Unavailable'}
          </Text>
        </View>
        
        {/* Show next eligible date if unavailable */}
        {!available && donor.lastDonationDate && (
          <Text style={styles.waitText}>
            ⏳ Eligible to donate again on {getNextDonationDate(donor.lastDonationDate)}
          </Text>
        )}
      </View>

      {/* Donor Details */}
      <View style={styles.details}>
        <DetailRow 
          icon="location-on" 
          label="Location" 
          value={donor.location || donor.district || 'Not specified'} 
        />
        
        <DetailRow 
          icon="event" 
          label="Last Donation" 
          value={formatDate(donor.lastDonationDate)} 
        />
        
        <DetailRow 
          icon="favorite" 
          label="Total Donations" 
          value={donor.totalDonations?.toString() || '0'} 
        />
        
        <DetailRow 
          icon="calendar-today" 
          label="Member Since" 
          value={donor.createdAt ? new Date(donor.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'Recently'} 
        />
      </View>

      {/* Important Information */}
      <View style={styles.infoCard}>
        <MaterialIcons name="info-outline" size={20} color={colors.primary} />
        <Text style={styles.infoTitle}>Before Donating</Text>
        <Text style={styles.infoText}>• Ensure you're in good health</Text>
        <Text style={styles.infoText}>• Wait 3 months between donations</Text>
        <Text style={styles.infoText}>• Stay hydrated before donation</Text>
        <Text style={styles.infoText}>• Carry a valid ID proof</Text>
      </View>

      {/* Call Button - Only show if donor is available */}
      {available && donor.userId?.mobile ? (
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <MaterialIcons name="phone" size={20} color="#fff" />
          <Text style={styles.callButtonText}>Call Donor</Text>
        </TouchableOpacity>
      ) : available && !donor.userId?.mobile ? (
        <View style={styles.warningCard}>
          <MaterialIcons name="warning" size={24} color={colors.warning} />
          <Text style={styles.warningText}>Phone number not available</Text>
        </View>
      ) : null}

      {/* Message when donor is unavailable */}
      {!available && (
        <View style={styles.unavailableCard}>
          <MaterialIcons name="access-time" size={32} color={colors.warning} />
          <Text style={styles.unavailableTitle}>Donor Unavailable</Text>
          <Text style={styles.unavailableText}>
            This donor recently donated blood and needs to wait 3 months before donating again.
          </Text>
          <Text style={styles.unavailableSubtext}>
            👉 Please try another donor from the list
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <MaterialIcons name={icon} size={20} color={colors.gray600} />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  
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
  bloodGroupBadge: { 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 30, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  bloodGroupText: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: 'bold' 
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 8
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 6
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600'
  },
  waitText: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 8,
    textAlign: 'center'
  },

  // Details Section
  details: { 
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  detailContent: { 
    marginLeft: 16, 
    flex: 1 
  },
  detailLabel: { 
    fontSize: 12, 
    color: colors.gray600,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  detailValue: { 
    fontSize: 16, 
    color: colors.gray900, 
    marginTop: 2,
    fontWeight: '500'
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 8
  },
  infoText: {
    fontSize: 13,
    color: colors.gray700,
    marginBottom: 6,
    lineHeight: 20
  },

  // Call Button
  callButton: { 
    flexDirection: 'row', 
    backgroundColor: colors.primary, 
    marginHorizontal: 20, 
    marginTop: 24, 
    paddingVertical: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  callButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },

  // Unavailable Card
  unavailableCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
    backgroundColor: colors.warning + '10'
  },
  unavailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.warning,
    marginTop: 12,
    marginBottom: 6
  },
  unavailableText: {
    fontSize: 14,
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20
  },
  unavailableSubtext: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: 'center'
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500'
  },

  bottomSpacing: {
    height: 30
  }
});