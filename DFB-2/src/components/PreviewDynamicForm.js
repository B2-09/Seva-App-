import React, { useEffect, useState } from 'react';
import {
    Box,
    FormControlLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Checkbox,
    RadioGroup,
    Radio,
    FormLabel,
    FormGroup,
    Button,
    Slider,
    Input
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MUIDatePicker, DateTimePicker as MUIDateTimePicker, TimePicker as MUITimePicker } from '@mui/x-date-pickers';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import the API function to fetch forms
import { fetchForms } from '../api/formApi';

const PreviewDynamicForm = () => {
    const [forms, setForms] = useState([]);
    const [selectedFormId, setSelectedFormId] = useState('');
    const [selectedFormDetails, setSelectedFormDetails] = useState(null);
    const [sliderValues, setSliderValues] = useState({});
    const [dateValues, setDateValues] = useState({});
    const [dateTimeValues, setDateTimeValues] = useState({});
    const [timeValues, setTimeValues] = useState({});
    const [monthValuesAlt, setMonthValuesAlt] = useState({});
    const [weekValuesAlt, setWeekValuesAlt] = useState({});
    const [colorValues, setColorValues] = useState({}); // State to hold color values

    useEffect(() => {
        fetchForms()
            .then(data => {
                setForms(data);
            })
            .catch(error => {
                console.error('Error fetching forms:', error);
                alert('Failed to load forms.');
            });
    }, []);

    const handleFormSelect = (event) => {
        const formId = event.target.value;
        setSelectedFormId(formId);
        const formObject = forms.find((f) => f.id === parseInt(formId, 10));
        setSelectedFormDetails(formObject?.form_data || null);

        const initialSliderValues = {};
        const initialDateValues = {};
        const initialDateTimeValues = {};
        const initialTimeValues = {};
        const initialMonthValuesAlt = {};
        const initialWeekValuesAlt = {};
        const initialColorValues = {};

        formObject?.form_data?.fields.forEach(field => {
            if (field.controlType === 'range') {
                initialSliderValues[field.label] = parseInt(field.minMax?.split(',')[0] || 0, 10);
            } else if (field.controlType === 'date') {
                initialDateValues[field.label] = null;
            } else if (field.controlType === 'datetime-local') {
                initialDateTimeValues[field.label] = null;
            } else if (field.controlType === 'time') {
                initialTimeValues[field.label] = null;
            } else if (field.controlType === 'month') {
                initialMonthValuesAlt[field.label] = null;
            } else if (field.controlType === 'week') {
                initialWeekValuesAlt[field.label] = '';
            } else if (field.controlType === 'color') {
                initialColorValues[field.label] = '#000000'; // Initialize with a default color
            }
        });

        setSliderValues(initialSliderValues);
        setDateValues(initialDateValues);
        setDateTimeValues(initialDateTimeValues);
        setTimeValues(initialTimeValues);
        setMonthValuesAlt(initialMonthValuesAlt);
        setWeekValuesAlt(initialWeekValuesAlt);
        setColorValues(initialColorValues);
    };

    const handleSliderChange = (event, newValue, fieldLabel) => {
        setSliderValues({ ...sliderValues, [fieldLabel]: newValue });
    };

    const handleDateChange = (newValue, fieldLabel) => {
        setDateValues({ ...dateValues, [fieldLabel]: newValue });
    };

    const handleDateTimeChange = (newValue, fieldLabel) => {
        setDateTimeValues({ ...dateTimeValues, [fieldLabel]: newValue });
    };

    const handleTimeChange = (newValue, fieldLabel) => {
        setTimeValues({ ...timeValues, [fieldLabel]: newValue });
    };

    const handleMonthChangeAlt = (date, fieldLabel) => {
        setMonthValuesAlt({ ...monthValuesAlt, [fieldLabel]: date });
    };

    const handleWeekChangeAlt = (event, fieldLabel) => {
        setWeekValuesAlt({ ...weekValuesAlt, [fieldLabel]: event.target.value });
    };

    const handleColorChange = (event, fieldLabel) => {
        setColorValues({ ...colorValues, [fieldLabel]: event.target.value });
    };

    const selectedFormName = forms.find(form => form.id === parseInt(selectedFormId, 10))?.form_data?.formName || '';

    return (
        <Box p={2}>
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>Select a Form to Preview</Typography>
                <Select
                    value={selectedFormId}
                    onChange={handleFormSelect}
                    displayEmpty
                    fullWidth
                >
                    <MenuItem value="" disabled>Select Form</MenuItem>
                    {forms.map((form) => (
                        <MenuItem key={form.id} value={form.id}>
                            {form.form_data?.formName}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {selectedFormDetails && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {selectedFormDetails.formName}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        {selectedFormDetails.formDescription}
                    </Typography>
                    <form>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            {selectedFormDetails.fields.map((field, index) => (
                                <Box key={index} mb={2}>
                                    {(field.controlType === 'text' ||
                                        field.controlType === 'number' ||
                                        field.controlType === 'email' ||
                                        field.controlType === 'password' ||
                                        field.controlType === 'search' ||
                                        field.controlType === 'tel' ||
                                        field.controlType === 'url') && (
                                            <TextField
                                                label={field.label}
                                                type={field.controlType}
                                                placeholder={field.placeholder}
                                                required={field.validations?.includes('required')}
                                                inputProps={{
                                                    minLength: field.minLength || undefined,
                                                    maxLength: field.maxLength || undefined,
                                                }}
                                                helperText={field.helperText}
                                                fullWidth
                                            />
                                        )}

                                    {field.controlType === 'date' && (
                                        <MUIDatePicker
                                            label={field.label}
                                            value={dateValues[field.label] || null}
                                            onChange={(newValue) => handleDateChange(newValue, field.label)}
                                            renderInput={(params) => <TextField {...params} fullWidth helperText={field.helperText} />}
                                        />
                                    )}

                                    {field.controlType === 'datetime-local' && (
                                        <MUIDateTimePicker
                                            label={field.label}
                                            value={dateTimeValues[field.label] || null}
                                            onChange={(newValue) => handleDateTimeChange(newValue, field.label)}
                                            renderInput={(params) => <TextField {...params} fullWidth helperText={field.helperText} />}
                                        />
                                    )}

                                    {field.controlType === 'month' && (
                                        <div className="form-control">
                                            {/* <label htmlFor={`month-${index}`}>{field.label}</label> */}
                                            <DatePicker
                                                id={`month-${index}`}
                                                selected={monthValuesAlt[field.label] || null}
                                                onChange={(date) => handleMonthChangeAlt(date, field.label)}
                                                dateFormat="yyyy-MM"
                                                showMonthYearPicker
                                                className="react-datepicker-wrapper"
                                                popperPlacement="bottom-start"
                                                customInput={<TextField label={field.label} fullWidth helperText={field.helperText} />}
                                            />
                                        </div>
                                    )}

                                    {field.controlType === 'time' && (
                                        <MUITimePicker
                                            label={field.label}
                                            value={timeValues[field.label] || null}
                                            onChange={(newValue) => handleTimeChange(newValue, field.label)}
                                            renderInput={(params) => <TextField {...params} fullWidth helperText={field.helperText} />}
                                        />
                                    )}

                                    {field.controlType === 'week' && (
                                        <TextField
                                            label={field.label}
                                            type="week"
                                            placeholder={field.placeholder}
                                            required={field.validations?.includes('required')}
                                            helperText={field.helperText}
                                            fullWidth
                                            value={weekValuesAlt[field.label] || ''}
                                            onChange={(event) => handleWeekChangeAlt(event, field.label)}
                                            InputProps={{
                                                readOnly: false,
                                            }}
                                            inputProps={{}}
                                        />
                                    )}

                                    {field.controlType === 'checkbox' && field.options?.length <= 1 && (
                                        <FormControlLabel
                                            control={<Checkbox />}
                                            label={field.options[0] || field.label}
                                        />
                                    )}

                                    {field.controlType === 'checkbox' && field.options?.length > 1 && (
                                        <FormGroup>
                                            <FormLabel component="legend">{field.label}</FormLabel>
                                            {field.options?.map((option, idx) => (
                                                <FormControlLabel
                                                    key={idx}
                                                    control={<Checkbox />}
                                                    label={option}
                                                />
                                            ))}
                                        </FormGroup>
                                    )}

                                    {field.controlType === 'radio' && (
                                        <Box>
                                            <FormLabel component="legend">{field.label}</FormLabel>
                                            <RadioGroup row>
                                                {field.options?.map((option, idx) => (
                                                    <FormControlLabel
                                                        key={idx}
                                                        value={option}
                                                        control={<Radio />}
                                                        label={option}
                                                    />
                                                ))}
                                            </RadioGroup>
                                        </Box>
                                    )}

                                    {field.controlType === 'range' && (
                                        <Box>
                                            <FormLabel component="legend">{field.label}</FormLabel>
                                            <Slider
                                                value={sliderValues[field.label] || parseInt(field.minMax?.split(',')[0] || 0, 10)}
                                                min={field.minMax?.split(',')[0] || 0}
                                                max={field.minMax?.split(',')[1] || 100}
                                                aria-labelledby={`slider-label-${index}`}
                                                valueLabelDisplay="auto"
                                                step={field.step || 1}
                                                marks={[{
                                                    value: parseInt(field.minMax?.split(',')[0] || 0, 10),
                                                    label: field.minMax?.split(',')[0] || '0',
                                                },
                                                {
                                                    value: parseInt(field.minMax?.split(',')[1] || 100, 10),
                                                    label: field.minMax?.split(',')[1] || '100',
                                                }]}
                                                onChange={(event, newValue) => handleSliderChange(event, newValue, field.label)}
                                                fullWidth
                                            />
                                            <Typography variant="body2" color="textSecondary">
                                                Value: {sliderValues[field.label] || field.minMax?.split(',')[0] || '0'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {field.controlType === 'color' && (
                                        <Box display="flex" alignItems="center">
                                            <FormLabel component="legend" sx={{ marginRight: 2 }}>{field.label}</FormLabel>
                                            <Input
                                                type="color"
                                                defaultValue="#000000"
                                                value={colorValues[field.label] || '#000000'}
                                                onChange={(event) => handleColorChange(event, field.label)}
                                            />
                                            <Typography variant="body2" sx={{ marginLeft: 2 }}>
                                                {colorValues[field.label] || '#000000'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {field.controlType === 'file' && (
                                        <Box>
                                            <FormLabel component="legend">{field.label}</FormLabel>
                                            <Input type="file" readOnly />
                                        </Box>
                                    )}

                                    {field.controlType === 'hidden' && (
                                        <input type="hidden" value={field.placeholder || ''} />
                                    )}

                                    {field.controlType === 'submit' && (
                                        <Button type="submit" variant="contained" color="primary">
                                            {field.label || 'Submit'}
                                        </Button>
                                    )}

                                    {field.controlType === 'reset' && (
                                        <Button type="reset" variant="outlined">
                                            {field.label || 'Reset'}
                                        </Button>
                                    )}

                                    {field.controlType === 'button' && (
                                        <Button variant="contained">
                                            {field.label || 'Click Me'}
                                        </Button>
                                    )}

                                    {field.controlType === 'image' && (
                                        <Button component="label">
                                            {field.label || 'Image Button'}
                                            <Input type="image" style={{ display: 'none' }} />
                                        </Button>
                                    )}
                                </Box>
                            ))}
                        </LocalizationProvider>
                    </form>
                </Box>
            )}
        </Box>
    );
};

export default PreviewDynamicForm;