# NexaBank — Full-Stack Banking Application

A production-grade banking simulation built with **Next.js 14**, **Node.js/Express**, and **MongoDB**.

---

## 🏗️ Project Structure

```
nexabank/
├── backend/          ← Node.js + Express + MongoDB API
└── frontend/         ← Next.js 14 + TypeScript + Tailwind
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

---

### 1 · Backend Setup

```bash
cd nexabank/backend

# Install dependencies
npm install

# Configure environment (already set for local dev)
# Edit .env if using MongoDB Atlas or a custom port

# Seed the database with demo users & transactions
npm run seed

# Start the API server
npm run dev
# → API running at http://localhost:5000
```

---

### 2 · Frontend Setup

```bash
cd nexabank/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → App running at http://localhost:3000
```

Open **http://localhost:3000** — you'll land on the home page.

---

## 🔑 Demo Credentials

### Admin
| Role  | Email                      | Password     |
|-------|----------------------------|--------------| 
| Admin | admin@nexabanking.com      | Admin1234!   |

### Standard Users
| Name            | Email                      | Password     |
|-----------------|----------------------------|--------------| 
| Jordan Mitchell | jordan@nexabanking.com     | Test1234!    |
| Samantha Lee    | sam@nexabanking.com        | Test1234!    |
| Priya Patel     | priya@nexabanking.com      | Test1234!    |

### High-Net-Worth (HNW) Users — Transfers Blocked, Full Wealth Data
| Name                 | Email                               | Password        | Balance       |
|----------------------|-------------------------------------|-----------------|---------------|
| Robert Chase         | robert_chase224@gmail.com           | robert001#      | $1,430,000    |
| James Whitfield      | james.whitfield@nexabanking.com     | James2024!      | $1,850,000    |
| Victoria Osei-Mensah | victoria.osei@nexabanking.com       | Victoria2024!   | $2,100,000    |
| Daniel Hartmann      | daniel.hartmann@nexabanking.com     | Daniel2024!     | $3,200,000    |
| Sophia Ramirez       | sophia.ramirez@nexabanking.com      | Sophia2024!     | $1,650,000    |
| Nathaniel Bowers     | nathaniel.bowers@nexabanking.com    | Nathaniel2024!  | $2,750,000    |

> **Note:** All HNW accounts have transfers **blocked** by default (pending compliance review). Withdrawals are enabled. Use the admin panel → Controls to manage per-account access.

---

## 📄 Pages

### Public
| Route        | Description                        |
|--------------|------------------------------------|
| `/home`      | Landing page with hero, features   |
| `/about`     | Company story, team, values        |
| `/services`  | All payment methods, limits table  |
| `/contact`   | Contact form                       |
| `/auth/login`     | Sign in                       |
| `/auth/register`  | Create account                |

### Authenticated (user)
| Route           | Description                          |
|-----------------|--------------------------------------|
| `/dashboard`    | Balance card, quick actions, recent txns |
| `/account`      | Full account + card details          |
| `/deposit`      | Deposit via 12+ methods              |
| `/withdraw`     | Withdraw via ACH, wire, crypto, card |
| `/transfer`     | Send money to any NexaBank user      |
| `/history`      | Paginated + filtered transaction history |
| `/profile`      | Edit profile, security, notifications |
| `/receipts/[id]`| View & download PDF receipt          |

### Admin
| Route                    | Description                        |
|--------------------------|------------------------------------|
| `/admin`                 | System-wide stats + recent activity|
| `/admin/users`           | Manage users, adjust balances      |
| `/admin/transactions`    | Approve/reject/fail transactions   |
| `/admin/settings`        | Theme colors, app name, dark mode  |
| `/admin/notifications`   | Broadcast messages to users        |

---

## 💳 Payment Methods

| Method         | Deposit | Withdraw | Fee      |
|----------------|---------|----------|----------|
| Bank Transfer  | ✅      | ✅       | Free     |
| ACH            | ✅      | ✅       | Free     |
| Wire Transfer  | ✅      | ✅       | $15–$25  |
| Debit/Credit Card | ✅   | ✅       | 2.5% / $1.50 |
| Bitcoin (BTC)  | ✅      | ✅       | $2.50–$5 |
| Ethereum (ETH) | ✅      | ✅       | $2.50–$5 |
| USDT           | ✅      | ✅       | $2.50–$5 |
| BNB            | ✅      | ✅       | $2.50–$5 |
| Solana (SOL)   | ✅      | ✅       | $2.50–$5 |
| PayPal         | ✅      | ❌       | Free     |
| Cash App       | ✅      | ❌       | Free     |
| Venmo          | ✅      | ❌       | Free     |
| Zelle          | ✅      | ❌       | Free     |

---

## 🧾 PDF Receipts

Every transaction (deposit, withdrawal, transfer, bill payment) automatically generates a professional PDF receipt using **PDFKit**.

- Receipts are stored at `backend/uploads/receipts/`
- Accessible via `/receipts/[transactionId]` in the frontend
- Direct PDF download via `GET /api/receipts/:id/download`

---

## 🔧 Backend API Reference

### Auth
```
POST   /api/auth/register     → Create account
POST   /api/auth/login        → Sign in → JWT token
GET    /api/auth/me           → Get current user
PATCH  /api/auth/profile      → Update profile
PATCH  /api/auth/password     → Change password
```

### Transactions (requires Bearer token)
```
GET    /api/transactions              → List with filters/pagination
GET    /api/transactions/:id          → Single transaction
POST   /api/transactions/deposit      → Deposit funds
POST   /api/transactions/withdraw     → Withdraw funds
POST   /api/transactions/transfer     → Transfer to another user
POST   /api/transactions/bill-pay     → Pay a bill
```

### User
```
GET    /api/users/dashboard           → Dashboard summary
GET    /api/users/notifications       → User notifications
PATCH  /api/users/notifications/read-all → Mark all read
```

### Receipts
```
GET    /api/receipts/:txId            → Receipt metadata
GET    /api/receipts/:txId/download   → Download PDF
```

### Admin (requires admin role)
```
GET    /api/admin/dashboard           → System stats
GET    /api/admin/users               → All users
GET    /api/admin/users/:id           → User detail + transactions
PATCH  /api/admin/users/:id/toggle-status → Suspend/activate
POST   /api/admin/balance-adjust      → Credit/debit any account
GET    /api/admin/transactions        → All system transactions
PATCH  /api/admin/transactions/:id/status → Change tx status
POST   /api/admin/notifications/send  → Broadcast notification
```

---

## 🛡️ Security Features

- **JWT authentication** with 7-day expiry
- **bcrypt** password hashing (12 rounds)
- **MongoDB ACID transactions** for all money movements
- **Rate limiting** (100 req/15min per IP)
- **Input validation** with express-validator
- **CORS** configured for frontend origin only
- **Balance protection** — can never go negative

---

## 🎨 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS    |
| Backend     | Node.js, Express.js                     |
| Database    | MongoDB + Mongoose                      |
| Auth        | JWT + bcryptjs                          |
| PDF         | PDFKit                                  |
| Fonts       | DM Sans, DM Mono, Syne                  |
| Icons       | Lucide React                            |
