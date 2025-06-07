// App.js - otp screen added + welcome screen problem solved
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import i18n from './i18n';
import WelcomeScreen from './screens/WelcomeScreen';
import FormListScreen from './screens/FormListScreen';
import DisplayDynamicFormScreen from './screens/DisplayDynamicFormScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen'; // <--- NEW: Import ProfileScreen

const Stack = createNativeStackNavigator();

const App = () => {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    const loadLanguageForApp = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('user-language');
        if (storedLanguage && i18n.language !== storedLanguage) {
          await i18n.changeLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language for App.js:', error);
      } finally {
        setIsI18nInitialized(true);
      }
    };

    loadLanguageForApp();
  }, []);

  if (!isI18nInitialized) {
    return (
      <View style={appStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FormList" component={FormListScreen} options={{ title: i18n.t('availableForms') }} />
            <Stack.Screen name="DisplayForm" component={DisplayDynamicFormScreen} options={{ title: i18n.t('dynamicForm') }} />
            <Stack.Screen
              name="Profile" // <--- NEW: Add ProfileScreen
              component={ProfileScreen}
              options={{ headerShown: true, title: i18n.t('myProfile') || 'My Profile' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </I18nextProvider>
  );
};

const appStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;