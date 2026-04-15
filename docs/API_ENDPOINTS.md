# Expense Tracker API - Endpoint List

Base URL (local): `http://localhost:5000/api`  
All protected routes require header: `Authorization: Bearer <token>`

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns user + token |
| GET | `/api/auth/me` | Yes | Get current user |

**Register body:** `{ "name", "email", "password", "monthly_budget" (optional) }`  
**Login body:** `{ "email", "password" }`

---

## Transactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/transactions` | Yes | Add transaction |
| GET | `/api/transactions` | Yes | List (optional: ?type=&category=&startDate=&endDate=) |
| GET | `/api/transactions/:id` | Yes | Get one transaction |
| PUT | `/api/transactions/:id` | Yes | Update transaction |
| DELETE | `/api/transactions/:id` | Yes | Delete transaction |

**Add/Edit body:** `{ "type", "amount", "category", "payment_method", "note", "transaction_date" }`  
**Query filters:** `type=income|expense`, `category=`, `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`

---

## Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Total balance, income, expense, monthly income/expense, today's income/expense |

---

## Budget

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/budget` | Yes | Set monthly budget |
| GET | `/api/budget/status` | Yes | Budget, monthly expense, % used, 80% warning |

**Set budget body:** `{ "monthly_budget": number }`

---

## Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/category-expense` | Yes | Category-wise expense (pie chart). Optional: ?startDate=&endDate= |
| GET | `/api/analytics/category-income` | Yes | Category-wise income (pie chart). Optional: ?startDate=&endDate= |
| GET | `/api/analytics/monthly-spending` | Yes | Monthly spending (graph). Optional: ?months=12 |
| GET | `/api/analytics/monthly-income` | Yes | Monthly income (graph). Optional: ?months=12 |
| GET | `/api/analytics/monthly-summary` | Yes | Income + expense per month. Optional: ?months=12 |
| GET | `/api/analytics/last-7-days` | Yes | Last 7 days spending + income per day |
| GET | `/api/analytics/weekly` | Yes | Weekly spending/income with highest/lowest day analysis |

---

## Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/categories` | Yes | Create category |
| GET | `/api/categories` | Yes | List (optional: ?type=income|expense) |
| GET | `/api/categories/:id` | Yes | Get one category |
| PUT | `/api/categories/:id` | Yes | Update category |
| DELETE | `/api/categories/:id` | Yes | Delete category |

**Category body:** `{ "name", "type": "income" | "expense" }`

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check (for Render) |

---

## Response format

- Success: `{ "success": true, "message"?, "data"?: { ... } }`
- Error: `{ "success": false, "message": "..." }`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Server Error
