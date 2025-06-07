
// i18n - integrated + show only profile form 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config'; // Ensure this path is correct

const FormListScreen = () => {
  const [formList, setFormList] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Set the screen title using navigation.setOptions
  useEffect(() => {
    navigation.setOptions({
      title: t('availableForms')
    });
  }, [t, navigation]);

  useEffect(() => {
    const fetchFormList = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/get-forms`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched forms:", data); // Log all fetched data for debugging

          // --- CRUCIAL CHANGE: Filter for 'profile' form only ---
          const profileForm = data.find(form => 
            form.form_data && form.form_data.formName && 
            String(form.form_data.formName).trim() === 'profile'
          );

          let namesAndIds = [];
          if (profileForm) {
            namesAndIds.push({
              id: String(profileForm.id),
              name: String(profileForm.form_data.formName),
            });
            setSelectedFormId(String(profileForm.id)); // Set selected to the profile form's ID
          } else {
            console.warn("Profile form not found in the fetched list.");
            setSelectedFormId(""); // Ensure no form is pre-selected if profile form is missing
          }
          setFormList(namesAndIds);
          // --- END CRUCIAL CHANGE ---

        } else {
          console.error('Failed to fetch form list:', response.status);
          // Optionally show an alert to the user here
        }
      } catch (error) {
        console.error('Error fetching form list:', error);
        // Optionally show an alert to the user here
      } finally {
        setLoading(false);
      }
    };

    fetchFormList();
  }, []);

  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    // Only navigate if a valid formId is selected (not the default empty string)
    if (formId && formId !== "") {
      navigation.navigate('DisplayForm', { formId: String(formId) }); // Ensure formId is string for navigation
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('selectAForm')}</Text>

      {/* Conditionally render content based on loading and formList */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : formList.length === 0 ? (
        <Text style={styles.noFormsText}>{t('noFormsAvailable')}</Text>
      ) : (
        // Render Picker only if there are forms and not loading
        <Picker
          selectedValue={selectedFormId}
          style={styles.picker}
          onValueChange={(itemValue) => handleFormSelect(itemValue)}
        >
          {/* Default Picker.Item with an empty string value for "Select a Form" option */}
          <Picker.Item label={t('selectAFormPrompt')} value="" />
          {formList.map((form) => (
            <Picker.Item
              key={form.id}
              label={form.name}
              value={form.id} // form.id is already guaranteed to be a string here
            />
          ))}
        </Picker>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  noFormsText: { // Added style for no forms message
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});

export default FormListScreen;

// do not remove the code below - code is for listing all the forms rather than just profile form

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
// import { Picker } from '@react-native-picker/picker';
// import { useNavigation } from '@react-navigation/native';
// import { useTranslation } from 'react-i18next';
// import { API_BASE_URL } from '../config';

// const FormListScreen = () => {
//   const [formList, setFormList] = useState([]);
//   // Change initial selectedFormId to an empty string instead of null
//   const [selectedFormId, setSelectedFormId] = useState("");
//   const [loading, setLoading] = useState(true); // Add loading state
//   const navigation = useNavigation();
//   const { t } = useTranslation();

//   // Set the screen title using navigation.setOptions
//   useEffect(() => {
//     navigation.setOptions({
//       title: t('availableForms')
//     });
//   }, [t, navigation]);

//   useEffect(() => {
//     const fetchFormList = async () => {
//       try {
//         setLoading(true); // Start loading
//         const response = await fetch(`${API_BASE_URL}/get-forms`);
//         if (response.ok) {
//           const data = await response.json();
//           console.log("Fetched forms:", data); // Log fetched data for debugging
//           const namesAndIds = data.map(form => ({
//             id: String(form.id), // Ensure ID is a string
//             name: String(form.form_data.formName), // Ensure name is a string
//           }));
//           setFormList(namesAndIds);
//           if (namesAndIds.length > 0) {
//             // Set default selected form to the first one fetched
//             setSelectedFormId(namesAndIds[0].id);
//           } else {
//             // If no forms, ensure selectedFormId is set to the default empty string
//             setSelectedFormId("");
//           }
//         } else {
//           console.error('Failed to fetch form list:', response.status);
//           // Optionally show an alert to the user here
//         }
//       } catch (error) {
//         console.error('Error fetching form list:', error);
//         // Optionally show an alert to the user here
//       } finally {
//         setLoading(false); // End loading
//       }
//     };

//     fetchFormList();
//   }, []);

//   const handleFormSelect = (formId) => {
//     setSelectedFormId(formId);
//     // Only navigate if a valid formId is selected (not the default empty string)
//     if (formId && formId !== "") {
//       navigation.navigate('DisplayForm', { formId: String(formId) }); // Ensure formId is string for navigation
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>{t('selectAForm')}</Text>

//       {/* Conditionally render content based on loading and formList */}
//       {loading ? (
//         <ActivityIndicator size="large" color="#0000ff" />
//       ) : formList.length === 0 ? (
//         // Ensure you have this translation key in your i18n files
//         <Text>{t('noFormsAvailable')}</Text>
//       ) : (
//         // Render Picker only if there are forms and not loading
//         <Picker
//           selectedValue={selectedFormId}
//           style={styles.picker}
//           onValueChange={(itemValue) => handleFormSelect(itemValue)}
//         >
//           {/* Default Picker.Item with an empty string value */}
//           <Picker.Item label={t('selectAFormPrompt')} value="" />
//           {formList.map((form) => (
//             <Picker.Item
//               key={form.id}
//               label={form.name}
//               value={form.id} // form.id is already guaranteed to be a string here
//             />
//           ))}
//         </Picker>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#f8f8f8',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#333',
//   },
//   picker: {
//     height: 50,
//     width: '80%',
//     borderColor: 'gray',
//     borderWidth: 1,
//     borderRadius: 5,
//     backgroundColor: '#fff',
//   },
// });

// export default FormListScreen;