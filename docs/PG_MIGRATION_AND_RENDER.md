# pg driver – migration summary & Render setup

## What changed

- **Removed:** `@neondatabase/serverless` (was causing "Unexpected server response: 404" on Render).
- **Using:** `pg` (node-postgres) with a single `Pool`, SSL, and `process.env.DATABASE_URL`.

## Render environment variables

Set these in **Render Dashboard → Your Web Service → Environment**:

| Key | Value | Required |
|-----|--------|----------|
| `DATABASE_URL` | Neon **Postgres** connection string, e.g. `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require` | Yes |
| `JWT_SECRET` | Long random string (e.g. 32+ chars) | Yes |
| `NODE_ENV` | `production` | Recommended |
| `PORT` | Leave **empty** (Render sets it) | No |
| `CORS_ORIGIN` | Your frontend URL, or leave empty to allow any | No |

**Important:** `DATABASE_URL` must be the **Connection string** from Neon (starts with `postgresql://`), not the REST/API URL.

## SQL schema (for Neon)

Run in **Neon SQL Editor** or via `npm run db:setup` (with same `DATABASE_URL` in `.env`). Contents of `database/schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  monthly_budget DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(255) NOT NULL,
  payment_method VARCHAR(100),
  note TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
```

## Quick Postman checks (deployed URL)

- **Base URL:** `https://YOUR-SERVICE.onrender.com`
- **POST** `/api/auth/register` – Body: `{"name":"Test","email":"test@example.com","password":"password123"}`
- **POST** `/api/auth/login` – Body: `{"email":"test@example.com","password":"password123"}` → copy `data.token`
- **GET** `/api/transactions` – Header: `Authorization: Bearer <token>`
