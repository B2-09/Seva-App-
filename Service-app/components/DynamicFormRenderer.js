// DynamicFormRenderer.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { CheckBox } from 'react-native-elements';
import { RadioButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import formValidations from '../util/formValidations';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system'; // <--- NEW IMPORT for file system operations
import { useTranslation } from 'react-i18next';
import { submitFormData, submitProfileData } from '../api/formApi'; // Ensure this path is correct
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cities, indianStates } from '../util/ProfileIdGenerator'

const DynamicFormRenderer = ({ fields, onSubmit, formId, formName }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [dateText, setDateText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // <--- NEW STATE for submission loading

    const [colorValue, setColorValue] = useState('#000000');
    const [imageSource, setImageSource] = useState(null);




    /**
     * Handles changes for standard text inputs, numbers, emails, etc.
     * Updates formData and clears any existing error for the field.
     */
    const handleChange = useCallback((name, value) => {
        setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
        setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }, []);

    /**
     * Handles changes for checkbox groups.
     */
    const handleCheckboxChange = useCallback((name, option) => {
        setFormData(prevFormData => {
            const currentValue = prevFormData[name] || [];
            const newValue = currentValue.includes(option)
                ? currentValue.filter(v => v !== option)
                : [...currentValue, option];
            return { ...prevFormData, [name]: newValue };
        });
    }, []);

    /**
     * Handles changes for radio button groups.
     */
    const handleRadioChange = useCallback((name, value) => {
        handleChange(name, value);
    }, [handleChange]);

    /**
     * Handles the form submission.
     * Performs validation on all fields and calls the onSubmit prop if valid.
     */


    const handleSubmit = async () => {
        const validationErrors = {};
        let isValid = true;

        if (!fields || !Array.isArray(fields)) {
            console.warn("DynamicFormRenderer: fields prop is not a valid array during submission. Skipping validation.");
            setErrors({});
            return;
        }

        fields.forEach(field => {
            const value = formData[field.label];
            const minLength = field.minLength ? parseInt(field.minLength, 10) : null;
            const maxLength = field.maxLength ? parseInt(field.maxLength, 10) : null;

            if (minLength !== null && value && value.length < minLength) {
                validationErrors[field.label] = validationErrors[field.label] || (field.errorMessage || `${field.label} ${t('mustBeAtLeast')} ${minLength} ${t('characters')}`);
                isValid = false;
            }
            if (maxLength !== null && value && value.length > maxLength) {
                validationErrors[field.label] = validationErrors[field.label] || (field.errorMessage || `${field.label} ${t('cannotExceed')} ${maxLength} ${t('characters')}`);
                isValid = false;
            }

            field.validations && field.validations.forEach(validation => {
                const [validationType, ...params] = validation.split(':');
                const validator = formValidations[validationType];
                let errorMessage = null;

                if (validator && validationType !== 'minLength' && validationType !== 'maxLength') {
                    errorMessage = validator(value, ...params);
                } else if (validationType === 'required') {
                    errorMessage = formValidations.required(value);
                } else if (validationType === 'email') {
                    errorMessage = formValidations.email(value);
                } else if (validationType === 'time') {
                    errorMessage = formValidations.time(value);
                }

                if (errorMessage) {
                    validationErrors[field.label] = validationErrors[field.label] || (field.errorMessage || errorMessage);
                    isValid = false;
                }
            });

            if (field.controlType === 'checkbox' && field.validations && field.validations.includes('required')) {
                if (!formData[field.label] || formData[field.label].length === 0) {
                    validationErrors[field.label] = validationErrors[field.label] || (field.errorMessage || `${field.label} ${t('isRequired')}`);
                    isValid = false;
                }
            }
        });

        setErrors(validationErrors);

        if (isValid) {
            // console.log('Form Data for Submission:', formData);
            console.log("Form data just after valid: ", formData)
            setIsSubmitting(true); // <--- Set loading true
            try {

                const userToken = await AsyncStorage.getItem('userToken'); // Ensure AsyncStorage is imported and userToken is fetched
                console.log("userToken", userToken)

                if (!userToken) {
                    Alert.alert(t('error'), t('pleaseLogInToSubmit'));
                    navigation.replace('Auth'); // Ensure navigation is imported
                    setIsSubmitting(false);
                    return;
                }

                let submissionResponse;
                let finalFormData = { ...formData };
                if (formName.trim() === t('profile')) { // Check if the formName is "Profile " (with trailing space as in your form data)
                    // Call a dedicated function for profile data submission
                    // This function (submitProfileData) should send the form data to your backend
                    // where it will update the `form_data` JSON column in `usersprofile` table.

                    const userTypeCode = 'CU'; // Default to Customer
                    const cityLabelFromForm = finalFormData[t('City')]; // Get City from form data
                    console.log("cityLabelFromForm : ", cityLabelFromForm)
                    const cityObject = cities.find(c => c.label.toLowerCase().trim() === cityLabelFromForm.toLowerCase().trim());
                    console.log("cityObject : ", cityObject)
                    const cityCode = cityObject ? cityObject.code : 'OTH'; // Default to 'OTH' if city not found

                    const date = new Date();
                    const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
                    const currentYear = String(date.getFullYear()).slice(-2);

                    const userDetails = await AsyncStorage.getItem('userData'); // Get stored user details
                    const parsedUserDetails = userDetails ? JSON.parse(userDetails) : null;
                    const userId = parsedUserDetails ? parsedUserDetails.id : null;

                    // Use userId as the counter (serial number)
                    const autoIncrement = String(userId).padStart(6, '0');

                    const profileID = `${userTypeCode}${cityCode}${currentMonth}${currentYear}${autoIncrement}`;

                    // Check if profile_id already exists in current formData (e.g., if re-submitting an existing profile)
                    // If it exists, keep the existing one. Otherwise, set the newly generated one.
                    if (!finalFormData['profile_id']) {
                        finalFormData['profile_id'] = profileID; // Add the generated ID to the formData
                        console.log('Generated new profile ID:', profileID);
                    } else {
                        console.log('Using existing profile ID:', finalFormData['profile_id']);
                    }
                    const userPhoneNumber = await AsyncStorage.getItem('userPhoneNumber');
                    console.log(userPhoneNumber)
                    // sending finalformdata to the backend instead of formdata
                    submissionResponse = await submitProfileData(finalFormData, userToken); // Pass formId, formData, and token
                    // console.log('Profile form submission successful:', submissionResponse);
                    Alert.alert(t('success'), t('profileUpdatedSuccessfully') || 'Profile updated successfully!'); // New translation key
                } else {
                    // Call the generic form submission function for other forms
                    submissionResponse = await submitFormData(formId, formData, userToken); // Assuming this function takes formId, formData, and token
                    // console.log('Generic form submission successful:', submissionResponse);
                    Alert.alert(t('success'), t('formSubmittedSuccessfully'));
                }

                // After successful submission, if it was the "Profile " form, navigate to the Profile screen.
                // For other forms, you might want to navigate back, or to a success screen, or stay put.
                if (formName.trim() === t('profile')) {
                    navigation.replace('Profile'); // Go to Profile screen
                }
                else {
                    // For other forms, perhaps navigate back to FormList:
                    navigation.goBack(); // or navigation.replace('FormList');
                }

            } catch (error) {
                console.error('Frontend caught submission error:', error);
                console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                console.log('Error.message:', error.message);
                // Alert.alert(t('submissionFailed'), error.message || t('pleaseTryAgain'));
                // console.log("usertoken in catch", userToken)
                if (error.response && error.response.status === 403 &&
                    (error.response.data.message === 'Token expired. Please log in again.' || error.response.data.message === 'Invalid token.')) {

                    // 1. Clear token immediately
                    console.log("usertoken in catch in if", userToken)
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userDetails');
                    // 2. Navigate to Auth screen (this is the priority)
                    navigation.replace('Auth');

                    // 3. Show alert with a small delay, allowing navigation to start
                    // This alert will likely appear on the Auth screen or after a very brief flash.
                    setTimeout(() => {
                        Alert.alert(
                            t('sessionExpiredTitle') || 'Session Expired',
                            t('sessionExpiredMessage') || 'Your session has expired. Please log in again.'
                        );
                    }, 100); // Small delay to allow navigation to process

                    // Return immediately to prevent further execution in this catch block
                    return;
                } else if (error.message &&
                    (error.message.includes('Token expired.') ||
                        error.message.includes('Invalid token.'))
                ) {
                    console.log("!!! Token Expiration/Invalid Token Detected via Error.message. Clearing tokens and navigating. !!!");
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userDetails');
                    navigation.replace('Auth');
                    return; // EXIT IMMEDIATELY
                }
            } finally {
                setIsSubmitting(false); // <--- Set loading false
            }
        } else {
            Alert.alert(t('pleaseCorrectErrors'));
        }
    };

    /**
     * Renders a generic text input field.
     */

    const renderPickerField = ({ field, value, onChange, error, options }) => (
        <View style={styles.fieldContainer} key={field.id}>
            <Text style={styles.label}>{t(field.label) || field.label}{field.validations && field.validations.includes('required') && <Text style={styles.required}>*</Text>}</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={value}
                    style={styles.picker}
                    onValueChange={(itemValue) => onChange(field.label, itemValue)}
                >
                    {/* Default "Select..." option */}
                    <Picker.Item label={t(`select${field.label}`) || `Select a ${field.label}`} value="" />
                    {options.map((option, index) => {
                        // Check if option is an object (for cities) or a string (for states)
                        const itemLabel = typeof option === 'object' && option !== null ? option.label : option;
                        const itemValue = typeof option === 'object' && option !== null ? option.label : option; // CRUCIAL: Use label as value for cities

                        return (
                            <Picker.Item key={index} label={t(itemLabel) || itemLabel} value={itemValue} />
                        );
                    })}
                </Picker>
            </View>
        </View>
    );

    const renderInputField = (field) => {
        const { maxLength } = field;
        const actualMaxLength = maxLength ? Number(maxLength) : undefined;
        const initialValue = formData[field.label] !== undefined && formData[field.label] !== null ? String(formData[field.label]) : '';
        return (
            <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                secureTextEntry={field.controlType === 'password'}
                keyboardType={
                    field.controlType === 'number' || field.controlType === 'tel'
                        ? 'number-pad'
                        : field.controlType === 'email'
                            ? 'email-address'
                            : field.controlType === 'url'
                                ? 'url'
                                : 'default'
                }
                onChangeText={(text) => {
                    let truncatedText = text;
                    if (actualMaxLength !== undefined && text.length > actualMaxLength) {
                        truncatedText = text.substring(0, actualMaxLength);
                    }
                    handleChange(field.label, truncatedText);
                }}
                value={initialValue}
                maxLength={actualMaxLength}
            />
        );
    };

    /**
     * Renders a date picker field.
     */
    const renderDatePickerField = (field) => {
        const [open, setOpen] = useState(false);
        const [date, setDate] = useState(new Date());

        const showDatePicker = () => {
            setOpen(true);
        };

        const handleDateChange = (event, selectedDate) => {
            setOpen(false);
            if (event.type === 'set' && selectedDate) {
                setDate(selectedDate);
                const formattedDate = selectedDate.toISOString().split('T')[0];
                handleChange(field.label, formattedDate);
                setDateText(formattedDate);
            }
        };

        useEffect(() => {
            if (formData[field.label]) {
                const initialDate = new Date(formData[field.label]);
                setDate(initialDate);
                setDateText(initialDate.toISOString().split('T')[0]);
            }
        }, [formData[field.label]]);

        return (
            <View>
                <TouchableOpacity onPress={showDatePicker} style={styles.dateInputContainer}>
                    <Text style={styles.dateInputText}>{dateText || field.placeholder || t('selectDate')}</Text>
                </TouchableOpacity>
                {open && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        style={{ width: '100%' }}
                    />
                )}
            </View>
        );
    };

    /**
     * Renders a group of checkboxes.
     */
    const renderCheckboxGroup = (field) => (
        <View>
            {field.options && field.options.map((option, idx) => (
                <CheckBox
                    key={idx}
                    title={option}
                    checked={formData[field.label]?.includes(option)}
                    onPress={() => handleCheckboxChange(field.label, option)}
                />
            ))}
        </View>
    );

    /**
     * Renders a group of radio buttons.
     */
    const renderRadioGroup = (field) => (
        <View>
            {field.options && field.options.map((option, idx) => (
                <View key={idx} style={styles.radioItem}>
                    <RadioButton
                        value={option}
                        status={formData[field.label] === option ? 'checked' : 'unchecked'}
                        onPress={() => handleRadioChange(field.label, option)}
                    />
                    <Text style={styles.radioLabel}>{option}</Text>
                </View>
            ))}
        </View>
    );

    /**
     * Renders a read-only select field (for display purposes, not interactive).
     */
    const renderSelectField = (field) => (
        <TextInput
            style={styles.input}
            placeholder={field.placeholder}
            value={formData[field.label] || ''}
            editable={false}
        />
    );

    /**
     * Renders a month input field (YYYY-MM format).
     */
    const renderMonthField = (field) => {
        const { maxLength, placeholder } = field;
        const initialValue = formData[field.label] !== undefined && formData[field.label] !== null ? String(formData[field.label]) : '';
        const displayPlaceholder = placeholder || 'YYYY-MM';

        return (
            <TextInput
                style={styles.input}
                placeholder={displayPlaceholder}
                keyboardType="number-pad"
                onChangeText={(text) => {
                    let truncatedText = text;
                    if (maxLength !== undefined && text.length > maxLength) {
                        truncatedText = text.substring(0, maxLength);
                    }
                    handleChange(field.label, truncatedText);
                }}
                value={initialValue}
                maxLength={maxLength}
            />
        );
    };

    /**
     * Renders a time input field (HH:MM format).
     */
    const renderTimeField = (field) => {
        const { maxLength, placeholder } = field;
        const initialValue = formData[field.label] !== undefined && formData[field.label] !== null ? String(formData[field.label]) : '';
        const displayPlaceholder = placeholder || 'HH:MM';

        return (
            <TextInput
                style={styles.input}
                placeholder={displayPlaceholder}
                keyboardType="default"
                onChangeText={(text) => {
                    let truncatedText = text;
                    if (maxLength !== undefined && text.length > maxLength) {
                        truncatedText = text.substring(0, maxLength);
                    }
                    handleChange(field.label, truncatedText);
                }}
                value={initialValue}
                maxLength={maxLength}
            />
        );
    };

    /**
     * Renders a week input field (YYYY-WW format).
     */
    const renderWeekField = (field) => {
        const { maxLength, placeholder } = field;
        const initialValue = formData[field.label] !== undefined && formData[field.label] !== null ? String(formData[field.label]) : '';
        const displayPlaceholder = placeholder || 'YYYY-WW';
        return (
            <TextInput
                style={styles.input}
                placeholder={displayPlaceholder}
                keyboardType="number-pad"
                onChangeText={(text) => {
                    let truncatedText = text;
                    if (maxLength !== undefined && text.length > maxLength) {
                        truncatedText = text.substring(0, maxLength);
                    }
                    handleChange(field.label, text);
                }}
                value={initialValue}
                maxLength={maxLength}
            />
        );
    };

    /**
     * Renders a range slider field.
     */
    const renderRangeField = (field) => {
        const min = field.min ? parseInt(field.min, 10) : 0;
        const max = field.max ? parseInt(field.max, 10) : 100;
        const step = field.step ? parseInt(field.step, 10) : 1;
        let initialValue = formData[field.label] ? parseInt(formData[field.label], 10) : (field.default ? parseInt(field.default, 10) : min);

        initialValue = Math.max(min, Math.min(max, initialValue));

        return (
            <View>
                <Text style={styles.label}>{field.label} : {formData[field.label] || initialValue}</Text>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={min}
                    maximumValue={max}
                    step={step}
                    value={initialValue}
                    onValueChange={(value) => handleChange(field.label, value)}
                    minimumTrackTintColor="#307ECC"
                    maximumTrackTintColor="#000000"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text>{t('min')}: {min}</Text>
                    <Text>{t('max')}: {max}</Text>
                </View>
            </View>
        );
    };

    /**
     * Renders a color picker field.
     */
    const renderColorField = (field) => {
        const colorOptions = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
            '#C0C0C0', '#808080', '#000000', '#FFFFFF', '#800000', '#808000',
            '#008000', '#800080', '#008080', '#000080'
        ];

        const initialColor = formData[field.label] || colorOptions[0] || '#000000';
        const [localColorValue, setLocalColorValue] = useState(initialColor);

        useEffect(() => {
            if (formData[field.label] && formData[field.label] !== localColorValue) {
                setLocalColorValue(formData[field.label]);
            }
        }, [formData[field.label]]);

        return (
            <View>
                <Text style={styles.label}>{field.label}</Text>
                <Picker
                    selectedValue={localColorValue}
                    style={{ height: 50, width: '100%' }}
                    onValueChange={(itemValue) => {
                        setLocalColorValue(itemValue);
                        handleChange(field.label, itemValue);
                    }}
                >
                    {colorOptions.map((color, index) => (
                        <Picker.Item key={index} label={color} value={color} />
                    ))}
                </Picker>
                <View style={{ backgroundColor: localColorValue, width: 50, height: 50, marginTop: 10, borderRadius: 5 }} />
                <Text>{t('selectedColor')}: {localColorValue}</Text>
            </View>
        );
    };

    /**
     * Renders a file picker field using expo-document-picker and converts to Base64.
     * <--- UPDATED renderFileField ---
     */
    const renderFileField = (field) => {
        const [pickedFileDetails, setPickedFileDetails] = useState(null); // Stores file metadata
        const [isLoadingFile, setIsLoadingFile] = useState(false); // New loading state for file pick

        const handleFilePick = async () => {
            setIsLoadingFile(true); // Start loading
            try {
                let result = await DocumentPicker.getDocumentAsync({
                    type: "*/*", // Allows all file types
                    copyToCacheDirectory: true, // Crucial for reading URI on Android
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const pickedAsset = result.assets[0];
                    // console.log("DocumentPicker Picked File Asset (File):", pickedAsset);

                    // Read the file as Base64
                    const base64Content = await FileSystem.readAsStringAsync(pickedAsset.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    const fileDataToStore = {
                        name: pickedAsset.name,
                        size: pickedAsset.size,
                        mimeType: pickedAsset.mimeType,
                        base64: base64Content, // Store Base64 content
                    };

                    setPickedFileDetails(fileDataToStore); // Update local state for display
                    handleChange(field.label, fileDataToStore); // Update form data
                } else if (result.canceled) {
                    console.log(t('userCancelledFilePicker'));
                    setPickedFileDetails(null);
                    handleChange(field.label, null);
                } else {
                    console.warn("DocumentPicker: Unexpected result or no assets (not canceled):", result);
                    Alert.alert("Warning", "File picking did not result in a selection.");
                    setPickedFileDetails(null);
                    handleChange(field.label, null);
                }

            } catch (err) {
                console.error('DocumentPicker Error (File): ', err);
                Alert.alert("Error", t('failedToPickFile'));
                setPickedFileDetails(null);
                handleChange(field.label, null);
            } finally {
                setIsLoadingFile(false); // End loading
            }
        };

        useEffect(() => {
            // Initialize pickedFileDetails if formData already contains file data (e.g., on edit)
            if (formData[field.label] && typeof formData[field.label] === 'object' && formData[field.label].name && formData[field.label].base64) {
                setPickedFileDetails(formData[field.label]);
            } else {
                setPickedFileDetails(null);
            }
        }, [formData[field.label]]);

        return (
            <View>
                <Text style={styles.helper}>{field.placeholder}</Text>
                <TouchableOpacity onPress={handleFilePick} style={styles.uploadButton} disabled={isLoadingFile}>
                    {isLoadingFile ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.uploadButtonText}>{t('pickFile')}</Text>
                    )}
                </TouchableOpacity>
                {pickedFileDetails && (
                    <View style={styles.fileInfo}>
                        <Text>{t('fileName')}: {pickedFileDetails.name || 'N/A'}</Text>
                        <Text>{t('fileSize')}: {pickedFileDetails.size ? `${pickedFileDetails.size} bytes` : 'N/A'}</Text>
                        <Text>{t('fileType')}: {pickedFileDetails.mimeType || 'N/A'}</Text>
                        {/* Optionally display a preview for PDFs or common documents if desired (advanced) */}
                    </View>
                )}
            </View>
        );
    };

    /**
     * Renders an image picker field using expo-document-picker and converts to Base64.
     * <--- UPDATED renderImageField ---
     */
    const renderImageField = (field) => {
        const [imageUri, setImageUri] = useState(null); // Stores local URI for display
        const [isLoadingImage, setIsLoadingImage] = useState(false); // New loading state for image pick

        const handleImagePick = async () => {
            setIsLoadingImage(true); // Start loading
            try {
                let result = await DocumentPicker.getDocumentAsync({
                    type: "image/*", // Restricts to only images
                    copyToCacheDirectory: true, // Crucial for reading URI on Android
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const pickedAsset = result.assets[0];

                    if (pickedAsset.mimeType && pickedAsset.mimeType.startsWith('image/')) {
                        // Read the image as Base64
                        const base64Content = await FileSystem.readAsStringAsync(pickedAsset.uri, {
                            encoding: FileSystem.EncodingType.Base64,
                        });

                        const imageDataToStore = {
                            name: pickedAsset.name,
                            size: pickedAsset.size,
                            mimeType: pickedAsset.mimeType,
                            base64: base64Content, // Store Base64 content
                        };

                        setImageUri({ uri: pickedAsset.uri, name: pickedAsset.name }); // Set local URI for display
                        console.log("Image name", pickedAsset.name)
                        handleChange(field.label, imageDataToStore); // Update form data
                    } else {
                        Alert.alert("Invalid File Type", "Please select an image file (e.g., JPG, PNG).");
                        console.warn("Attempted to pick non-image file for image field:", pickedAsset);
                        setImageUri(null);
                        handleChange(field.label, null);
                    }

                } else if (result.canceled) {
                    console.log(t('userCancelledImagePicker'));
                    setImageUri(null);
                    handleChange(field.label, null);
                } else {
                    console.warn("DocumentPicker: Unexpected result or no assets for image (not canceled):", result);
                    Alert.alert("Warning", "Image picking did not result in a selection.");
                    setImageUri(null);
                    handleChange(field.label, null);
                }
            } catch (err) {
                console.error('DocumentPicker Error (Image): ', err);
                Alert.alert("Error", t('errorPickingImage'));
                setImageUri(null);
                handleChange(field.label, null);
            } finally {
                setIsLoadingImage(false); // End loading
            }
        };

        useEffect(() => {
            // Initialize imageUri if formData already contains image data
            if (formData[field.label] && typeof formData[field.label] === 'object' && formData[field.label].base64 && formData[field.label].mimeType && formData[field.label].mimeType.startsWith('image/')) {
                // For display, you can reconstruct a data URI if you want to preview from base64
                // or if you only saved base64, you can create a data URI like:
                // const dataUri = `data:${formData[field.label].mimeType};base64,${formData[field.label].base64}`;
                // setImageUri({ uri: dataUri });
                // However, if you originally picked the file, it's easier to just store and reuse the original pickedAsset.uri if available.
                // Or you could re-fetch/re-construct the image if backend returns a URL.
                // For now, if you are saving base64, let's assume you'll display it from the base64 or a backend URL later.
                // For simplicity, we'll clear display if it's not a direct URI.
                setImageUri(null); // Clear image display if not a direct file URI
            } else if (formData[field.label] && formData[field.label].uri) {
                setImageUri({ uri: formData[field.label].uri, name: formData[field.label].name });
            } else {
                setImageUri(null);
            }
        }, [formData[field.label]]);

        return (
            <View>
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.helper}>{field.placeholder}</Text>
                <TouchableOpacity onPress={handleImagePick} style={styles.uploadButton} disabled={isLoadingImage}>
                    {isLoadingImage ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.uploadButtonText}>{t('pickImage')}</Text>
                    )}
                </TouchableOpacity>
                {imageUri &&
                    <View style={styles.fileInfo}>
                        <Text>{t('fileName')}: {imageUri.name || 'N/A'}</Text>
                        <Text>{t('fileSize')}: {imageUri.size ? `${pickedFileDetails.size} bytes` : 'N/A'}</Text>
                        <Text>{t('fileType')}: {imageUri.mimeType || 'N/A'}</Text>
                    </View>

                }
                {/* Optionally display file info like name/size for images too if needed */}
            </View>
        );
    };

    /**
     * Renders a hidden input field.
     */
    const renderHiddenField = (field) => (
        <TextInput style={{ display: 'none', height: 0 }} value={field.value || ''} onChangeText={(text) => handleChange(field.label, text)} />
    );

    /**
     * Renders a button (submit, reset, or generic).
     */
    const renderButton = (field) => {
        const buttonType = field.controlType;
        let buttonText = field.label;

        if (buttonType === 'submit') {
            buttonText = buttonText || t('submit');
        } else if (buttonType === 'reset') {
            buttonText = buttonText || t('reset');
        } else if (buttonType === 'button') {
            buttonText = buttonText || t('clickMe');
        } else if (buttonType === 'image') {
            return (
                <TouchableOpacity key={field.id} onPress={() => console.log(`Image Button "${field.label}" pressed`)}>
                    <Image source={imageSource || { uri: 'https://placehold.co/100x100/cccccc/000000?text=Image+Btn' }} style={{ width: 100, height: 100, borderRadius: 5 }} />
                </TouchableOpacity>
            );
        }

        return (
            <View key={field.id} style={styles.buttonContainer}>
                <Button
                    title={buttonText}
                    onPress={() => {
                        if (buttonType === 'submit') {
                            handleSubmit();
                        } else if (buttonType === 'reset') {
                            setFormData({});
                            setErrors({});
                            setDateText('');
                            setColorValue('#000000');
                        } else {
                            handleSubmit();
                        }
                    }}
                    disabled={isSubmitting} // <--- Disable button during submission
                />
            </View>
        );
    };

    const fieldRenderers = {
        'text': renderInputField,
        'password': renderInputField,
        'email': renderInputField,
        'search': renderInputField,
        'tel': renderInputField,
        'url': renderInputField,
        'number': renderInputField,
        'date': renderDatePickerField,
        'datetime-local': renderDatePickerField,
        'month': renderMonthField,
        'time': renderTimeField,
        'week': renderWeekField,
        'checkbox': renderCheckboxGroup,
        'radio': renderRadioGroup,
        'range': renderRangeField,
        'color': renderColorField,
        'file': renderFileField,
        'image': renderImageField,
        'hidden': renderHiddenField,
        'submit': renderButton,
        'reset': renderButton,
        'button': renderButton,
    };

    if (!fields || !Array.isArray(fields)) {
        console.warn("DynamicFormRenderer: fields prop is not a valid array. Returning null.");
        return null;
    }

    return (
        <View>
            {fields.map((field) => {

                const commonProps = {
                    key: field.id,
                    field: field,
                    value: formData[field.label],
                    onChange: handleChange,
                    error: errors[field.label],
                    t: t,
                };

                // --- CRUCIAL CHANGE: Conditional rendering for 'State' label ---
                if (field.label.trim() === t('state')) {
                    return (
                        <View key={field.id} style={styles.inputContainer}>
                            {renderPickerField({
                                ...commonProps,
                                options: indianStates // Pass the indianStates array
                            })}
                            {errors[field.label] && <Text style={styles.error}>{errors[field.label]}</Text>}
                        </View>
                    );
                }

                if (field.label.trim() === t('city')) {
                    return (
                        <View key={field.id} style={styles.inputContainer}>
                            {renderPickerField({
                                ...commonProps,
                                options: cities // Pass the indianStates array
                            })}
                            {errors[field.label] && <Text style={styles.error}>{errors[field.label]}</Text>}
                        </View>
                    );
                }

                const Renderer = fieldRenderers[field.controlType] || null;
                return (
                    <View key={field.id} style={styles.inputContainer}>
                        {field.controlType !== 'button' &&
                            field.controlType !== 'submit' &&
                            field.controlType !== 'reset' &&
                            field.controlType !== 'image' && (
                                <Text style={styles.label}>
                                    {t(field.label)}
                                    {field.validations && field.validations.includes('required') && <Text style={styles.required}>*</Text>}
                                </Text>
                            )}
                        {Renderer ? (
                            Renderer(field)
                        ) : (
                            <Text style={styles.error}>{t('unsupportedFieldType')} {field.controlType}</Text>
                        )}
                        {errors[field.label] && <Text style={styles.error}>{errors[field.label]}</Text>}
                        {field.helperText && <Text style={styles.helper}>{t(field.helperText.toLowerCase()) || field.helperText}</Text>}
                    </View>
                );
            })}
            {isSubmitting && ( // <--- Show overall submission indicator
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.overlayText}>{t('submittingForm')}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    required: {
        color: 'red',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    error: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
    },
    helper: {
        color: 'gray',
        fontSize: 12,
        marginTop: 3,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    radioLabel: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    dateInputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    dateInputText: {
        fontSize: 16,
        color: '#333',
    },
    // Styles from your Document component for file/image pickers
    uploadButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10, // Added margin for spacing
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    fileInfo: {
        marginTop: 5, // Adjusted margin
        padding: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
    },
    // New styles for submission loading overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlayText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden', // Ensures border radius is applied to the picker
        backgroundColor: '#fff',
    },
    picker: {
        height: 50, // Standard height for Picker
        width: '100%',
        color: '#333', // Text color for picker items
    },
    label: { // Style for the field label
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    required: { // Style for the '*' of required fields
        color: 'red',
    },
    helper: { // Style for helper text
        fontSize: 12,
        color: '#666',
        marginTop: 3,
    },
    errorText: { // Ensure this is also defined for consistent error display
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
});

export default DynamicFormRenderer;