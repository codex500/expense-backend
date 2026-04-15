# Expense Tracker API

Production-ready Node.js backend for an Expense Tracker web application. Built with Express, PostgreSQL (Supabase), JWT auth, and MVC architecture.

## Tech Stack

- **Node.js** + **Express.js**
- **PostgreSQL** (Supabase)
- **JWT** authentication, **bcrypt** password hashing
- **dotenv**, **pg** (node-postgres), **uuid**
- **MVC** (models, controllers, routes, middleware, utils)

---

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (e.g. [Supabase](https://supabase.com))
- npm or yarn

---

## 1. Install Dependencies

```bash
cd expense-backend
npm install
```

This installs: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `uuid`, `node-cron`, `resend`.

---

## 2. Database Setup

1. Create a project and database on [Supabase](https://supabase.com) (or use your existing one).
2. Go to **Settings → Database** and copy the connection string (URI format).
3. Run the schema in the Supabase SQL Editor (or with `psql`):

```bash
# Option A: In Supabase dashboard → SQL Editor, paste and run contents of:
# database/schema.sql

# Option B: Using psql (if you have it)
psql "postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres" -f database/schema.sql
```

---

## 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:

- **DATABASE_URL** – Your Supabase PostgreSQL connection string (from Settings → Database).
- **JWT_SECRET** – A long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- **PORT** (optional) – Default is `5000`.

---

## 4. Run Locally

**Production mode (single run):**
```bash
npm start
```

**Development mode (with auto-restart on file changes):**
```bash
npm run dev
```

Server runs at **http://localhost:5000**.  
- Health: **GET** `http://localhost:5000/health`  
- API base: **http://localhost:5000/api**

---

## 5. Deploy on Render

### Step 1: Prepare the repo

- Push the project to GitHub (or GitLab/Bitbucket).
- Ensure `package.json` has `"main": "server.js"` and `"start": "node server.js"` (already set).

### Step 2: Create Web Service on Render

1. Go to [Render](https://render.com) → **Dashboard** → **New** → **Web Service**.
2. Connect your repo and select the **expense tracker** repository.
3. Configure:
   - **Name:** `expense-tracker-api` (or any name).
   - **Region:** Choose closest to your users.
   - **Runtime:** **Node**.
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free or paid.

### Step 3: Environment variables on Render

In the service → **Environment** tab, add:

| Key            | Value |
|----------------|--------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `JWT_SECRET`   | Strong random secret (e.g. 32+ char hex) |
| `NODE_ENV`     | `production` |
| `PORT`         | Leave empty (Render sets it automatically) |
| `EMAIL_ENABLED`   | `true` to enable welcome + reminder emails (optional, default: off) |
| `RESEND_API_KEY`  | Resend API key from https://resend.com (required if EMAIL_ENABLED=true) |
| `MAIL_FROM`       | Sender address, e.g. `Trackify <onboarding@resend.dev>` (use verified domain in Resend) |

Save. Render will redeploy if needed.

### Step 4: Deploy

- Click **Create Web Service**. Render will build and start the app.
- After deploy, the API URL will be like: `https://expense-tracker-api-xxxx.onrender.com`
- Use **GET** `https://your-app.onrender.com/health` to verify.

### Notes for Render

- **Free tier:** Service may sleep after inactivity; first request can be slow.
- **Supabase:** Use the **pooled** connection string (Transaction mode) for best performance.
- Keep **JWT_SECRET** and **DATABASE_URL** only in Render env vars, never in the repo.

---

## 6. Email Reminder Jobs (Optional)

Automated reminder emails use **node-cron** and **Resend** (API, no SMTP – works on Render).

### Behavior

- **Hourly (every hour at :00):** Users with no transaction in the last 24h get a reminder.
- **Evening (20:00–21:00):** Every 6 minutes, up to 10 users with no transaction today get an evening reminder.
- No duplicate emails to the same user within the same hour.

### Enable in production

1. Set `EMAIL_ENABLED=true` in Render environment variables.
2. Set `RESEND_API_KEY` (from [resend.com](https://resend.com) – no SMTP ports, uses HTTPS).
3. Set `MAIL_FROM` (use a verified domain in Resend, or `Trackify <onboarding@resend.dev>` for testing).

### Test locally

```bash
# 1. Add to .env:
EMAIL_ENABLED=true
RESEND_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM=Trackify <onboarding@resend.dev>

# 2. Run server
npm start

# 3. Manually trigger jobs (add to a test script or run in node REPL):
const { runHourlyReminder, runEveningReminder } = require('./jobs/reminderJobs');
runHourlyReminder();  // or runEveningReminder();
```

Or temporarily change the cron schedule in `jobs/reminderJobs.js` (e.g. `'* * * * *'` for every minute) to see it run, then revert.

---

## Project Structure

```
config/         – database pool, env validation
controllers/    – auth, transactions, dashboard, budget, analytics, categories
jobs/           – reminderJobs.js (node-cron hourly + evening emails)
middleware/     – JWT auth, error handler
routes/         – API route definitions
models/         – User, Transaction, Category
utils/          – validation helpers, mailer.js (Resend API)
database/       – schema.sql
docs/           – API_ENDPOINTS.md, POSTMAN_EXAMPLES.md
server.js       – app entry point
```

---

## API Overview

- **Auth:** Register, Login, Get current user (`/api/auth/*`).
- **Transactions:** CRUD + list with filters (type, category, date) (`/api/transactions/*`).
- **Dashboard:** Balance, income, expense, monthly/today income & expense (`/api/dashboard`).
- **Budget:** Set monthly budget, get status with 80% warning (`/api/budget/*`).
- **Analytics:** Category expense/income, monthly spending/income, summary, last 7 days (`/api/analytics/*`).
- **Categories:** CRUD for user categories (`/api/categories/*`).

See **docs/API_ENDPOINTS.md** for the full list and **docs/POSTMAN_EXAMPLES.md** for request examples.

---

## License

ISC
