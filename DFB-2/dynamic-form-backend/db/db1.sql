-- Database: your_database_name
USE dynamic_screen_db;
CREATE TABLE IF NOT EXISTS forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_name VARCHAR(255) NOT NULL UNIQUE,
    form_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Select * from forms;
TRUNCATE TABLE forms;
TRUNCATE TABLE form_fields;
Select * from form_fields;
DELETE FROM form_fields;
ALTER TABLE form_fields
DROP FOREIGN KEY form_id;
drop table form_fields;

ALTER TABLE forms
ADD COLUMN form_data JSON;

CREATE TABLE IF NOT EXISTS form_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    control_type VARCHAR(50) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    placeholder VARCHAR(255),
    error_message VARCHAR(255),
    min_length INT,
    max_length INT,
    options_count INT DEFAULT 0,
    options JSON, -- Store options as a JSON array for radio/checkbox
    validate_email BOOLEAN DEFAULT FALSE,
    field_order INT, -- To maintain the order of fields
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);