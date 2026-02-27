-- WBAT Database Initialization (idempotent)
-- Run on first start; safe to re-run

CREATE DATABASE IF NOT EXISTS wbat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wbat;

-- ─── Companies ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  vat_number    VARCHAR(50)   DEFAULT NULL,
  address       TEXT          DEFAULT NULL,
  email         VARCHAR(255)  DEFAULT NULL,
  phone         VARCHAR(50)   DEFAULT NULL,
  logo_path     VARCHAR(512)  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  full_name     VARCHAR(255)  DEFAULT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Customers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED  NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  vat_number    VARCHAR(50)   DEFAULT NULL,
  address       TEXT          DEFAULT NULL,
  email         VARCHAR(255)  DEFAULT NULL,
  phone         VARCHAR(50)   DEFAULT NULL,
  notes         TEXT          DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED  NOT NULL,
  customer_id   INT UNSIGNED  NOT NULL,
  invoice_number VARCHAR(50)  NOT NULL,
  status        ENUM('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  issue_date    DATE          NOT NULL,
  due_date      DATE          NOT NULL,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_rate      DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes         TEXT          DEFAULT NULL,
  pdf_path      VARCHAR(512)  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_number (company_id, invoice_number),
  CONSTRAINT fk_invoices_company  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- ─── Invoice Line Items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id    INT UNSIGNED  NOT NULL,
  description   VARCHAR(500)  NOT NULL,
  quantity      DECIMAL(10,3) NOT NULL DEFAULT 1.000,
  unit_price    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_total    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order    INT           NOT NULL DEFAULT 0,
  CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Attachments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED  NOT NULL,
  invoice_id    INT UNSIGNED  DEFAULT NULL,
  original_name VARCHAR(255)  NOT NULL,
  stored_path   VARCHAR(512)  NOT NULL,
  mime_type     VARCHAR(100)  DEFAULT NULL,
  file_size     INT UNSIGNED  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Seed ────────────────────────────────────────────────────────────────────
-- Insert default company if not exists
INSERT INTO companies (id, name, vat_number, address, email, phone)
SELECT 1, 'My Company', 'VAT123456', '1 Main Street, City', 'admin@local', '+1 555 0000'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 1);

-- Insert default admin user (password: admin  — bcrypt hash)
-- Hash for "admin": $2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WnGDtLuCqWKaMB/6p4Oi
INSERT INTO users (id, company_id, email, password_hash, full_name, role)
SELECT 1, 1, 'admin@local', '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WnGDtLuCqWKaMB/6p4Oi', 'Administrator', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@local');

-- Sample customer
INSERT INTO customers (id, company_id, name, vat_number, address, email, phone)
SELECT 1, 1, 'Acme Corp', 'VAT999', '42 Anywhere Rd', 'billing@acme.example', '+1 555 1234'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE id = 1);
