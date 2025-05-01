const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost', // Replace with your database host
    user: 'root', // Replace with your database user
    password: 'root', // Replace with your database password
    database: 'dynamic_screen_db' // Replace with your database name
};

// const saveFormData = async (req, res) => {
//     try {
//         const { formName, formDescription, fields } = req.body;

//         if (!formName) {
//             return res.status(400).json({ error: 'Form name is required.' });
//         }

//         const connection = await mysql.createConnection(dbConfig);

//         // 1. Save the form metadata
//         const [formResult] = await connection.execute(
//             'INSERT INTO forms (form_name, form_description) VALUES (?, ?)',
//             [formName, formDescription]
//         );
//         const formId = formResult.insertId;

//         // 2. Save the form fields
//         if (fields && fields.length > 0) {
//             const fieldValues = fields.map((field, index) => [
//                 formId,
//                 field.label,
//                 field.controlType,
//                 field.required,
//                 field.placeholder,
//                 field.errorMessage,
//                 field.minLength || null,
//                 field.maxLength || null,
//                 field.optionsCount || 0,
//                 JSON.stringify(field.options || []),
//                 field.validateEmail || false,
//                 index // Use index as field order
//             ]);

//             await connection.execute(
//                 'INSERT INTO form_fields (form_id, label, control_type, required, placeholder, error_message, min_length, max_length, options_count, options, validate_email, field_order) VALUES ?',
//                 [fieldValues]
//             );
//         }

//         await connection.end();

//         res.status(201).json({ message: 'Form data saved successfully!', formId: formId });

//     } catch (error) {
//         console.error('Error saving form data:', error);
//         res.status(500).json({ error: 'Failed to save form data.' });
//     }
// };

// const saveFormData = async (req, res) => {
//     try {
//         const { formName, formDescription, fields } = req.body;

//         if (!formName) {
//             return res.status(400).json({ error: 'Form name is required.' });
//         }

//         const connection = await mysql.createConnection(dbConfig);

//         // 1. Save the form metadata
//         const [formResult] = await connection.execute(
//             'INSERT INTO forms (form_name, form_description) VALUES (?, ?)',
//             [formName, formDescription]
//         );
//         const formId = formResult.insertId;

//         // 2. Save the form fields
//         // if (fields && fields.length > 0) {
//         //     const fieldValues = fields.map((field, index) => [
//         //         formId,
//         //         field.label,
//         //         field.controlType,
//         //         field.required,
//         //         field.placeholder,
//         //         field.errorMessage,
//         //         field.minLength || null,
//         //         field.maxLength || null,
//         //         field.optionsCount || 0,
//         //         JSON.stringify(field.options || []),
//         //         field.validateEmail || false,
//         //         index // Use index as field order
//         //     ]);

//         //     // The '?' placeholder now correctly corresponds to the array of arrays
//         //     await connection.execute(
//         //         'INSERT INTO form_fields (form_id, label, control_type, required, placeholder, error_message, min_length, max_length, options_count, options, validate_email, field_order) VALUES ?',
//         //         [fieldValues]
//         //     );
//         // }

//         // await connection.end();
//         if (fields && fields.length > 0) {
//             const firstField = fields[0];
//             const query = `
//                 INSERT INTO form_fields (
//                     form_id, label, control_type, required, placeholder,
//                     error_message, min_length, max_length, options_count,
//                     options, validate_email, field_order
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;
//             const values = [
//                 formId,
//                 firstField.label,
//                 firstField.controlType,
//                 firstField.required,
//                 firstField.placeholder,
//                 firstField.errorMessage,
//                 firstField.minLength || null,
//                 firstField.maxLength || null,
//                 firstField.optionsCount || 0,
//                 JSON.stringify(firstField.options || []),
//                 firstField.validateEmail || false,
//                 0 // For the first field
//             ];
    
//             console.log('Test Query:', query);
//             console.log('Test Values:', values);
    
//             await connection.execute(query, values);
    
//             // After this test, REMOVE this block and go back to the bulk insert attempt
//             // if (fields.length > 1) {
//             //     const remainingFieldsValues = fields.slice(1).map((field, index) => [
//             //     formId,
//             //     field.label,
//             //     field.controlType,
//             //     field.required,
//             //     field.placeholder,
//             //     field.errorMessage,
//             //     field.minLength || null,
//             //     field.maxLength || null,
//             //     field.optionsCount || 0,
//             //     JSON.stringify(field.options || []),
//             //     field.validateEmail || false,
//             //     index + 1
//             //     ]);
//             //     await connection.execute(
//             //         'INSERT INTO form_fields (form_id, label, control_type, required, placeholder, error_message, min_length, max_length, options_count, options, validate_email, field_order) VALUES ?',
//             //         [remainingFieldsValues]
//             //     );
//             // }
//         }

//         res.status(201).json({ message: 'Form data saved successfully!', formId: formId });

//     } catch (error) {
//         console.error('Error saving form data:', error);
//         res.status(500).json({ error: 'Failed to save form data.' });
//     }
// };

const saveFormData = async (req, res) => {
    try {
        const { formName, formDescription, fields } = req.body;

        if (!formName) {
            return res.status(400).json({ error: 'Form name is required.' });
        }

        const connection = await mysql.createConnection(dbConfig);

        // 1. Save the form metadata
        const [formResult] = await connection.execute(
            'INSERT INTO forms (form_name, form_description) VALUES (?, ?)',
            [formName, formDescription]
        );
        const formId = formResult.insertId;

        // 2. Save the form fields
        if (fields && fields.length > 0) {
            const valuesPlaceholders = fields.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const query = `
                INSERT INTO form_fields (
                    form_id, label, control_type, required, placeholder,
                    error_message, min_length, max_length, options_count,
                    options, validate_email, field_order
                ) VALUES ${valuesPlaceholders}
            `;

            const allValues = fields.flatMap((field, index) => [
                formId,
                field.label,
                field.controlType,
                field.required,
                field.placeholder,
                field.errorMessage,
                field.minLength || null,
                field.maxLength || null,
                field.optionsCount || 0,
                JSON.stringify(field.options || []),
                field.validateEmail || false,
                index
            ]);

            console.log('Bulk Insert Query:', query);
            console.log('Bulk Insert Values:', allValues);

            await connection.execute(query, allValues);
        }

        await connection.end();

        res.status(201).json({ message: 'Form data saved successfully!', formId: formId });

    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ error: 'Failed to save form data.' });
    }
};

const getAllFormsData = async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Fetch all forms
        const [forms] = await connection.execute('SELECT id, form_name, form_description FROM forms');

        // 2. Fetch all fields for each form
        const formsWithFields = await Promise.all(
            forms.map(async (form) => {
                const [fields] = await connection.execute(
                    'SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order ASC',
                    [form.id]
                );
                return { ...form, fields };
            })
        );

        await connection.end();

        res.status(200).json(formsWithFields);

    } catch (error) {
        console.error('Error fetching all form data:', error);
        res.status(500).json({ error: 'Failed to fetch form data.' });
    }
};

module.exports = {
    saveFormData,
    getAllFormsData // Export the new function
};