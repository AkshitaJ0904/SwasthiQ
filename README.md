# SwasthiQ Pharmacy CRM

> Full-stack Pharmacy Module built for the SwasthiQ SDE Intern Assignment

A production-grade Pharmacy Management System with real-time inventory tracking, sales management, and purchase order workflows.

---

## 🏗 Architecture

```
swasthiq/
├── backend/              # Python FastAPI REST API
│   ├── main.py           # App entrypoint + CORS
│   ├── database.py       # SQLAlchemy engine + session
│   ├── seed.py           # Seed data
│   ├── models/           # SQLAlchemy ORM models
│   │   └── models.py     # Medicine, Sale, SaleItem, PurchaseOrder
│   ├── schemas/          # Pydantic request/response models
│   │   └── schemas.py
│   ├── routers/          # FastAPI route handlers
│   │   ├── dashboard.py  # Dashboard metrics
│   │   ├── medicines.py  # CRUD for medicines
│   │   ├── sales.py      # Sales management
│   │   └── purchase_orders.py
│   └── requirements.txt
│
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx       # Root with router
│   │   ├── main.jsx      # Entry point
│   │   ├── context/      # PharmacyContext (global state)
│   │   ├── services/     # Axios API layer (api.js)
│   │   ├── components/   # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── MedicineModal.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx   # Sales + Inventory tabs
│   │       └── Inventory.jsx   # Full inventory management
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 📡 API Contracts

### Base URL: `http://localhost:8000/api/v1`

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Today's sales, items sold, low stock count, PO summary |
| GET | `/dashboard/inventory-overview` | Total items, active, low stock, total value |
| GET | `/dashboard/recent-sales?limit=10` | Recent sale transactions |
| GET | `/dashboard/low-stock` | List of low/out-of-stock items |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medicines?page=1&size=20&search=&status=&category=&supplier=` | Paginated + filtered list |
| GET | `/medicines/all` | All medicines (for dropdowns) |
| GET | `/medicines/{id}` | Single medicine |
| POST | `/medicines` | Add new medicine |
| PUT | `/medicines/{id}` | Full update |
| PATCH | `/medicines/{id}/status` | Mark expired / out of stock |
| DELETE | `/medicines/{id}` | Delete medicine |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sales?limit=50` | List all sales |
| POST | `/sales` | Create new sale (auto-deducts inventory) |
| GET | `/sales/{id}` | Sale details |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders?status=PENDING` | List POs |
| POST | `/purchase-orders` | Create PO |
| PATCH | `/purchase-orders/{id}/status?status=APPROVED` | Update PO status |

---

## 🔄 Data Consistency

1. **Medicine status** is computed dynamically at query time (not stored):
   - `OUT_OF_STOCK`: quantity === 0
   - `EXPIRED`: expiry_date < today
   - `LOW_STOCK`: quantity < 20
   - `ACTIVE`: otherwise

2. **Sale creation** uses a DB transaction:
   - Validates stock availability before deduction
   - Rolls back if any item fails

3. **Predicted Low Stock** = `quantity / 5` (assumes daily consumption of 5 units)

4. **Expiring Soon** flag = medicines with expiry within 60 days

---

## 🚀 Installation & Running

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Clone repo
git clone <your-repo-url>
cd swasthiq

# Create virtual environment
cd backend
python -m venv venv

# Activate venv
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Seed database
python seed.py

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/docs**

### Frontend Setup

```bash
# New terminal
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🌐 Deployment

### Backend → Render.com

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python seed.py`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add env var: `DATABASE_URL=sqlite:///./pharmacy.db`
5. Deploy!

### Frontend → Vercel/Netlify

**Vercel:**
```bash
cd frontend
npm run build
npx vercel --prod
```

**Netlify:**
```bash
npm run build
# Upload the `dist/` folder to Netlify
```

Set env var: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

---

## 🌱 Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./pharmacy.db
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

---

## ✨ Features

- 📊 Real-time dashboard with sales metrics
- 💊 Full medicine CRUD with validation
- 🔍 Fuzzy search by name + generic name
- 📦 Purchase order management
- 🧾 Sale creation with automatic inventory deduction
- 🏷️ Dynamic status badges (Active, Low Stock, Expired, Out of Stock)
- ⚠️ Highlight medicines expiring in <60 days
- 📈 Predicted days to low stock (linear estimate)
- 🔎 Filter by status, category, supplier
- 📄 Pagination
- 🔔 Toast notifications
- ⏳ Loading skeleton states
