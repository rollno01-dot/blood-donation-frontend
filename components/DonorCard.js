import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';

const DonorCard = ({ donor, onPress, showCallButton = true }) => {
  const { t } = useTranslation();

  const handleCall = () => {
    if (donor.userId?.mobile) {
      Linking.openURL(`tel:${donor.userId.mobile}`);
    }
  };

  const getBloodGroupColor = (bloodGroup) => {
    return colors.blood[bloodGroup] || colors.primary;
  };

  const isEligible = () => {
    if (!donor.lastDonationDate) return true;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(donor.lastDonationDate) < threeMonthsAgo;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.bloodGroupBadge,
            { backgroundColor: getBloodGroupColor(donor.bloodGroup) },
          ]}
        >
          <Text style={styles.bloodGroupText}>{donor.bloodGroup}</Text>
        </View>
        <View
          style={[
            styles.availabilityBadge,
            donor.isAvailable ? styles.available : styles.unavailable,
          ]}
        >
          <Text style={styles.availabilityText}>
            {donor.isAvailable ? t('common.available') : t('common.unavailable')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{donor.userId?.name || 'Anonymous'}</Text>
        
        <View style={styles.infoRow}>
          <Icon name="location-on" size={16} color={colors.gray600} />
          <Text style={styles.infoText}>{donor.location}</Text>
        </View>

        {donor.district && (
          <View style={styles.infoRow}>
            <Icon name="place" size={16} color={colors.gray600} />
            <Text style={styles.infoText}>{donor.district}, {donor.state}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="event" size={16} color={colors.gray600} />
          <Text style={styles.infoText}>
            {donor.lastDonationDate
              ? `${t('common.last_donation')}: ${new Date(
                  donor.lastDonationDate
                ).toLocaleDateString()}`
              : t('common.never_donated')}
          </Text>
        </View>

        {donor.totalDonations > 0 && (
          <View style={styles.infoRow}>
            <Icon name="favorite" size={16} color={colors.primary} />
            <Text style={[styles.infoText, styles.donationCount]}>
              {donor.totalDonations} {donor.totalDonations === 1 ? 'Donation' : 'Donations'}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon
            name={isEligible() ? 'check-circle' : 'schedule'}
            size={16}
            color={isEligible() ? colors.success : colors.warning}
          />
          <Text
            style={[
              styles.infoText,
              isEligible() ? styles.eligible : styles.notEligible,
            ]}
          >
            {isEligible() ? t('common.eligible') : t('common.not_eligible')}
          </Text>
        </View>
      </View>

      {showCallButton && donor.isAvailable && (
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Icon name="phone" size={20} color={colors.white} />
          <Text style={styles.callButtonText}>{t('common.call')}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bloodGroupText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  available: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  unavailable: {
    backgroundColor: colors.gray200,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  content: {
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray700,
    marginLeft: 8,
  },
  donationCount: {
    color: colors.primary,
    fontWeight: '600',
  },
  eligible: {
    color: colors.success,
    fontWeight: '500',
  },
  notEligible: {
    color: colors.warning,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 8,
  },
  callButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default DonorCard;