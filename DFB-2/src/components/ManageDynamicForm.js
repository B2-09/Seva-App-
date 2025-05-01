import React, { useEffect, useState } from 'react';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, MenuItem, Select, Table, TableBody, TableCell, TableHead,
    TableRow, TextField, Checkbox, Typography, FormControl,
    OutlinedInput, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveIcon from '@mui/icons-material/Save';

// Import API functions for interacting with the backend
import { fetchForms, updateFormData } from '../api/formApi';
// Import validation options to populate the validation selection
import { validationOptions } from '../constants/validationOptions';
// Import control types to populate the control type selection
import { controlTypes } from '../constants/controlTypes';

// Functional component for managing dynamic forms
const ManageDynamicForm = () => {
    // State to store the list of available forms fetched from the backend
    const [forms, setForms] = useState([]);
    // State to store the ID of the currently selected form
    const [selectedFormId, setSelectedFormId] = useState('');
    // State to hold the array of fields for the currently selected form
    const [formFields, setFormFields] = useState([]);
    // State to control the visibility of the confirmation dialog before saving
    const [openConfirm, setOpenConfirm] = useState(false);
    // State to store the description of the currently selected form
    const [formDescription, setFormDescription] = useState('');
    // State to store the name of the currently selected form
    const [formName, setFormName] = useState('');

    // useEffect hook to fetch the list of forms when the component mounts or when the selectedFormId changes
    useEffect(() => {
        fetchForms()
            .then(data => {
                setForms(data);
                // If a form was previously selected, try to re-select it after fetching
                if (selectedFormId) {
                    const previouslySelected = data.find(f => f.id === parseInt(selectedFormId, 10));
                    if (previouslySelected?.form_data) {
                        setFormName(previouslySelected.form_data.formName);
                        setFormDescription(previouslySelected.form_data.formDescription);
                        setFormFields([...previouslySelected.form_data.fields]);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching forms:', error);
                alert('Failed to load forms.');
            });
    }, [selectedFormId]); // Re-run effect when selectedFormId changes (e.g., after saving)


    // Function to handle changes in the properties of a form field
    const handleFieldChange = (index, field, value) => {
        const updatedFields = formFields.map((item, idx) =>
            idx === index ? { ...item, [field]: value } : item
        );
        setFormFields(updatedFields);
        console.log('formFields after handleFieldChange:', updatedFields);
    };

    // Function to handle changes in the options of a radio or checkbox field
    const handleOptionChange = (fieldIndex, optionIndex, value) => {
        const updatedFields = formFields.map((item, idx) =>
            idx === fieldIndex ? {
                ...item,
                options: item.options.map((opt, optIdx) =>
                    optIdx === optionIndex ? value : opt
                )
            } : item
        );
        setFormFields(updatedFields);
        console.log('formFields after handleOptionChange:', updatedFields);
    };

    // Function to delete a form field
    const handleDeleteField = (index) => {
        const updatedFields = formFields.filter((_, idx) => idx !== index);
        setFormFields(updatedFields);
        console.log('formFields after handleDeleteField:', updatedFields);
    };

    // Function to add a new empty form field
    const handleAddField = () => {
        const newField = {
            id: Date.now(), // Generate a unique ID for the new field
            label: '',
            controlType: 'text',
            placeholder: '',
            errorMessage: '',
            minLength: '',
            maxLength: '',
            optionsCount: 0,
            options: [],
            validations: [],
            available: true,
        };
        setFormFields(prevFields => [...prevFields, newField]);
        console.log('formFields after handleAddField:', [...formFields, newField]);
    };


    // Function to handle the selection of a form from the dropdown
    const handleFormSelect = (event) => {
        const formId = event.target.value;
        setSelectedFormId(formId);
        // Find the selected form object from the forms array
        const selectedFormObject = forms.find(f => f.id === parseInt(formId, 10));
        // If a form is selected, update the form fields and description
        if (selectedFormObject?.form_data) {
            setFormFields([...selectedFormObject.form_data.fields]);
            setFormDescription(selectedFormObject.form_data.formDescription);
            setFormName(selectedFormObject.form_data.formName);
        } else {
            // If no form is selected or found, reset the form fields and description
            setFormFields([]);
            setFormDescription('');
            setFormName('');
        }
    };

    // Function to move a form field up or down in the order
    const handleMoveField = (index, direction) => {
        const updatedFields = [...formFields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Check if the target index is within the bounds of the array
        if (targetIndex >= 0 && targetIndex < updatedFields.length) {
            // Swap the field at the current index with the field at the target index
            const temp = updatedFields[index];
            updatedFields[index] = updatedFields[targetIndex];
            updatedFields[targetIndex] = temp;
            setFormFields(updatedFields);
        }
    };

    // Asynchronous function to save the updated form data to the backend
    const handleSave = async () => {
        if (!selectedFormId) {
            alert('Please select a form to save.');
            return;
        }

        const updatedFormDetails = {
            form_data: {
                formName: formName,
                formDescription: formDescription,
                fields: formFields,
            },
        };

        try {
            const data = await updateFormData(selectedFormId, updatedFormDetails);
            alert('Form updated successfully!');
            console.log('Form updated:', data);

            // Refetch the list of forms to update the UI
            fetchForms()
                .then(updatedFormsData => {
                    setForms(updatedFormsData);
                    // After refetch, maintain the selection and data if the form still exists
                    const stillSelected = updatedFormsData.find(f => f.id === parseInt(selectedFormId, 10));
                    if (stillSelected?.form_data) {
                        setFormName(stillSelected.form_data.formName);
                        setFormDescription(stillSelected.form_data.formDescription);
                        setFormFields([...stillSelected.form_data.fields]);
                    } else {
                        // If the selected form is no longer found, reset the state
                        setSelectedFormId('');
                        setFormName('');
                        setFormDescription('');
                        setFormFields([]);
                    }
                })
                .catch(error => {
                    console.error('Error refetching forms after update:', error);
                    alert('Failed to refresh form list.');
                });

            // Close the confirmation dialog after successful save
            setOpenConfirm(false);
        } catch (error) {
            alert('Failed to update form.');
            console.error('Error updating form:', error);
        }
    };

    // Find the name of the currently selected form for display in the table header
    const selectedFormName = forms.find(form => form.id === parseInt(selectedFormId, 10))?.form_data?.formName || '';

    return (
        <Box p={3}>
            <Typography variant="h6" gutterBottom>Manage Dynamic Form</Typography>
            {/* Dropdown to select an existing form */}
            <Select
                displayEmpty
                value={selectedFormId || ''}
                onChange={handleFormSelect}
                fullWidth
                size="small"
            >
                <MenuItem value="" disabled>Select a form</MenuItem>
                {forms.map((form) => (
                    <MenuItem key={form.id} value={form.id}>
                        {form.form_data?.formName}
                    </MenuItem>
                ))}
            </Select>

            {/* Conditional rendering of the form editor if a form is selected */}
            {selectedFormId && (
                <Box mt={3}>
                    {/* Button to add a new field to the form */}
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <Button variant="outlined" color="primary" onClick={handleAddField}>
                            Add Field
                        </Button>
                    </Box>
                    {/* Table to display and edit the form fields */}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={9}>
                                    <Typography variant="h6">Form Name: {selectedFormName}</Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={9}>
                                    {/* Text field to edit the form description */}
                                    <TextField
                                        label="Form Description"
                                        fullWidth
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Label</TableCell>
                                <TableCell>Control Type</TableCell>
                                <TableCell>Validations</TableCell>
                                <TableCell>Placeholder</TableCell>
                                <TableCell>Error Message</TableCell>
                                <TableCell>Helper Text</TableCell>
                                <TableCell>Min Length</TableCell>
                                <TableCell>Max Length</TableCell>
                                <TableCell>Options</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Map through the form fields and render a row for each */}
                            {formFields.map((field, index) => (
                                <TableRow key={field.id || index}> {/* Use field.id if available, otherwise index for new fields */}
                                    <TableCell>
                                        {/* Text field to edit the field label */}
                                        <TextField
                                            value={field.label}
                                            onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Select dropdown to choose the control type of the field */}
                                        <Select
                                            value={field.controlType}
                                            onChange={(e) => handleFieldChange(index, 'controlType', e.target.value)}
                                            size="small"
                                        >
                                            {controlTypes.map((type) => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        {/* Multi-select dropdown to choose validations for the field */}
                                        <FormControl fullWidth size="small">
                                            <Select
                                                multiple
                                                value={field.validations || []}
                                                onChange={(e) => handleFieldChange(index, 'validations', e.target.value)}
                                                input={<OutlinedInput />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((val) => {
                                                            const label = validationOptions.find(v => v.value === val)?.label || val;
                                                            return <Chip key={val} label={label} />;
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {validationOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        <Checkbox checked={field.validations?.includes(option.value)} />
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        {/* Text field to edit the field placeholder */}
                                        <TextField
                                            value={field.placeholder}
                                            onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Text field to edit the field error message */}
                                        <TextField
                                            value={field.errorMessage}
                                            onChange={(e) => handleFieldChange(index, 'errorMessage', e.target.value)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Text field to edit the field helper text */}
                                        <TextField
                                            value={field.helperText || ''}
                                            onChange={(e) => handleFieldChange(index, 'helperText', e.target.value)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Text field to edit the minimum length (only for text-based controls) */}
                                        {['text', 'number', 'password'].includes(field.controlType) && (
                                            <TextField
                                                type="number"
                                                value={field.minLength || ''}
                                                onChange={(e) => handleFieldChange(index, 'minLength', e.target.value)}
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {/* Text field to edit the maximum length (only for text-based controls) */}
                                        {['text', 'number', 'password'].includes(field.controlType) && (
                                            <TextField
                                                type="number"
                                                value={field.maxLength || ''}
                                                onChange={(e) => handleFieldChange(index, 'maxLength', e.target.value)}
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {/* Container for managing options (for radio and checkbox controls) */}
                                        {['radio', 'checkbox'].includes(field.controlType) && (
                                            <Box>
                                                {/* Text field to set the number of options */}
                                                <TextField
                                                    label="Options Count"
                                                    type="number"
                                                    value={field.optionsCount || ''}
                                                    onChange={(e) => handleFieldChange(index, 'optionsCount', e.target.value)}
                                                    size="small"
                                                />
                                                {/* Input fields for each option */}
                                                {field.options?.map((option, optIndex) => (
                                                    <TextField
                                                        key={optIndex}
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                                                        placeholder={`Option ${optIndex + 1}`}
                                                        size="small"
                                                        style={{ marginTop: 4 }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {/* Buttons for moving the field up or down and deleting it */}
                                        <IconButton onClick={() => handleMoveField(index, 'up')}>
                                            <ArrowUpwardIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleMoveField(index, 'down')}>
                                            <ArrowDownwardIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteField(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {/* Button to trigger the save confirmation dialog */}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={() => setOpenConfirm(true)}
                        style={{ marginTop: 16 }}
                    >
                        Save Form
                    </Button>
                </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
                <DialogTitle>Confirm Save</DialogTitle>
                <DialogContent>
                    Are you sure you want to save changes to this form?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)} color="secondary">Cancel</Button>
                    <Button onClick={handleSave} color="primary">Yes, Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageDynamicForm;