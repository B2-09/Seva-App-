// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // NEW: Import axios for API call
import { API_BASE_URL } from '../config';
// --- Dummy Images from Random API (as requested) ---
// Using Math.random() in the URL to ensure a different image is fetched on each reload/component mount
const DEFAULT_DUMMY_IMAGE = `https://picsum.photos/300/300?random=${Math.random() * 1000 + 2}`; // Fallback if gender is unknown
// --- END Dummy Images from Random API ---

// Helper function to get the correct dummy image based on gender
const getDummyProfileImage = (genderValue) => {
  return DEFAULT_DUMMY_IMAGE; // Fallback
};

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState(null); // This will hold combined data from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');

        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          setError(t('notAuthenticated') || 'Not authenticated');
          Alert.alert(t('error'), t('pleaseLogIn') || 'Please log in to view your profile.');
          navigation.replace('Auth'); // Redirect to auth if no token
          return;
        }

        // Fetch profile data from your backend's /api/profile endpoint
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        if (response.status === 200 && response.data && response.data.profile) {
          setProfileData(response.data.profile); // Backend should return combined data including parsed form_data
          // console.log('Profile data fetched from backend:', response.data.profile);
        } else {
          setError(response.data.message || t('failedToLoadProfile') || 'Failed to load profile data.');
          Alert.alert(t('error'), t('failedToLoadProfile') + ': ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching profile:', err.response ? err.response.data : err.message);
        setError(err.response?.data?.message || t('networkError') || 'Network Error');
        Alert.alert(t('error'), t('failedToLoadProfile') + ': ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []); // Run once on component mount

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
        <Text style={styles.loadingText}>{t('loadingProfile') || 'Loading Profile...'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace('FormList')}>
          <Text style={styles.retryButtonText}>{t('backToForms') || 'Back to Forms'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profileData || !profileData.formData) {
    // If profileData is null or formData is missing after loading
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('noProfileData') || 'No complete profile data found. Please submit a form.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace('FormList')}>
          <Text style={styles.retryButtonText}>{t('backToForms') || 'Back to Forms'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Access data from profileData.formData and direct columns (e.g., phoneNumber)
  const profileId = profileData.formData?.profile_id || t('notProvided');
  const firstName = profileData.formData?.[t('First name')] || t('notProvided'); // Note the space in label
  const lastName = profileData.formData?.[t('Last name')] || t('notProvided'); // Note the space in label also not usable
  const phoneNumber = profileData.phoneNumber || t('notProvided'); // Directly from usersprofile table
  const gender = profileData.formData?.[t('Gender')] || ''; // Assuming 'Gender' field in form
  const email = profileData.formData?.[t('Email Address')] || t('notProvided');
  const state = profileData.formData?.[t('State')] || t('notProvided'); // Note the space in label
  const city = profileData.formData?.[t('City')] || t('notProvided');
  const birthDate = profileData.formData?.[t('birth date')] || t('notProvided'); // Assuming 'Birth date' field in form

  let imageSource;
  const profilePictureData = profileData.formData?.['profile picture'];
  // console.log(profilePictureData)
  const profilePictureBase64 = profilePictureData?.base64;
  const profilePictureMimeType = profilePictureData?.mimeType || 'image/jpeg';

  if (profilePictureBase64) {
    // If Base64 data exists, construct a data URI
    imageSource = { uri: `data:${profilePictureMimeType};base64,${profilePictureBase64}` };
  } else {
    // Otherwise, use a dummy image based on gender from the random API
    imageSource = { uri: getDummyProfileImage() }; // Wrap in { uri: ... } for network images
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t('myProfile') || 'My Profile'}</Text>

      {/* Profile Photo - based on gender */}
      <Image
        source={imageSource}
        style={styles.profileImage}
      />

      {/* "Hi! [First Name]" greeting */}
      <Text style={styles.greetingText}>
        {t('hi') || 'Hi'}! {firstName}
      </Text>

      {/* Profile ID */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('profileID')}:</Text>
        <Text style={styles.infoValue}>{profileId}</Text>
      </View>

      {/* Phone Number (from usersprofile table) */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('phoneNumberProfile')}:</Text>
        <Text style={styles.infoValue}>{phoneNumber}</Text>
      </View>

      {/* Gender reveal */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('gender')}:</Text>
        <Text style={styles.infoValue}>{t(gender) || t('notProvided')}</Text>
      </View>

      {/* Email */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('email')}:</Text>
        <Text style={styles.infoValue}>{email}</Text>
      </View>

      {/* State */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('state')}:</Text>
        <Text style={styles.infoValue}>{state}</Text>
      </View>

      {/* City */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('city')}:</Text>
        <Text style={styles.infoValue}>{city}</Text>
      </View>

      {/* Birth Date */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>{t('birthDate')}:</Text>
        <Text style={styles.infoValue}>{birthDate}</Text>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert(t('editProfile'), t('editComingSoon') || 'Edit functionality coming soon!')}>
        <Text style={styles.editButtonText}>{t('editProfile') || 'Edit Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ccc', // Placeholder background
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6a0dad',
  },
  greetingText: { // New style for "Hi! Name"
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  name: { // Keeping 'name' style for consistency, though 'greetingText' is new primary
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#777',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 120, // Adjusted width for labels for better alignment
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen;