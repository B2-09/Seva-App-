import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a minimum duration for the welcome screen to be visible (e.g., 2 seconds)
const MIN_WELCOME_SCREEN_DURATION = 2000; // milliseconds

const WelcomeScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Tracks initial checks and duration

  useEffect(() => {
    const initializeAndNavigate = async () => {
      // Start a timer for the minimum duration
      const startTime = Date.now();

      try {
        const storedLanguage = await AsyncStorage.getItem('user-language');
        const userToken = await AsyncStorage.getItem('userToken');

        // Calculate remaining time for the minimum duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_WELCOME_SCREEN_DURATION - elapsedTime;
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        if (storedLanguage) {
          // If language is already set, change to it (if not already current)
          if (i18n.language !== storedLanguage) {
             await i18n.changeLanguage(storedLanguage);
          }

          if (userToken) {
            // Language and token exist, go to FormList
            navigation.replace('FormList');
          } else {
            // Language exists, but no token, go to AuthScreen
            navigation.replace('Auth');
          }
        } else {
          // No language selected yet, show options
          setShowLanguageOptions(true);
        }
      } catch (error) {
        console.error('Error during initial app setup:', error);
        // In case of any error, ensure language options are shown or fallback to Auth
        setShowLanguageOptions(true); // Allow user to choose language
        // Or directly go to Auth if error is critical and prevents language selection
        // navigation.replace('Auth');
      } finally {
        setInitialLoading(false); // Finished initial checks and duration
      }
    };

    initializeAndNavigate();
  }, []); // Run once on component mount

  const changeLanguage = async (lng) => {
    setInitialLoading(true); // Show loading again briefly while changing language and checking auth
    try {
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem('user-language', lng); // Save selected language

      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        navigation.replace('FormList'); // Language selected AND user logged in
      } else {
        navigation.replace('Auth'); // Language selected BUT user not logged in
      }

    } catch (error) {
      console.error('Error changing language or saving to storage:', error);
      alert('Failed to set language. Please try again.');
      setInitialLoading(false); // Stop loading if error occurs during language change
    }
  };

  // Render the initial splash screen / loading state
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Placeholder for your app logo */}
        <Image
          source={`https://picsum.photos/600/300?random=${Math.random()}`} // Replace with your actual app logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>{t('welcomeInitial') || 'Loading Your App'}</Text>
        <ActivityIndicator size="large" color="#6a0dad" style={styles.spinner} />
        <Text style={styles.loadingMessage}>{t('pleaseWait') || 'Please wait...'}</Text>
      </View>
    );
  }

  // Render language options after initial checks and duration
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome')}</Text>
      <Text style={styles.label}>{t('selectLanguage')}</Text>
      <TouchableOpacity style={styles.button} onPress={() => changeLanguage('en')}>
        <Text style={styles.buttonText}>{t('english')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => changeLanguage('hi')}>
        <Text style={styles.buttonText}>{t('hindi')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => changeLanguage('gu')}>
        <Text style={styles.buttonText}>{t('gujarati')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => changeLanguage('mr')}>
        <Text style={styles.buttonText}>{t('marathi')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Initial loading/splash screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Dark background for initial splash
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
    // borderRadius: 75, // Uncomment if your logo is square and you want it round
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 20,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
  loadingMessage: { // Changed name from loadingText to avoid confusion
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },

  // Language selection screen styles (your existing styles)
  container: { // This is for the language selection screen
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8', // Light background for language selection
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 20,
    marginBottom: 20,
    color: '#555',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;