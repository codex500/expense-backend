/**
 * Complete PostgreSQL schema for the Expense Tracker.
 *
 * KEY DESIGN DECISIONS:
 * - All money stored as BIGINT (paise/cents) — ₹500.25 = 50025
 * - CHECK constraints prevent negative balances at DB level
 * - Indexes for all common query patterns
 * - user_profiles.id references Supabase auth.users(id)
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id                UUID PRIMARY KEY,  -- matches auth.users.id
  email             VARCHAR(255) NOT NULL UNIQUE,
  full_name         VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url        TEXT,
  phone_number      VARCHAR(20),
  dob               DATE,
  gender            VARCHAR(20),
  pan_number        TEXT,

  -- Preferences
  default_currency  VARCHAR(10) NOT NULL DEFAULT 'INR',
  theme_preference  VARCHAR(10) NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  
  -- Notification preferences
  notify_email      BOOLEAN NOT NULL DEFAULT true,
  notify_push       BOOLEAN NOT NULL DEFAULT true,
  notify_budget     BOOLEAN NOT NULL DEFAULT true,
  notify_salary     BOOLEAN NOT NULL DEFAULT true,
  notify_weekly     BOOLEAN NOT NULL DEFAULT true,
  notify_monthly    BOOLEAN NOT NULL DEFAULT true,
  notify_low_balance BOOLEAN NOT NULL DEFAULT true,

  email_verified    BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,

  -- Salary info
  monthly_salary_paise BIGINT DEFAULT 0,
  salary_account_id    UUID,  -- FK added after accounts table
  salary_day           INTEGER DEFAULT 1 CHECK (salary_day >= 1 AND salary_day <= 28),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================================
-- 2. ACCOUNTS (bank, cash, UPI, credit card, wallet)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_name      VARCHAR(255) NOT NULL,
  bank_name         VARCHAR(255),
  type              VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'upi', 'bank_account', 'credit_card', 'wallet')),
  current_balance_paise BIGINT NOT NULL DEFAULT 0 CHECK (current_balance_paise >= 0),
  icon              VARCHAR(100) DEFAULT 'wallet',
  color             VARCHAR(20) DEFAULT '#6366F1',
  is_default        BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_default ON accounts(user_id, is_default);

-- Add FK for salary_account_id now that accounts table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_salary_account'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT fk_user_salary_account
      FOREIGN KEY (salary_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. CATEGORIES (system defaults + user custom)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,  -- NULL = system default
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  icon        VARCHAR(100) DEFAULT 'tag',
  color       VARCHAR(20) DEFAULT '#6366F1',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Insert system default categories
INSERT INTO categories (id, user_id, name, type, icon, color, is_system) VALUES
  (uuid_generate_v4(), NULL, 'Food', 'expense', 'utensils', '#EF4444', true),
  (uuid_generate_v4(), NULL, 'Travel', 'expense', 'plane', '#3B82F6', true),
  (uuid_generate_v4(), NULL, 'Bills', 'expense', 'file-text', '#F59E0B', true),
  (uuid_generate_v4(), NULL, 'Shopping', 'expense', 'shopping-bag', '#EC4899', true),
  (uuid_generate_v4(), NULL, 'Entertainment', 'expense', 'film', '#8B5CF6', true),
  (uuid_generate_v4(), NULL, 'Salary', 'income', 'briefcase', '#10B981', true),
  (uuid_generate_v4(), NULL, 'EMI', 'expense', 'credit-card', '#F97316', true),
  (uuid_generate_v4(), NULL, 'Health', 'expense', 'heart', '#14B8A6', true),
  (uuid_generate_v4(), NULL, 'Education', 'expense', 'book', '#6366F1', true),
  (uuid_generate_v4(), NULL, 'Other', 'both', 'more-horizontal', '#64748B', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. TRANSACTIONS (income, expense, transfer)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category        VARCHAR(255) NOT NULL,
  amount_paise    BIGINT NOT NULL CHECK (amount_paise > 0),
  note            TEXT,
  transaction_date DATE NOT NULL,
  payment_method  VARCHAR(100),
  tags            TEXT[],
  receipt_url     TEXT,
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'yearly')),

  -- For transfers: destination account
  transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Required new indexes
CREATE INDEX IF NOT EXISTS idx_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON transactions(created_at);

-- ============================================================
-- 5. BUDGETS (overall, category-wise, account-wise)
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scope           VARCHAR(20) NOT NULL CHECK (scope IN ('overall', 'category', 'account')),
  category        VARCHAR(255),       -- when scope = 'category'
  account_id      UUID REFERENCES accounts(id) ON DELETE CASCADE,  -- when scope = 'account'
  amount_paise    BIGINT NOT NULL CHECK (amount_paise > 0),
  month           DATE NOT NULL,      -- first day of the budget month (e.g. 2026-04-01)
  
  alert_80_sent   BOOLEAN NOT NULL DEFAULT false,
  alert_90_sent   BOOLEAN NOT NULL DEFAULT false,
  alert_100_sent  BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate budgets for same scope+target+month
  CONSTRAINT unique_budget_overall UNIQUE (user_id, scope, month) 
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- ============================================================
-- 6. SALARY ENTRIES (monthly salary deposits)
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount_paise    BIGINT NOT NULL CHECK (amount_paise > 0),
  month           DATE NOT NULL,      -- first day of the month (e.g. 2026-04-01)
  deposited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate salary for same month
  CONSTRAINT unique_salary_month UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_salary_entries_user_month ON salary_entries(user_id, month);

-- ============================================================
-- 7. NOTIFICATIONS (in-app)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB,              -- extra metadata (e.g., budget_id, account_id)
  is_read         BOOLEAN NOT NULL DEFAULT false,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================
-- 8. EMAIL LOGS (throttling & deduplication)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_type      VARCHAR(50) NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_date ON email_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type ON email_logs(user_id, email_type, sent_at DESC);

-- ============================================================
-- 9. AUDIT LOGS (security trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action          VARCHAR(255) NOT NULL,
  entity_type     VARCHAR(100),       -- 'transaction', 'account', 'budget', etc.
  entity_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      VARCHAR(45),
  user_agent      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['user_profiles', 'accounts', 'transactions', 'budgets'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;
