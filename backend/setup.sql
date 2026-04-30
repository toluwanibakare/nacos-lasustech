-- 
-- NACOS LASUSTECH Database Setup
-- ---------------------------------------------------------
-- Run this in your MySQL environment to get started.
-- 

CREATE DATABASE IF NOT EXISTS nacos_lasustech;
USE nacos_lasustech;

-- Students Table (Members)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    matric_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    level ENUM('100L', '200L', '300L', '400L', '500L') NOT NULL,
    dues_status ENUM('Paid', 'Pending') DEFAULT 'Pending',
    id_card_status ENUM('Not Registered', 'Pending', 'Ready', 'Collected') DEFAULT 'Not Registered',
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    attendance_percentage INT DEFAULT 0,
    resources_count INT DEFAULT 0,
    role ENUM('student', 'admin') DEFAULT 'student',
    profile_image VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities Table (Recent updates for students)
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    type VARCHAR(100) NOT NULL, -- e.g. 'Profile Update', 'Dues Payment'
    status VARCHAR(50), -- 'Done', 'Incomplete', 'Attended'
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);


-- Executives Table
CREATE TABLE IF NOT EXISTS executives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    post VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL,
    image_url VARCHAR(255),
    description TEXT
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(255),
    image_url VARCHAR(255)
);

-- Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'NACOS LASUSTECH',
    image_url VARCHAR(255),
    category VARCHAR(50),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ID Card Requests Table
CREATE TABLE IF NOT EXISTS id_card_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    passport_url TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    matric_number VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10),
    birthday DATE,
    emergency_contact VARCHAR(20),
    status ENUM('pending', 'processing', 'ready', 'collected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Payments Table (Tracking transactions)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    payment_type VARCHAR(50), -- e.g. 'dues', 'id_card'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Initial Mock Data (Optional)
-- INSERT INTO students (full_name, matric_number, password, level) VALUES ('John Doe', '230303010052', '$2a$10$vI8qS/9/S/9/S/9/S/9/S/9', '400L');
