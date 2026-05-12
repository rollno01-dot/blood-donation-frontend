import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { APP_CONFIG } from '../constants/config';

const SearchBar = ({ onSearch, initialFilters = {} }) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    bloodGroup: initialFilters.bloodGroup || '',
    location: initialFilters.location || '',
  });

  const handleSearch = () => {
    onSearch(filters);
    setShowFilters(false);
  };

  const handleClear = () => {
    setFilters({ bloodGroup: '', location: '' });
    onSearch({});
    setShowFilters(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setShowFilters(true)}
      >
        <Icon name="search" size={24} color={colors.gray500} />
        <Text style={styles.searchText}>
          {filters.bloodGroup || filters.location
            ? `${filters.bloodGroup || ''} ${filters.location || ''}`.trim()
            : t('donor.search_placeholder')}
        </Text>
        <Icon name="tune" size={24} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.search')}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>{t('common.blood_group')}</Text>
              <View style={styles.bloodGroupContainer}>
                {APP_CONFIG.bloodGroups.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.bloodGroupOption,
                      filters.bloodGroup === bg && styles.selectedBloodGroup,
                    ]}
                    onPress={() => setFilters({ ...filters, bloodGroup: bg })}
                  >
                    <Text
                      style={[
                        styles.bloodGroupOptionText,
                        filters.bloodGroup === bg && styles.selectedBloodGroupText,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('common.location')}</Text>
              <View style={styles.locationInput}>
                <Icon name="location-on" size={20} color={colors.gray500} />
                <TextInput
                  style={styles.input}
                  placeholder={t('donor.enter_location')}
                  value={filters.location}
                  onChangeText={(text) => setFilters({ ...filters, location: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>{t('common.search')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.gray700,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
    marginTop: 8,
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  bloodGroupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray300,
    margin: 4,
  },
  selectedBloodGroup: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bloodGroupOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  selectedBloodGroupText: {
    color: colors.white,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.gray900,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  clearButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.gray700,
  },
  searchButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default SearchBar;