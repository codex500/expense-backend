-- Trackify - Database migrations for new features
-- Run this in Neon SQL Editor or via psql

-- 1. Email logs table (for tracking daily emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, sent_date)
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_date ON email_logs(user_id, sent_date);

-- 2. User streaks table (gamification)
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- 3. Add budget_limit column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'budget_limit'
  ) THEN
    ALTER TABLE users ADD COLUMN budget_limit DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;
