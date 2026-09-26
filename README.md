# 🌸 Angales Beauty Supplies — Enterprise Multi-Branch IMS

> **Production-Hardened Multi-Branch Inventory Management & POS System**  
> Tailored for Ghana's luxury beauty, cosmetics, hair, skincare, and salon retail enterprise.

---

## 🛡️ Enterprise Security & Data Protection Architecture

1. **Cryptographic Password Salting & Hashing**
   - Implemented via Node.js native `crypto.scrypt` with a unique 16-byte random salt per user.
   - All comparisons use `crypto.timingSafeEqual` to defeat side-channel and timing attacks.
   - Zero hardcoded fallback credentials or demo bypasses.

2. **Signed Token Authentication (HS256)**
   - Cryptographically signed bearer session tokens containing user identity, role, and branch authorizations.
   - Auto-verified on every API route with token expiration.

3. **Role-Based Access Control (RBAC)**
   - Strict server-side and client-side guards across 5 distinct operational roles:
     - 👑 **Super Admin**: Full company-wide authority, all branches, system settings, personnel management, audit trails.
     - 🏢 **Branch Manager**: Full operational access within assigned branch (sales, inventory, staff, transfers, local expenses).
     - 📦 **Inventory Officer**: Product catalog, batch FEFO expiry tracking, stock transfers, purchase orders, physical stocktaking.
     - 💳 **Sales Cashier**: Streamlined Point of Sale (POS) terminal, barcode scanner lookup, customer directory, invoice ledger.
     - 📊 **Accountant**: Financial statements, revenue analytics, operational expense tracking, immutable audit trails.

4. **Brute-Force & Denial-of-Service Protection**
   - In-memory rate limiting on authentication routes (maximum 5 failed attempts per IP per 15-minute window).
   - Strict body size limits (`10mb`) to prevent memory exhaustion attacks.

5. **Defense-in-Depth HTTP Security Headers**
   - `Content-Security-Policy`: Restricts scripts and styles to self and verified Google Fonts.
   - `X-Frame-Options: DENY`: Prevents clickjacking attacks.
   - `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing.
   - `X-XSS-Protection: 1; mode=block`: Cross-site scripting filter.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - Technology fingerprinting removed (`X-Powered-By` header stripped).

6. **Immutable Audit Trails**
   - Every login event, failed attempt, price change, stock movement, and administrative adjustment is permanently logged with IP address and timestamp.

---

## 🚀 Quick Start & Production Commands

### 1. Installation & Environment Configuration
```bash
# Verify environment secrets (.env file)
npm install
npm run build
```

### 2. Clean Production Database Initialization
To reset the system to a clean, production-ready baseline (clears all dummy test transactions and provisions clean categories and Super Admin):
```bash
npm run init:prod
```

### 3. Running the Production Server
```bash
npm start
```
*The Express server serves both the high-speed REST API and the optimized SPA frontend on port `5000` (or `process.env.PORT`).*

---

## 🔑 Initial Production Super Admin Credentials

| Field | Production Value |
| :--- | :--- |
| **Email** | `admin@angales.com` |
| **Initial Password** | `Admin@Angales2026!` |
| **Role** | `Super Admin (Full HQ Access)` |
| **Primary Branch** | `ACC-HQ (Angales Beauty Supplies - Accra Flagship)` |

> ⚠️ **Post-Deployment Requirement**: Sign in and navigate to **Staff Personnel** or change the initial password via the API to your private corporate passphrase.

---

## 📂 Project Structure

```text
├── .env                       # Production environment secrets
├── .env.example               # Template environment configuration
├── package.json               # Root scripts & dependencies
├── server/
│   ├── index.js               # Production HTTP server with security headers & SPA fallback
│   ├── middleware/
│   │   ├── auth.js            # Token verification & RBAC authorization guards
│   │   └── security.js        # Security headers & login brute-force rate limiter
│   ├── utils/
│   │   └── crypto.js          # Salted scrypt hashing, HS256 tokens, AES-256-GCM encryption
│   ├── db/
│   │   ├── database.js        # SQLite connection with WAL mode & foreign keys enabled
│   │   ├── schema.sql         # Enterprise relational schema (27 tables + indexes)
│   │   └── init-prod.js       # Clean production initialization script (zero dummy data)
│   └── routes/                # REST endpoints with RBAC protection
└── client/
    ├── index.html             # HTML entry point with responsive viewport
    ├── vite.config.js         # Client bundler configuration with API proxy
    └── src/
        ├── App.jsx            # Main app router with session listener & RBAC guards
        ├── components/        # Reusable UI components (Navbar, Sidebar)
        └── views/             # Operational screens (LoginView, UsersView, PosView, etc.)
```
