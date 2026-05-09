import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, ScrollView, StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { APP_CONFIG } from '../constants/config';
import { donorAPI } from '../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DonorListScreen() {
  const navigation = useNavigation();
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    loadDonors();
  }, []);

  // Simple search - runs on every change
  useEffect(() => {
    if (donors.length > 0) {
      filterDonors();
    }
  }, [searchText, selectedBlood, donors]);

  const loadDonors = async () => {
    try {
      const response = await donorAPI.getDonors({});
      setDonors(response.data.donors || []);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isAvailable = (lastDate) => {
    if (!lastDate) return true;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(lastDate) < threeMonthsAgo;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const filterDonors = () => {
    let filtered = [...donors];

    // Add availability
    filtered = filtered.map(d => ({
      ...d,
      available: isAvailable(d.lastDonationDate)
    }));

    // Filter by blood group
    if (selectedBlood) {
      filtered = filtered.filter(d => d.bloodGroup === selectedBlood);
    }

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(d => {
        const name = (d.userId?.name || '').toLowerCase();
        const location = (d.location || '').toLowerCase();
        const blood = (d.bloodGroup || '').toLowerCase();
        return name.includes(query) || location.includes(query) || blood.includes(query);
      });
    }

    // Sort: available first
    filtered.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return (a.userId?.name || '').localeCompare(b.userId?.name || '');
    });

    setFilteredDonors(filtered);
  };

  const getBloodColor = (blood) => {
    const colors = {
      'A+': '#E53935', 'A-': '#D32F2F',
      'B+': '#7B1FA2', 'B-': '#6A1B9A',
      'AB+': '#1565C0', 'AB-': '#0D47A1',
      'O+': '#E65100', 'O-': '#BF360C',
    };
    return colors[blood] || colors.primary;
  };

  const clearAll = () => {
    setSearchText('');
    setSelectedBlood('');
    setShowFilter(false);
  };

  const renderDonor = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DonorDetails', { donor: item })}
    >
      <View style={[styles.bloodCircle, { backgroundColor: getBloodColor(item.bloodGroup) }]}>
        <Text style={styles.bloodText}>{item.bloodGroup}</Text>
      </View>
      
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.userId?.name || 'Anonymous'}</Text>
          <View style={[styles.badge, item.available ? styles.availableBadge : styles.unavailableBadge]}>
            <Text style={[styles.badgeText, item.available ? styles.availableText : styles.unavailableText]}>
              {item.available ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color="#666" />
          <Text style={styles.location}>{item.location || 'Location not specified'}</Text>
        </View>

        {item.lastDonationDate && (
          <Text style={styles.lastDonation}>Last: {formatDate(item.lastDonationDate)}</Text>
        )}
      </View>
      
      <MaterialIcons name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading donors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Search and Filter */}
      <View style={styles.header}>
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, location, blood..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText !== '' && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialIcons name="close" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.iconButton, selectedBlood && styles.activeFilter]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <MaterialIcons name="filter-list" size={22} color={selectedBlood ? '#fff' : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        {showFilter && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.chip, !selectedBlood && styles.activeChip]}
                onPress={() => setSelectedBlood('')}
              >
                <Text style={[styles.chipText, !selectedBlood && styles.activeChipText]}>All</Text>
              </TouchableOpacity>
              {APP_CONFIG.bloodGroups.map(bg => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.chip, selectedBlood === bg && styles.activeChip]}
                  onPress={() => setSelectedBlood(bg)}
                >
                  <Text style={[styles.chipText, selectedBlood === bg && styles.activeChipText]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Results Info */}
        {(searchText || selectedBlood) && (
          <View style={styles.resultBar}>
            <Text style={styles.resultText}>
              {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Donor List */}
      <FlatList
        data={filteredDonors}
        renderItem={renderDonor}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDonors} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No donors found</Text>
            <Text style={styles.emptySubtext}>
              {searchText || selectedBlood ? 'Try different filters' : 'Be the first to register!'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredDonors.length === 0 && styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    padding: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterScroll: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  activeChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
    marginTop: 4,
  },
  resultText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  clearText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bloodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bloodText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
  },
  unavailableBadge: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#F44336',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  lastDonation: {
    fontSize: 11,
    color: '#999',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 6,
  },
  emptyList: {
    flexGrow: 1,
  },
});