// i18n integrated
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import { getFormById } from '../api/formApi'; // Import API functions
import { useTranslation } from 'react-i18next'; // Import useTranslation

const DisplayDynamicFormScreen = ({ route }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const [formData, setFormData] = useState(null);
    const [translatedFields, setTranslatedFields] = useState([]); // State for translated fields
    const { formId } = route.params;

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const data = await getFormById(formId);
                console.log("form fetched", data.form_data);

                // Translate form name and description (if present in the backend data)
                const translatedFormName = t(data.form_data.formName.toLowerCase()) || data.form_data.formName;
                const translatedFormDescription = t(data.form_data.formDescription.toLowerCase()) || data.form_data.formDescription;

                setFormData({
                    ...data.form_data,
                    formName: translatedFormName,
                    formDescription: translatedFormDescription
                });

                // Translate fields before setting them
                const fieldsWithTranslations = data.form_data.fields.map(field => ({
                    ...field,
                    label: t(field.label.toLowerCase()) || field.label, // Translate label
                    placeholder: field.placeholder ? (t(field.placeholder.toLowerCase()) || field.placeholder) : undefined, // Translate placeholder if exists
                    options: field.options ? field.options.map(option => t(option.toLowerCase()) || option) : undefined, // Translate options for checkboxes/radios
                    errorMessage: field.errorMessage ? (t(field.errorMessage.toLowerCase()) || field.errorMessage) : undefined, // Translate custom error messages
                }));
                setTranslatedFields(fieldsWithTranslations);

            } catch (error) {
                console.error('Error fetching form data:', error);
                // Handle error appropriately (e.g., display an error message to the user).
            }
        };

        fetchFormData();
    }, [formId, t]); // Re-fetch/re-translate when formId or language changes

    

    if (!formData) {
        return <Text style={styles.loadingText}>{t('loadingForm')}</Text>; // Translate loading text
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{formData.formName}</Text>
            <Text style={styles.description}>{formData.formDescription}</Text>
            <DynamicFormRenderer fields={translatedFields} formId={formId} formName = {formData.formName} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
    },
    loadingText: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 18,
        color: '#888',
    },
});

export default DisplayDynamicFormScreen;