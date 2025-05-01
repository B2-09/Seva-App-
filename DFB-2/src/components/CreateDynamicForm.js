// frontend-react/src/components/CreateDynamicForm.js
import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Box,
    IconButton,
} from '@mui/material';
import { Select, MenuItem, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Import the API function to save the form data to the backend
import { saveFormData } from '../api/formApi';
// Import the list of available validation options for the select dropdown
import { validationOptions } from '../constants/validationOptions';
// Import the list of available control types for the select dropdown
import { controlTypes } from '../constants/controlTypes';

// Functional component for creating dynamic forms
export default function CreateDynamicForm() {
    // State to manage the array of form fields (rows in the table)
    const [rows, setRows] = useState([]);
    // State to store the name of the form
    const [formName, setFormName] = useState('');
    // State to store the description of the form
    const [formDescription, setFormDescription] = useState('');
    // State to store any saved forms (currently using local storage)
    const [savedForms, setSavedForms] = useState([]);
    // State to manage the active tab (currently only one tab for creation)
    const [tab, setTab] = useState(0);

    // useEffect hook to load any previously saved forms from local storage on component mount
    useEffect(() => {
        const storedForms = JSON.parse(localStorage.getItem('savedForms')) || [];
        setSavedForms(storedForms);
        console.log('Manage Dynamic form', storedForms);
    }, []); // Empty dependency array ensures this runs only once after the initial render

    // Function to add a new empty row (form field) to the rows state
    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now(), // Add a unique ID for each row to help with tracking
                label: '',
                controlType: 'text', // Default control type
                placeholder: '',
                errorMessage: '',
                minLength: '',
                maxLength: '',
                optionsCount: 0, // For radio/checkbox options
                options: [],     // Array to hold radio/checkbox options
                validations: [], // Array to hold selected validation rules
                available: true,
            },
        ]);
    };

    // Function to delete a row (form field) at a specific index
    const deleteRow = (index) => {
        const updatedRows = rows.filter((_, idx) => idx !== index);
        setRows(updatedRows);
    };

    // Function to move a row up or down in the table, affecting the form field order
    const moveRow = (index, direction) => {
        const newRows = [...rows];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        // Prevent moving beyond the bounds of the array
        if (targetIndex < 0 || targetIndex >= newRows.length) return;
        // Swap the elements at the current and target indices
        const temp = newRows[targetIndex];
        newRows[targetIndex] = newRows[index];
        newRows[index] = temp;
        setRows(newRows);
    };

    // Function to update the value of a specific field in a row
    const updateRow = (index, field, value) => {
        const updatedRows = rows.map((row, idx) => {
            if (idx === index) {
                const updatedRow = { ...row, [field]: value };

                // Reset extra properties when the control type changes
                if (field === 'controlType') {
                    updatedRow.minLength = '';
                    updatedRow.maxLength = '';
                    updatedRow.optionsCount = 0;
                    updatedRow.options = [];
                }

                return updatedRow;
            }
            return row;
        });
        setRows(updatedRows);
    };

    // Function to update the number of options for radio or checkbox controls
    const updateOptionsCount = (index, count) => {
        const updatedRows = rows.map((row, idx) => {
            if (idx === index) {
                // Create an array of the specified length, preserving existing options
                const options = Array.from({ length: Number(count) }, (_, i) => row.options[i] || '');
                return { ...row, optionsCount: count, options };
            }
            return row;
        });
        setRows(updatedRows);
    };

    // Function to update the value of a specific option for radio or checkbox controls
    const updateOptionValue = (rowIndex, optionIndex, value) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex].options[optionIndex] = value;
        setRows(updatedRows);
    };

    // Asynchronous function to save the form data to the backend
    const handleSave = async () => {
        // Basic validation to ensure form name is not empty
        if (!formName.trim()) {
            alert('Form Name is required!');
            return;
        }

        // Prepare the form details object to be sent to the backend
        const formDetails = { formName, formDescription, fields: rows };

        try {
            // Call the API function to save the form data
            const data = await saveFormData(formDetails);
            alert('Form saved to database successfully!');
            console.log('Form ID:', data.formId);
            handleNewForm(); // Clear the form after successful save
        } catch (error) {
            alert('Failed to save form to database.');
            console.error('Error saving form:', error);
        }

        // Optional: Save to local storage as well (for demonstration or fallback)
        const updatedForms = [
            ...savedForms.filter((f) => f.formName !== formName), // Remove existing form with the same name
            formDetails,
        ];
        localStorage.setItem('savedForms', JSON.stringify(updatedForms));
        setSavedForms(updatedForms);
        console.log('Saved to local storage:', updatedForms);
    };

    // Function to reset the form to its initial state (clear fields)
    const handleNewForm = () => {
        setFormName('');
        setFormDescription('');
        setRows([]);
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Tabs for navigation (currently only one tab) */}
            <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                <Tab label="Create Dynamic Form" />
            </Tabs>

            {/* Content for the 'Create Dynamic Form' tab */}
            {tab === 0 && (
                <div>
                    {/* Input fields for form name and description */}
                    <Box display="flex" gap={2} marginTop={2} marginBottom={2}>
                        <TextField
                            label="Form Name *"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            variant="outlined"
                            size="small"
                            required
                            fullWidth
                        />
                        <TextField
                            label="Form Description"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Box>

                    {/* Button to clear the current form */}
                    <Button variant="contained" color="secondary" onClick={handleNewForm} style={{ marginBottom: 16, marginRight: 8 }}>
                        New Form
                    </Button>

                    {/* Button to add a new form field (row) */}
                    <Button variant="contained" color="primary" onClick={addRow} style={{ marginBottom: 16 }}>
                        Add Row
                    </Button>

                    {/* Table to display and edit the dynamic form fields */}
                    <TableContainer component={Paper} style={{ marginBottom: 16 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Label</TableCell>
                                    <TableCell>Control Type</TableCell>
                                    <TableCell>Placeholder / Help Text</TableCell>
                                    <TableCell>Error Message</TableCell>
                                    <TableCell>Extra Options</TableCell>
                                    <TableCell>Choose Validation</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Map through the rows (form fields) and render each one */}
                                {rows.map((row, index) => (
                                    <TableRow key={row.id}> {/* Use the unique row.id as the key for efficient updates */}
                                        <TableCell>
                                            {/* Input for the label of the form field */}
                                            <TextField
                                                value={row.label}
                                                onChange={(e) => updateRow(index, 'label', e.target.value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {/* Dropdown to select the control type of the form field */}
                                            <TextField
                                                select
                                                SelectProps={{ native: true }}
                                                value={row.controlType}
                                                onChange={(e) => updateRow(index, 'controlType', e.target.value)}
                                                size="small"
                                            >
                                                {controlTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            {/* Input for the placeholder or help text of the form field */}
                                            <TextField
                                                value={row.placeholder}
                                                onChange={(e) => updateRow(index, 'placeholder', e.target.value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {/* Input for the error message to display for the form field */}
                                            <TextField
                                                value={row.errorMessage}
                                                onChange={(e) => updateRow(index, 'errorMessage', e.target.value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {/* Conditional rendering of extra options based on the control type */}
                                            {['text', 'password', 'number'].includes(row.controlType) && (
                                                <Box display="flex" flexDirection="column" gap={1}>
                                                    {/* Input for minimum length validation */}
                                                    <TextField
                                                        label="Min Length"
                                                        type="number"
                                                        value={row.minLength}
                                                        onChange={(e) => updateRow(index, 'minLength', e.target.value)}
                                                        size="small"
                                                    />
                                                    {/* Input for maximum length validation */}
                                                    <TextField
                                                        label="Max Length"
                                                        type="number"
                                                        value={row.maxLength}
                                                        onChange={(e) => updateRow(index, 'maxLength', e.target.value)}
                                                        size="small"
                                                    />
                                                </Box>
                                            )}

                                            {/* Options for radio and checkbox controls */}
                                            {['checkbox', 'radio'].includes(row.controlType) && (
                                                <Box display="flex" flexDirection="column" gap={1}>
                                                    {/* Input to set the number of options */}
                                                    <TextField
                                                        label="Number of Options"
                                                        type="number"
                                                        value={row.optionsCount}
                                                        onChange={(e) => updateOptionsCount(index, e.target.value)}
                                                        size="small"
                                                    />
                                                    {/* Input fields for each option */}
                                                    {Array.from({ length: Number(row.optionsCount) }).map((_, optIdx) => (
                                                        <TextField
                                                            key={optIdx}
                                                            label={`Option ${optIdx + 1}`}
                                                            value={row.options[optIdx] || ''}
                                                            onChange={(e) => updateOptionValue(index, optIdx, e.target.value)}
                                                            size="small"
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {/* Multi-select dropdown to choose validation rules for the field */}
                                            <Select
                                                multiple
                                                displayEmpty
                                                value={row.validations}
                                                onChange={(e) => updateRow(index, 'validations',
                                                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                                                )}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.length === 0 ? (
                                                            <em>Select Validations</em>
                                                        ) : (
                                                            selected.map((value) => (
                                                                <Chip key={value} label={validationOptions.find(opt => opt.value === value)?.label || value} />
                                                            ))
                                                        )}
                                                    </Box>
                                                )}
                                                size="small"
                                                fullWidth
                                            >
                                                {validationOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {/* Buttons to move the row up, down, and delete it */}
                                            <IconButton onClick={() => moveRow(index, 'up')}>
                                                <ArrowUpwardIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => moveRow(index, 'down')}>
                                                <ArrowDownwardIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => deleteRow(index)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Button to save the created dynamic form */}
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        Save Form
                    </Button>
                </div>
            )}
        </div>
    );
}