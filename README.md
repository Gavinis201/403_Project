----------------------- CREATE DATABASE --------------------------------------------
-- Create the accounts table
CREATE TABLE accounts (
    user_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    password VARCHAR(20) NOT NULL,
    acc_first_name VARCHAR(30) NOT NULL,
    acc_last_name VARCHAR(30) NOT NULL,
    baby_name VARCHAR(30)
);

-- Create the activities table
CREATE TABLE activities (
    activity_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    activity_description VARCHAR(50) NOT NULL
);

-- Create the baby_log table
CREATE TABLE baby_log (
    log_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- Primary key for baby_log
    user_id INT NOT NULL,                  -- Foreign key referencing accounts
    activity_id INT NOT NULL,              -- Foreign key referencing activities
    activity_date DATE NOT NULL,
    activity_notes VARCHAR(150),
    CONSTRAINT FK_User FOREIGN KEY (user_id) REFERENCES accounts(user_id),
    CONSTRAINT FK_Activity FOREIGN KEY (activity_id) REFERENCES activities(activity_id)
);

-------------------- DUMMY DATA ------------------------------------------------
-- Insert dummy data into accounts table
INSERT INTO accounts (username, password, acc_first_name, acc_last_name, baby_name)
VALUES 
    ('jdoe', 'password123', 'John', 'Doe', 'Emily'),
    ('asmith', 'securepass', 'Alice', 'Smith', 'Ethan'),
    ('mjones', 'mypassword', 'Michael', 'Jones', 'Sophia');

-- Insert activity descriptions into activities table
INSERT INTO activities (activity_description)
VALUES 
    ('Feeding'),
    ('Diaper Change'),
    ('Doctor Visit'),
    ('Sleep');

-- Insert dummy data into baby_log table
INSERT INTO baby_log (user_id, activity_id, activity_date, activity_notes)
VALUES 
    (1, 1, '2024-12-01', 'Fed Emily with formula.'),
    (1, 2, '2024-12-01', 'Changed a wet diaper.'),
    (2, 4, '2024-12-02', 'Ethan slept for 2 hours.'),
    (2, 3, '2024-12-03', 'Ethan visited the doctor for a checkup.'),
    (3, 1, '2024-12-04', 'Sophia had her feeding.'),
    (3, 4, '2024-12-05', 'Sophia slept for 3 hours.');