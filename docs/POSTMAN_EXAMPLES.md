# Postman Testing Examples

Use these in Postman (or any REST client). Replace `BASE_URL` with `http://localhost:5000` and `TOKEN` with the JWT from login/register.

---

## 1. Register

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/auth/register`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "monthly_budget": 2000
}
```

---

## 2. Login

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/auth/login`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
Copy `data.token` from the response for the next requests.

---

## 3. Get current user

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/auth/me`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

---

## 4. Add transaction

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/transactions`  
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{TOKEN}}`  
- **Body (raw JSON):**
```json
{
  "type": "expense",
  "amount": 45.50,
  "category": "Food",
  "payment_method": "Card",
  "note": "Lunch",
  "transaction_date": "2025-02-15"
}
```

---

## 5. Get all transactions (with filters)

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/transactions?type=expense&startDate=2025-02-01&endDate=2025-02-28`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

---

## 6. Dashboard

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/dashboard`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

---

## 7. Set budget & get status

- **Method:** PUT  
- **URL:** `{{BASE_URL}}/api/budget`  
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{TOKEN}}`  
- **Body:** `{ "monthly_budget": 2000 }`

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/budget/status`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

---

## 8. Analytics

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/analytics/category-expense`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/analytics/monthly-spending?months=6`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

- **Method:** GET  
- **URL:** `{{BASE_URL}}/api/analytics/last-7-days`  
- **Headers:** `Authorization: Bearer {{TOKEN}}`

---

## 9. Create category

- **Method:** POST  
- **URL:** `{{BASE_URL}}/api/categories`  
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{TOKEN}}`  
- **Body:** `{ "name": "Groceries", "type": "expense" }`

---

## Postman environment (optional)

Create an environment with:

- `BASE_URL` = `http://localhost:5000`  
- `TOKEN` = (paste after login)

Then use `{{BASE_URL}}` and `{{TOKEN}}` in requests.
