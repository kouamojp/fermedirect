-- SQL Schema for FermesDirect Subscriptions
CREATE DATABASE IF NOT EXISTS fermedirect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fermedirect;

-- Table for Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country VARCHAR(60) NOT NULL,
  business_type VARCHAR(20) NOT NULL,
  plan VARCHAR(20) NOT NULL,
  products JSON DEFAULT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table for Farmers
CREATE TABLE IF NOT EXISTS farmers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  farm_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country VARCHAR(60) NOT NULL,
  farm_size VARCHAR(20) NOT NULL,
  product_types JSON DEFAULT NULL,
  plan VARCHAR(20) NOT NULL,
  capacity VARCHAR(255),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table for Authenticated Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('buyer', 'farmer', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
