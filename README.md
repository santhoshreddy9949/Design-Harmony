# Design & Harmony ERP - Business & Billing Management System

Design & Harmony ERP is a modern, production-ready full-stack Enterprise Resource Planning (ERP) and GST-compliant Billing Management System tailored for an Interior Design and Furniture Business.

---

## Technical Architecture

* **Frontend**: React.js, Vite, Tailwind CSS, React Router, Recharts (analytics graphs), and jsPDF (for local PDF tax invoice generations).
* **Backend**: Node.js, Express.js, JWT Authentication (bcryptjs secure password hashing), and Multer for local design blueprint uploads.
* **Database**: Supabase PostgreSQL. Features a local JSON persistent file fallback in `backend/data/` for offline/development testing.

---

## Folder Structure

```
DESIGN/
├── database/
│   └── schema.sql                # PostgreSQL Database Schema
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # DB Connection & JSON Database fallback
│   │   │   └── auth.js           # JWT verification & hashing utilities
│   │   ├── controllers/          # Controllers (auth, customer, project, etc.)
│   │   ├── routes/               # Express Routes
│   │   ├── middleware/           # Auth and file upload middleware
│   │   └── index.js              # Express Entrypoint
│   ├── data/                     # Seeded JSON database files
│   ├── uploads/                  # Uploaded designs and invoices
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/           # Reusable UI (Sidebar, Navbar, etc.)
    │   ├── context/              # React Auth Context & API fetch helper
    │   ├── pages/                # ERP Page Views (Dashboard, Customers, etc.)
    │   ├── index.css             # Tailwind setup & Custom CSS variables
    │   └── main.tsx
    ├── package.json
    └── tailwind.config.js
```

---

## Local Development Guide

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Database Setup
To initialize a PostgreSQL database, execute the script located in [schema.sql](file:///c:/Users/ullis/OneDrive/Documents/Desktop/DESIGN/database/schema.sql) in your database console or client tool (e.g. DBeaver, pgAdmin, or Supabase SQL Editor).

### 2. Backend Installation & Setup
1. Open a terminal and navigate to `backend/`.
2. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   JWT_SECRET=design_and_harmony_secret_key_2026
   DATABASE_URL=your_postgresql_database_url (Optional - falls back to persistent JSON database)
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```
   *The server will start on port `5000` and seed mock data automatically.*

### 3. Frontend Installation & Setup
1. Open a new terminal and navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (typically `http://localhost:5173`) in your browser.

---

## Credentials for Testing

Use the credentials below to test different roles and see customized layouts:

| Email | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| `admin@harmony.com` | `Password123` | Admin | Full Access |
| `designer@harmony.com` | `Password123` | Designer | Manage Projects & Client requirements |
| `sales@harmony.com` | `Password123` | Sales Executive | Quotation proposals, Orders, Customers |
| `inventory@harmony.com` | `Password123` | Inventory Manager | Adjust Stock levels, Suppliers catalog |
| `accountant@harmony.com` | `Password123` | Accountant | Issue Tax Invoices, Register Payments, Salary |

---

## Production Deployment Guide

### Backend (Render / Heroku)
1. Push the repository to GitHub.
2. Link your repository to a new **Web Service** on Render.
3. Configure the Root Directory as `backend`.
4. Set the Start Command: `npm start`.
5. Set Environment Variables:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = your_secure_key
   * `DATABASE_URL` = your_live_postgresql_connection_string

### Frontend (Vercel / Netlify)
1. Link your repository to Vercel.
2. Select the `frontend` folder as the project root.
3. Configure build settings:
   * Build Command: `npm run build`
   * Output Directory: `dist`
4. Deploy. Vercel will build and serve the application statically.
