// screens/AuthScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AuthScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [randomImageUrl, setRandomImageUrl] = useState('');


  // NEW STATE: To prevent re-sending OTP automatically on re-render if it failed
  const [autoSendAttempted, setAutoSendAttempted] = useState(false);

  const navigation = useNavigation();
  const { t } = useTranslation();

  const otpInputRef = useRef(null);

  useEffect(() => {
    setRandomImageUrl(`https://picsum.photos/600/300?random=${Math.random()}`);
  }, []);

  // --- OTP Send Logic ---
  useEffect(() => {
    const isValidPhoneNumberFormat = /^\+\d{1,3}\d{10}$/.test(phoneNumber) || /^\d{10}$/.test(phoneNumber);
    const cleanedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`; // For checking against `autoSendAttempted`

    // Condition to automatically send OTP:
    // 1. Phone number is valid format
    // 2. OTP has not been sent yet
    // 3. Not currently in the process of sending OTP
    // 4. An automatic send for THIS specific phone number hasn't been attempted yet,
    //    or if it has, we're trying a *new* phone number
    if (
      isValidPhoneNumberFormat &&
      !isOtpSent &&
      !sendingOtp &&
      (phoneNumber !== '' && !autoSendAttempted) // Only auto-send if not attempted OR phone number changed
    ) {
      setAutoSendAttempted(true); // Mark that an auto-send is about to happen
      handleSendOtp();
    } else if (!isValidPhoneNumberFormat && isOtpSent) {
      // If user clears phone number after OTP was sent, reset state
      LayoutAnimation.easeInEaseOut();
      setIsOtpSent(false);
      setOtp('');
      setResendTimer(0);
      setAutoSendAttempted(false); // Reset auto-send flag when phone number is invalid/cleared
    }
  }, [phoneNumber, isOtpSent, sendingOtp, autoSendAttempted]); // Add autoSendAttempted to dependencies

  // --- Resend Timer Logic ---
  useEffect(() => {
    let timerInterval;
    if (resendTimer > 0) {
      timerInterval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && isOtpSent) {
      // OTP expired, or timer ran out, allow resend
    }
    return () => clearInterval(timerInterval);
  }, [resendTimer, isOtpSent]);


  const handleSendOtp = async (isResend = false) => {
    const cleanedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    if (!/^\+\d{1,3}\d{10}$/.test(cleanedPhoneNumber)) {
      if (isResend) Alert.alert(t('error'), t('phoneNumberRequired'));
      return;
    }

    LayoutAnimation.easeInEaseOut();
    setSendingOtp(true);
    setResendTimer(0); // Reset timer when a new send request is made

    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, { phoneNumber: cleanedPhoneNumber });

      if (response.status === 200) {
        setIsOtpSent(true);
        setResendTimer(30);
        otpInputRef.current?.focus();
        Alert.alert(t('success'), t('otpSentTo') + cleanedPhoneNumber);
      } else {
        // If backend returns a non-200, but not an error
        Alert.alert(t('error'), response.data.message || t('failedToSendOtp'));
        // Do NOT reset isOtpSent to false here if you want to keep the OTP input visible
        // after a soft failure that might still allow resend.
        // If you want to go back to phone input, set setIsOtpSent(false);
      }
    } catch (error) {
      console.error('Error sending OTP:', error.response ? error.response.data : error.message);
      Alert.alert(t('error'), error.response?.data?.message || t('failedToSendOtp') + '. ' + t('pleaseTryAgain'));
      // On hard network error, ensure the user can retry.
      // Do NOT set isOtpSent(false) if you want the resend button to appear.
      // If the phone number input should be re-enabled, set isOtpSent(false);
    } finally {
      setSendingOtp(false); // ALWAYS reset sendingOtp to allow new attempts
    }
  };

  // --- OTP Verification Logic ---
  const handleOtpChange = async (text) => {
    setOtp(text);
    if (text.length === 6 && !verifyingOtp) {
      LayoutAnimation.easeInEaseOut();
      setVerifyingOtp(true);
      const cleanedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      try {
        const response = await axios.post(`${API_BASE_URL}/verify-otp`, { phoneNumber: cleanedPhoneNumber, otp: text });

        if (response.status === 200) {
          const { message, user, token } = response.data;
          Alert.alert(t('success'), message);

          // TODO: Store token/user data securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          console.log(user)
          await AsyncStorage.setItem('userPhoneNumber', JSON.stringify(phoneNumber));

          navigation.replace('FormList');
        } else {
          Alert.alert(t('error'), response.data.message || t('incorrectOtp'));
          setOtp(''); // Clear OTP on incorrect attempt
        }
      } catch (error) {
        console.error('Error verifying OTP:', error.response ? error.response.data : error.message);
        Alert.alert(t('error'), error.response?.data?.message || t('failedToVerifyOtp') + '. ' + t('pleaseTryAgain'));
        setOtp(''); // Clear OTP on error
      } finally {
        setVerifyingOtp(false);
      }
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        {randomImageUrl ? (
          <Image
            source={{ uri: randomImageUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <ActivityIndicator size="large" color="#6a0dad" />
        )}
      </View>

      {isOtpSent && (
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.blurOverlay} />
        </BlurView>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('enterPhoneNumber')}
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={(text) => {
            const cleanedText = text.replace(/[^0-9+]/g, '');
            // NEW: Reset autoSendAttempted if phone number changes
            if (cleanedText !== phoneNumber) {
                setAutoSendAttempted(false);
                setIsOtpSent(false); // Also hide OTP input if number is being re-typed
                setOtp('');
                setResendTimer(0);
            }
            setPhoneNumber(cleanedText);
          }}
          maxLength={15}
          editable={!isOtpSent && !sendingOtp}
        />

        {/* Show sending indicator below phone number input only if trying to send first time */}
        {sendingOtp && !isOtpSent && (
          <View style={styles.loadingMessageContainer}>
            <ActivityIndicator size="small" color="#6a0dad" />
            <Text style={styles.loadingTextSmall}>{t('sendingOtp')}</Text>
          </View>
        )}


        {isOtpSent && ( // Only show OTP section if OTP was successfully sent
          <View style={styles.otpSection}>
            <TextInput
              ref={otpInputRef}
              style={styles.input}
              placeholder={t('enterOtp')}
              placeholderTextColor="#888"
              keyboardType="number-pad"
              value={otp}
              onChangeText={handleOtpChange}
              maxLength={6}
              editable={!verifyingOtp}
            />
            {resendTimer > 0 ? (
              <Text style={styles.resendText}>
                {t('resendOtpIn')} {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => handleSendOtp(true)} // Pass true for resend
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resendButtonText}>{t('resendOtp')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading Indicator for OTP Verification, positioned centrally for blur effect */}
        {verifyingOtp && isOtpSent && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6a0dad" />
            <Text style={styles.loadingText}>{t('verifyingOtp')}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerImage: {
    width: '90%',
    height: 200,
    borderRadius: 10,
  },
  formContainer: {
    flex: 1,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 15,
    color: 'black',
    fontSize: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#6a0dad',
  },
  otpSection: {
    width: '100%',
    alignItems: 'center',
  },
  resendText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 5,
    marginTop: -10,
  },
  resendButtonText: {
    color: '#6a0dad',
    fontSize: 14,
  },
  loadingOverlay: { // Used for full screen loading
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    zIndex: 10,
  },
  loadingMessageContainer: { // New style for small loading message below phone input
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -15, // Pull it up a bit
    marginBottom: 10,
  },
  loadingText: { // For full screen overlay
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  loadingTextSmall: { // For small loading message
    color: '#ccc',
    marginLeft: 10,
    fontSize: 14,
  }
});

export default AuthScreen;