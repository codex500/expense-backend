# Render deployment – environment variables and Postman

## 1. Environment variables in Render

In **Render Dashboard** → your **Web Service** → **Environment**, add:

| Key | Value | Required |
|-----|--------|----------|
| `DATABASE_URL` | Supabase **Postgres** connection string. From Supabase: **Settings → Database → Connection string** (URI). Must look like `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` | Yes |
| `JWT_SECRET` | Long random string (e.g. 32+ chars). Same value everywhere (Render + local). | Yes |
| `NODE_ENV` | `production` | Recommended |
| `PORT` | Leave **empty** – Render sets it. | No |
| `CORS_ORIGIN` | Your frontend URL, e.g. `https://your-app.vercel.app`. Leave empty to allow any origin. | Optional |
| `JWT_EXPIRY` | e.g. `7d` | Optional |

**Important**

- `DATABASE_URL` must be the **Postgres** connection string (starts with `postgresql://`), not the Supabase REST/API URL (`https://...supabase.co/rest/...`).
- Use the **pooled** connection string from Supabase (Transaction mode) for best performance.
- Do not use quotes or `psql` in the value.

---

## 2. Postman test instructions

**Base URL:** `https://YOUR-RENDER-SERVICE.onrender.com`  
Replace with your actual Render URL (e.g. `https://expense-tracker-xxxx.onrender.com`).

### 2.1 Health

- **Method:** GET  
- **URL:** `{{BASE_URL}}/health`  
- **Headers:** none  
- Expected: `{ "status": "ok", "timestamp": "..." }`

### 2.2 Register

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/auth/register`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "monthly_budget": 2000
}
```
- Save `data.token` from the response for the next requests.

### 2.3 Login

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/auth/login`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- Save `data.token` from the response.

### 2.4 Protected route (e.g. Get current user)

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/auth/me`  
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN`  
  Replace `YOUR_TOKEN` with the token from login/register.

### 2.5 Transactions

- **Add transaction:** POST `{{BASE_URL}}/api/transactions`  
  Headers: `Content-Type: application/json`, `Authorization: Bearer YOUR_TOKEN`  
  Body:
```json
{
  "type": "expense",
  "amount": 50,
  "category": "Food",
  "payment_method": "Card",
  "note": "Lunch",
  "transaction_date": "2025-02-15"
}
```

- **List transactions:** GET `{{BASE_URL}}/api/transactions`  
  Headers: `Authorization: Bearer YOUR_TOKEN`

### 2.6 Dashboard

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/dashboard`  
- **Headers:** `Authorization: Bearer YOUR_TOKEN`

---

## 3. Common issues

| Issue | Cause | Fix |
|--------|--------|-----|
| 404 on `/api/auth/login` | Wrong base URL or path | Use `https://YOUR-APP.onrender.com/api/auth/login` (with `/api`). |
| CORS error | Frontend origin not allowed | Set `CORS_ORIGIN` to your frontend URL, or leave empty to allow any. |
| 401 Invalid token | Wrong/missing header or expired token | Use header `Authorization: Bearer <token>`; re-login if expired. |
| 502 Bad Gateway | App crash or not listening on PORT | Check Render logs; ensure `PORT` is not set in env (Render sets it). |
| Database connection failed | Wrong `DATABASE_URL` or REST URL | Use Postgres connection string from Supabase (Settings → Database), not REST API URL. |

---

## 4. Postman environment (optional)

1. New Environment → name it e.g. `Expense Tracker Render`.
2. Add variable `BASE_URL` = `https://YOUR-RENDER-SERVICE.onrender.com`.
3. Add variable `TOKEN` = (paste token after login).
4. In requests use `{{BASE_URL}}` and `Authorization: Bearer {{TOKEN}}`.
