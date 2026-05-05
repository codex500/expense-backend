-- ============================================================
-- Trackify v3 Migration
-- Adds: user_settings table, passkeys table
-- ============================================================

-- 1. USER SETTINGS (separate from user_profiles)
CREATE TABLE IF NOT EXISTS user_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications  BOOLEAN NOT NULL DEFAULT true,
  dark_mode           BOOLEAN NOT NULL DEFAULT false,
  currency            TEXT NOT NULL DEFAULT 'INR',
  language            TEXT NOT NULL DEFAULT 'en',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS set_updated_at ON user_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. PASSKEYS (WebAuthn / 2FA)
CREATE TABLE IF NOT EXISTS passkeys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  credential_id   TEXT NOT NULL UNIQUE,
  public_key      TEXT NOT NULL,
  counter         BIGINT NOT NULL DEFAULT 0,
  device_name     TEXT,
  transports      TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);
