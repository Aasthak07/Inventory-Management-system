# Inventory Management System

Welcome to the **Inventory Management System**, a recruiter-ready project featuring a **FastAPI backend (Python)**, a modern **Next.js frontend (React + Tailwind CSS)**, and a **PostgreSQL** relational database.

This project implements essential business validations, database-level uniqueness constraints, and transaction-safe stock operations with automatic rollback capabilities. It features a premium, responsive **minimalist SaaS-like light theme user interface** styled entirely with Tailwind CSS utility classes and powered by Axios.

---

## UI/UX Design System & Aesthetics
Following modern SaaS design principles, we avoided heavy gradients and dark neon overlays in favor of a clean, minimal design:
- **Visual Palette**: Neutral slate backgrounds (`#f8fafc` slate-50), white card panels, subtle border borders (`border-slate-200`), and dark slate branding.
- **Inter Typography**: Modern typography configured via Google Fonts.
- **KPI Metrics Widgets**: 4 premium real-time telemetry panels (SKU Catalog, Active Customers, Processed Orders, Grand Valuation).
- **Responsive Navigation**: An off-white fixed sidebar (`w-64`) with smooth transitions and active indicators.
- **Interactive Checkout Desk**: A dynamic checkout cart enabling administrators to select customer profiles, add dynamic product lines, specify quantities, view live subtotal cost valuations, and see visual stock availability checks.

---

## How to Run the Application Locally

We support two ways of running this application:

### Method 1: The Docker Compose Way (Zero Setup - Recommended)
This launches a PostgreSQL database container, the FastAPI backend, and the Next.js frontend, connecting them automatically.

1. **Prerequisite**: Ensure you have **Docker** and **Docker Compose** installed.
2. **Launch Services**: In the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. **Access App**:
   - **Next.js Web Dashboard**: Open [http://localhost:3000](http://localhost:3000)
   - **Interactive Backend API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Database Port**: PostgreSQL binds to local port `5432` with username `postgres` and password `postgrespassword`.

---

### Method 2: The Direct Local Way (With SQLite Auto-Fallback)
To make local testing effortless, the backend automatically detects if PostgreSQL variables are provided. If running locally without Docker, **it falls back to a local SQLite database (`inventory.db`)**. You do not need to install PostgreSQL locally to run this method!

#### Step A: Boot the Backend API
1. **Navigate to the Backend Directory**:
   Open a terminal in the project root and navigate to the backend folder:
   ```bash
   cd "backend"
   ```
2. **Create a Virtual Environment** (Recommended sandbox):
   ```bash
   python -m venv venv
   ```
3. **Activate the Virtual Environment**:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Mac/Linux:
     ```bash
     source venv/bin/activate
     ```
4. **Install Required Packages**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Start the FastAPI Backend Server**:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *(The server will start on `http://127.0.0.1:8000` and automatically create the SQLite database `inventory.db` in your backend folder).*

#### Step B: Boot the Next.js Frontend
1. Open a terminal in the `./frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at [http://localhost:3000](http://localhost:3000).

---

## Step-by-Step Technical Design

### 1. Database Schema & Tables (`backend/app/models.py`)
We modeled our schema using SQLAlchemy ORM classes to match standard production assignments:
- **`products`**:
  - `id` (Integer, Primary Key)
  - `name` (String, Required)
  - `sku` (String, Unique & Indexed)
  - `description` (Text, Nullable)
  - `price` (Numeric, Required)
  - `stock_quantity` (Integer, Default 0)
  - `created_at` (DateTime, Default Utcnow)
- **`customers`**:
  - `id` (Integer, Primary Key)
  - `name` (String, Required)
  - `email` (String, Unique & Indexed)
  - `phone` (String, Nullable)
  - `created_at` (DateTime, Default Utcnow)
- **`orders`**:
  - `id` (Integer, Primary Key)
  - `customer_id` (ForeignKey)
  - `total_amount` (Numeric, Default 0.0)
  - `created_at` (DateTime, Default Utcnow)
- **`order_items`**:
  - `id` (Integer, Primary Key)
  - `order_id` (ForeignKey)
  - `product_id` (ForeignKey)
  - `quantity` (Integer, Required)
  - `price` (Numeric, Required) — *Locks in purchase price to preserve historical financial records.*

### 2. Transaction-Safe Order Placement (`backend/app/crud.py`)
To prevent stock inconsistencies and race conditions under concurrent checkouts, order processing follows a strict transactional flow:
1. **Verify Customer**: Confirms the purchasing client exists.
2. **Lock Rows**: Uses SQLAlchemy `.with_for_update()` to lock candidate product records.
3. **Verify Stock**: Rejects order instantly if `product.stock_quantity < item.quantity`.
4. **Deduct Stock**: Automatically subtracts stock levels: `product.stock_quantity -= item.quantity`.
5. **Create Logs**: Inserts `OrderItem` records locking in current price and increments `total_amount`.
6. **Safe Transactions**: Commits changes. If *any* step fails (e.g., database constraint or out-of-stock), **`db.rollback()`** is triggered, returning inventory levels to their original values.

---

## Automated Business Rule Verification Script
We built an automated diagnostic script at `backend/verify_rules.py` to assert constraints. You can run it locally:
```bash
python backend/verify_rules.py
```

### Script Execution Log Output:
```text
============================================================
INVENTORY & ORDER MANAGEMENT SYSTEM - BUSINESS RULES VERIFICATION
============================================================

[Step 1] Initializing fresh database tables...
[OK] Tables reset successfully.

[Step 2] Testing Product SKU Uniqueness Constraint...
[OK] Created product 'Apple iPhone 15 Pro' with SKU 'IPHONE-15' and Stock = 10.
[OK] Prevented duplicate SKU. Exception caught: Product with SKU 'iphone-15' already exists.

[Step 3] Testing Customer Email Uniqueness Constraint...
[OK] Registered customer 'Alice Smith' with Email 'alice@example.com'.
[OK] Prevented duplicate Email. Exception caught: Customer with email 'alice@example.com' already exists.

[Step 4] Testing Standard Order Placement & Stock Reduction...
[OK] Order #ORD-1 processed for Alice.
  Order Total: $2999.97
  Remaining 'Apple iPhone 15 Pro' Stock in Database: 7 (Expected: 7)

[Step 5] Testing Insufficient Stock Validation & Transaction Rollback...
[OK] Order placement rejected. Exception caught: Insufficient stock for product 'Apple iPhone 15 Pro' (SKU: IPHONE-15). Available: 7, Requested: 8.
  Confirming 'Apple iPhone 15 Pro' Stock count: 7 (Expected: 7)
[OK] Transaction atomicity confirmed! Stock was rolled back safely.

============================================================
ALL BUSINESS RULE VALIDATIONS PASSED SUCCESSFULY!
============================================================
```

---

## Production Cloud Deployment Guides

This project is fully ready for zero-downtime production builds:

### Backend Deployment (Render.com)
1. **New Web Service**: Connect your GitHub repository to Render and choose "FastAPI/Web Service".
2. **Environment**: Specify `Python` or use the `Dockerfile`.
3. **Environment Variables**:
   - `DATABASE_URL`: Add your external PostgreSQL connection string.
4. **Build & Start Commands**:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel)
1. **Import Project**: Select the `./frontend` folder from your repository on Vercel.
2. **Framework Preset**: Choose **Next.js**.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Add your deployed Render backend URL (e.g., `https://your-backend.onrender.com`).
4. **Deploy**: Click **Deploy** and Next.js will build an optimized static site matching Vercel's Edge network.
