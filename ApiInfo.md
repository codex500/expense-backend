# Trackify Backend — API Reference

> **Base URL:** `https://api.trackifyapp.space` (production) | `http://localhost:5000` (local)  
> **Prefix:** All API routes use `/api` prefix  
> **Auth:** 🔒 = Requires `Authorization: Bearer <token>` header

---

## 🏥 System Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Health check — returns `"OK"` |
| `GET` | `/` | ❌ | API info — returns version and metadata |

---

## 🔐 Authentication — `/api/auth`

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| `POST` | `/api/auth/signup` | ❌ | `authLimiter` | Register new user |
| `POST` | `/api/auth/login` | ❌ | `authLimiter` | Login with email + password |
| `POST` | `/api/auth/forgot-password` | ❌ | `emailLimiter` | Send password reset email |
| `POST` | `/api/auth/reset-password` | ❌ | — | Reset password with token |
| `POST` | `/api/auth/verify-otp` | ❌ | `authLimiter` | Verify email OTP code |
| `POST` | `/api/auth/resend-otp` | ❌ | `emailLimiter` | Resend verification OTP |
| `GET` | `/api/auth/oauth/:provider` | ❌ | — | Get OAuth URL (Google, etc.) |
| `POST` | `/api/auth/logout` | 🔒 | — | Logout current session |
| `GET` | `/api/auth/session` | 🔒 | — | Get current session info |
| `POST` | `/api/auth/onboarding` | 🔒 | — | Complete user onboarding |
| `PUT` | `/api/auth/profile` | 🔒 | — | Update user profile |
| `DELETE` | `/api/auth/account` | 🔒 | — | Delete user account permanently |

### Request Bodies

**POST `/api/auth/signup`**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**POST `/api/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST `/api/auth/forgot-password`**
```json
{
  "email": "user@example.com"
}
```

**POST `/api/auth/reset-password`**
```json
{
  "accessToken": "<token_from_reset_email>",
  "newPassword": "newSecurePassword123"
}
```

---

## 👤 Users — `/api/users`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/profile` | Get user profile |
| `PUT` | `/api/users/profile` | Update user profile |
| `PUT` | `/api/users/preferences` | Update notification/theme preferences |
| `POST` | `/api/users/change-password` | Change password |
| `DELETE` | `/api/users/account` | Delete account |

---

## 🏦 Accounts — `/api/accounts`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounts` | Create new account |
| `GET` | `/api/accounts` | List all accounts |
| `GET` | `/api/accounts/summary` | Get accounts summary (total balance) |
| `GET` | `/api/accounts/:id` | Get single account by ID |
| `PUT` | `/api/accounts/:id` | Update account |
| `DELETE` | `/api/accounts/:id` | Delete account |
| `POST` | `/api/accounts/transfer` | Transfer money between accounts |

### Request Bodies

**POST `/api/accounts`**
```json
{
  "accountName": "HDFC Savings",
  "accountType": "bank_account",
  "initialBalancePaise": 5000000
}
```

**POST `/api/accounts/transfer`**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amountPaise": 100000,
  "note": "Rent transfer"
}
```

---

## 💳 Transactions — `/api/transactions`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transactions` | Create transaction |
| `GET` | `/api/transactions` | List transactions (paginated) |
| `GET` | `/api/transactions/export/pdf` | Export transactions as PDF |
| `GET` | `/api/transactions/:id` | Get single transaction |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |

### Query Parameters for `GET /api/transactions`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |
| `type` | string | — | Filter: `income`, `expense`, `transfer` |
| `category` | string | — | Filter by category |
| `accountId` | string | — | Filter by account |
| `startDate` | string | — | Filter from date (YYYY-MM-DD) |
| `endDate` | string | — | Filter to date (YYYY-MM-DD) |

### Request Body

**POST `/api/transactions`**
```json
{
  "accountId": "uuid",
  "type": "expense",
  "category": "Food",
  "amountPaise": 25000,
  "transactionDate": "2026-05-05",
  "note": "Lunch at cafe"
}
```

---

## 📊 Budgets — `/api/budgets`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/budgets` | Create budget |
| `GET` | `/api/budgets/current` | Get current month budgets |
| `PUT` | `/api/budgets/:id` | Update budget |
| `DELETE` | `/api/budgets/:id` | Delete budget |

---

## 💰 Salary — `/api/salary`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/salary/check` | Check if current month salary is deposited |
| `POST` | `/api/salary/deposit` | Deposit monthly salary |
| `GET` | `/api/salary/history` | Get salary deposit history |

### Request Body

**POST `/api/salary/deposit`**
```json
{
  "accountId": "uuid",
  "amountPaise": 5000000,
  "month": "2026-05-01"
}
```

---

## 📈 Analytics — `/api/analytics`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/dashboard` | Dashboard analytics overview |
| `GET` | `/api/analytics/expense-by-category` | Expenses grouped by category |
| `GET` | `/api/analytics/expense-by-account` | Expenses grouped by account |
| `GET` | `/api/analytics/monthly` | Monthly income/expense graph |
| `GET` | `/api/analytics/weekly` | Weekly spending graph |
| `GET` | `/api/analytics/payment-methods` | Payment method usage breakdown |
| `GET` | `/api/analytics/six-month` | 6-month comparison data |
| `GET` | `/api/analytics/spending-trend` | Spending trend analysis |

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string | Start date filter (YYYY-MM-DD) |
| `endDate` | string | End date filter (YYYY-MM-DD) |
| `months` | number | Number of months (for `/monthly`, default: 6) |

---

## 🧠 AI Advisor — `/api/advisor`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/advisor/insights` | AI-powered financial insights, warnings & suggestions |

---

## 🔔 Notifications — `/api/notifications`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | List user notifications (paginated) |
| `PUT` | `/api/notifications/:id/read` | Mark single notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read |

---

## 📊 Dashboard — `/api/dashboard`

> All routes require authentication 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/summary` | Unified dashboard data (balance, income, expense, recent txns, weekly chart) |

---

## 📬 Contact — `/api/contact`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/contact` | ❌ | Submit contact/support request |

### Request Body

**POST `/api/contact`**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Bug Report",
  "message": "I found an issue with the dashboard..."
}
```

---

## 🛡️ Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| `400` | `BAD_REQUEST` | Invalid request data |
| `401` | `UNAUTHORIZED` | Missing/invalid auth token |
| `401` | `INVALID_TOKEN` | Malformed JWT |
| `401` | `TOKEN_EXPIRED` | JWT has expired |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `DUPLICATE_ENTRY` | Record already exists |
| `422` | `VALIDATION_ERROR` | Zod validation failed |
| `429` | — | Rate limit exceeded |
| `500` | — | Internal server error |
| `503` | `REQUEST_TIMEOUT` | Request timed out (30s limit) |

---

## 📋 Route Summary

| Module | Total Routes |
|--------|-------------|
| System | 2 |
| Auth | 12 |
| Users | 5 |
| Accounts | 7 |
| Transactions | 6 |
| Budgets | 4 |
| Salary | 3 |
| Analytics | 8 |
| Advisor | 1 |
| Notifications | 3 |
| Dashboard | 1 |
| Contact | 1 |
| **Total** | **53** |

---

*Generated: May 5, 2026 — Trackify API v2.0.1*
