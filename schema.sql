CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  default_currency TEXT DEFAULT 'INR',
  theme_preference TEXT DEFAULT 'system',
  onboarding_completed BOOLEAN DEFAULT false,
  monthly_salary_paise BIGINT DEFAULT 0,
  salary_day INTEGER,
  notify_email BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT true,
  notify_budget BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT,
  type TEXT NOT NULL,
  current_balance_paise BIGINT DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  transfer_to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  note TEXT,
  transaction_date DATE NOT NULL,
  payment_method TEXT,
  tags JSONB,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scope TEXT NOT NULL,
  category TEXT,
  account_id UUID,
  amount_paise BIGINT NOT NULL,
  month DATE NOT NULL,
  alert_80_sent BOOLEAN DEFAULT false,
  alert_90_sent BOOLEAN DEFAULT false,
  alert_100_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_unique_idx ON public.budgets(user_id, scope, COALESCE(category, ''), COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid), month);

CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
