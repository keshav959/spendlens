# ◈ SpendLens — Personal Expense Tracker

A full-stack personal expense tracking application built with **Spring Boot** + **React.js**.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Spring Security |
| Auth | JWT (JJWT 0.11.5) |
| Database | MySQL 8.x + Spring Data JPA / Hibernate |
| Frontend | React 18, Vite |
| API Testing | Postman |
| Build | Maven (backend), npm (frontend) |

---

## 📁 Project Structure

```
expense-tracker/
├── backend/                         # Spring Boot application
│   ├── pom.xml
│   └── src/main/java/com/expensetracker/
│       ├── ExpenseTrackerApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java        # JWT + CORS security config
│       │   └── GlobalExceptionHandler.java
│       ├── controller/
│       │   ├── AuthController.java        # /api/auth/**
│       │   └── ExpenseController.java     # /api/expenses/**
│       ├── dto/
│       │   └── Dtos.java                  # Request/Response DTOs
│       ├── entity/
│       │   ├── User.java
│       │   └── Expense.java               # Categories enum included
│       ├── repository/
│       │   ├── UserRepository.java
│       │   └── ExpenseRepository.java     # Custom JPQL queries
│       ├── security/
│       │   ├── AuthTokenFilter.java       # JWT filter
│       │   ├── JwtUtils.java              # Token generation/validation
│       │   └── UserDetailsServiceImpl.java
│       └── service/
│           ├── AuthService.java
│           └── ExpenseService.java
│
├── frontend/                        # React + Vite application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx                  # Complete single-file React app
│
└── SpendLens-API.postman_collection.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Java 17+
- MySQL 8.x
- Node.js 18+
- Maven 3.8+

### 1. Database Setup

```sql
CREATE DATABASE expense_tracker;
```

### 2. Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Run Backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: `http://localhost:3000`

---

## 🔌 REST API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |

### Expenses (🔒 JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| GET | `/api/expenses/paginated` | Paginated expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/{id}` | Get by ID |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| GET | `/api/expenses/category/{cat}` | Filter by category |
| GET | `/api/expenses/date-range?start=&end=` | Filter by date |
| GET | `/api/expenses/dashboard` | Dashboard stats |

### Request Headers

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Sample Payloads

**Register:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Create Expense:**
```json
{
  "title": "Grocery Shopping",
  "description": "Weekly groceries",
  "amount": 1250.50,
  "category": "FOOD",
  "expenseDate": "2025-01-15"
}
```

**Categories:** `FOOD`, `TRANSPORT`, `HOUSING`, `ENTERTAINMENT`, `HEALTHCARE`, `SHOPPING`, `EDUCATION`, `UTILITIES`, `TRAVEL`, `OTHER`

---

## 🧪 Postman Testing

1. Import `SpendLens-API.postman_collection.json` into Postman
2. Run **Register** or **Login** — token auto-saves to collection variable
3. All protected endpoints will use the saved token automatically

---

## 🗄 Database Schema

```sql
-- users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME
);

-- expenses table
CREATE TABLE expenses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(10,2) NOT NULL,
  category ENUM('FOOD','TRANSPORT','HOUSING','ENTERTAINMENT','HEALTHCARE','SHOPPING','EDUCATION','UTILITIES','TRAVEL','OTHER'),
  expense_date DATE NOT NULL,
  created_at DATETIME,
  updated_at DATETIME,
  user_id BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

*(Tables are auto-created by Hibernate on first run)*

---

## ✨ Features

- **JWT Authentication** — Secure stateless auth with token refresh
- **Dashboard** — Total, monthly, weekly spending stats
- **Category Breakdown** — Visual bars per category
- **Monthly Trend** — Spending trend chart by month
- **CRUD Expenses** — Add, edit, delete transactions
- **Search & Filter** — By keyword, category, date range
- **Pagination** — Client-side pagination with controls
- **Responsive UI** — Dark theme with polished design

---

## 🔐 Security Features

- Passwords hashed with BCrypt
- JWT stored client-side in localStorage
- All expense endpoints verify user ownership
- CORS configured for `http://localhost:3000`
- Global exception handling with proper HTTP status codes

---

## 📦 Git Setup

```bash
git init
git add .
git commit -m "feat: initial SpendLens expense tracker"
git remote add origin <your-repo-url>
git push -u origin main
```

Recommended `.gitignore` entries:
```
backend/target/
frontend/node_modules/
frontend/dist/
*.env
application-local.properties
```
