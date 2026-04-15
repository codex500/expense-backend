# Expense Tracker API Documentation

> **Base URL**: `http://localhost:5000/api`
> All monetary calculations represent integers in minimum viable division. E.g., `₹500.25` is encoded as `50025`.

All protected routes expect a JWT token in the header:
`Authorization: Bearer <token>`

Standard Response Wrapper Envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ...response_data }
}
```

---

## 🔒 1. Authentication (`/api/auth`)

### Signup
**POST** `/auth/signup`
- **Body**: 
  ```json
  { "email": "user@test.com", "password": "Password123!", "fullName": "John Doe" }
  ```
- **Response**: `{ "id": "uuid", "email": "user@test.com", "fullName": "John Doe", "emailVerified": false }`

### Login
**POST** `/auth/login`
- **Body**: `{ "email": "user@test.com", "password": "Password123!" }`
- **Response**: 
  ```json
  {
    "user": { "id": "uuid", "email": "user@test.com", "fullName": "John Doe", "emailVerified": true },
    "session": { "accessToken": "jwt_token...", "refreshToken": "refresh_token...", "expiresAt": 1718223 },
    "onboardingCompleted": true,
    "salaryPendingForMonth": false
  }
  ```

### Complete Onboarding (Protected)
**POST** `/auth/onboarding`
- **Body**:
  ```json
  {
    "defaultCurrency": "INR",
    "account": {
        "accountName": "HDFC Bank",
        "type": "bank_account",
        "initialBalancePaise": 5000000 
    },
    "monthlySalaryPaise": 5000000,
    "monthlyBudgetPaise": 4000000
  }
  ```

### Verify Session (Protected)
**GET** `/auth/session`
- **Response**: `{ "id": "uuid", "email": "user@test.com", "fullName": "John Doe", "defaultCurrency": "INR", "accountCount": 2, "onboardingCompleted": true }`

### Logout (Protected)
**POST** `/auth/logout`

### Forgot Password
**POST** `/auth/forgot-password`
- **Body**: `{ "email": "user@test.com" }`

### Reset Password (Protected via temporary token)
**POST** `/auth/reset-password`
- **Body**: `{ "password": "NewPassword123!" }`

---

## 👤 2. Users & Preferences (`/api/users`)

### Get Profile
**GET** `/users/profile`
- **Response**: `{ "id": "uuid", "fullName": "John Doe", "themePreference": "dark", "accountCount": 2, "totalBalancePaise": 1500000, "createdAt": "..." }`

### Update Profile
**PUT** `/users/profile`
- **Body**: `{ "fullName": "John Smith", "phone": "9876543210" }`

### Update Preferences
**PUT** `/users/preferences`
- **Body**: `{ "defaultCurrency": "USD", "themePreference": "light", "notifyBudget": false }`

### Change Password
**POST** `/users/change-password`
- **Body**: `{ "currentPassword": "old!", "newPassword": "new!" }`

### Delete Account (Cascades Everything)
**DELETE** `/users/account`

---

## 🏦 3. Accounts & Wallets (`/api/accounts`)

Valid Types: `cash`, `upi`, `bank_account`, `credit_card`, `wallet`

### Create Account
**POST** `/accounts`
- **Body**: `{ "accountName": "SBI Saving", "type": "bank_account", "initialBalancePaise": 100000, "icon": "bank", "color": "#ff0000", "isDefault": true }`

### Get All Accounts
**GET** `/accounts`
- **Response**: `[ { "id": "uuid", "accountName": "SBI Saving", "currentBalancePaise": 100000, "type": "bank_account" } ]`

### Account Summary
**GET** `/accounts/summary`
- **Response**: `{ "totalAccounts": 3, "totalBalancePaise": 2500000, "byType": { "cash": 50000, "bank_account": 2450000, "upi": 0, "credit_card": 0 } }`

### Money Transfer
*(Atomically deducts from source, adds to destination. Rolls back on failures).*
**POST** `/accounts/transfer`
- **Body**: `{ "fromAccountId": "uuid_1", "toAccountId": "uuid_2", "amountPaise": 50000, "note": "Paying back", "date": "2026-04-15" }`

---

## 💸 4. Transactions (`/api/transactions`)

### Create Transaction
**POST** `/transactions`
- **Body**: 
  ```json
  {
    "accountId": "uuid",
    "type": "expense",
    "category": "Food",
    "amountPaise": 25000,
    "transactionDate": "2026-04-15",
    "note": "Lunch at McDonald's"
  }
  ```

### Get Paginated & Filtered Transactions
**GET** `/transactions?page=1&limit=20&type=expense&category=Food&sortBy=amount_paise&sortOrder=desc`
- **Response**: `{ "transactions": [ ... ], "meta": { "total": 45, "totalPages": 3, "hasNext": true } }`

### Get Single
**GET** `/transactions/:id`

### Update Transaction (Atomically reverses & recalculates balance)
**PUT** `/transactions/:id`
- **Body**: `{ "amountPaise": 26000 }`

### Delete Transaction (Restores Balance)
**DELETE** `/transactions/:id`

---

## 🎯 5. Budgets (`/api/budgets`)

### Create Budget
**POST** `/budgets`
- **Body**: `{ "scope": "category", "category": "Food", "amountPaise": 500000, "month": "2026-04-01" }`
- *(Note: month MUST ALWAYS be the 1st of the month)*

### Get Current Status
**GET** `/budgets/current`
- **Response**:
  ```json
  [
    {
      "scope": "category", "category": "Food",
      "amountPaise": 500000, "spentPaise": 450000,
      "percentUsed": 90, "status": "critical",
      "alert90Sent": true
    }
  ]
  ```

---

## 💰 6. Salary (`/api/salary`)

### Check Monthly Status
*(Checks if the user has deposited a salary this month)*
**GET** `/salary/check`
- **Response**: `{ "deposited": false, "defaultSalaryPaise": 8000000, "defaultAccountId": "uuid" }`

### Deposit Salary
*(Creates income transaction, updates balance, inserts log)*
**POST** `/salary/deposit`
- **Body**: `{ "accountId": "uuid", "amountPaise": 8000000, "month": "2026-04-01" }`

### Get History
**GET** `/salary/history`
- **Response**: `[ { "month": "2026-04-01", "amountPaise": 8000000, "accountName": "HDFC" } ]`

---

## 📊 7. Analytics (`/api/analytics`)

### Main Dashboard Summary
**GET** `/analytics/dashboard`
- **Response**: `{ "currentMonth": { "incomePaise": 1000, "expensePaise": 500, "savingsPaise": 500 }, "trends": { "expenseChange": -15 } }`

### Expense by Category 
**GET** `/analytics/expense-by-category?startDate=...&endDate=...`

### Expense by Account Use
**GET** `/analytics/expense-by-account`

### Payment Method Overview
**GET** `/analytics/payment-methods`

### Monthly / Weekly Graphs
**GET** `/analytics/monthly?months=6`
**GET** `/analytics/weekly`

### Spending Trend
**GET** `/analytics/spending-trend`

---

## 🤖 8. Advisor (`/api/advisor`)

### Generate Insights
**GET** `/advisor/insights`
- **Response**: 
  ```json
  {
    "insights": ["Great job! You've spent 15% less than last month."],
    "warnings": ["You spent 25% of your expenses on Shopping this month."],
    "suggestions": ["Set up a monthly budget to track your expenses more effectively."]
  }
  ```

---

## 🔔 9. Notifications (`/api/notifications`)

### Get In-App Notifications
**GET** `/notifications?page=1&limit=50`
- **Response**: `{ "notifications": [...], "unreadCount": 3 }`

### Mark Single as Read
**PUT** `/notifications/:id/read`

### Mark All as Read
**PUT** `/notifications/read-all`
