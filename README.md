<div align="center">
  <br />
  <img src="src/assets/logo.svg" alt="CampusBite Logo" width="150" />
  <br />
  
  # CampusBite 🚀
  
  **A Super Digital, Modern, and Stylish Canteen Management System**
  
  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![SQLite](https://img.shields.io/badge/SQLite-Zero_Config-003B57.svg?style=for-the-badge&logo=sqlite)](https://sqlite.org/)

  *Fuel your day, the South Indian way. Order ahead. Skip the line. Eat fresh.*
</div>

---

## 🌟 Overview

CampusBite is a state-of-the-art Canteen Management System built to streamline food ordering in college and corporate cafeterias. With a stunning customer-facing interface, an efficient worker dashboard for order fulfillment, and a powerful admin control panel, it serves everyone from the hungry student to the cafeteria manager.

---

## 🎨 Wireframes & Layout Design

We’ve designed CampusBite with three distinct portals tailored to the users' needs:

### 1. Customer Portal 🛒
**Focus:** Visuals, simplicity, mobile-first design.
```
+----------------------------------------------------+
| [Logo] CampusBite                         [🛒 (2)] |
+----------------------------------------------------+
|                                                    |
|           Fuel your day, the South Indian way.     |
|                   [ Explore Menu ]                 |
|                                                    |
+----------------------------------------------------+
| 🔥 Today's Special                                 |
| [ Paneer Butter Masala Combo ]  [ Badam Milk ]     |
+----------------------------------------------------+
```

### 2. Worker Portal 🧑‍🍳
**Focus:** Speed, queue management, high-contrast states.
```
+----------------------------------------------------+
| [Logo] CampusBite      [Cashier Mode]   [☀️/🌙] [🚪]|
+----------------------------------------------------+
|  [ Pending Orders ]   |  [ Ready for Pickup ]      |
|-----------------------|----------------------------|
| Order #1042           | Order #1039                |
| - 2x Masala Dosa      | - 1x Filter Coffee         |
| [ Confirm Payment ]   | [ Complete Order ]         |
+----------------------------------------------------+
```

### 3. Admin Portal ⚙️
**Focus:** Analytics, inventory management, deep settings.
```
+----------------+-----------------------------------+
| [Logo] Admin   |  Dashboard Overview               |
|----------------|-----------------------------------|
| 📊 Dashboard   |  Total Revenue: ₹12,500           |
| 📦 Orders      |  Active Orders: 14                |
| 🍔 Menu        |                                   |
| 👥 Workers     |  [ Recent Transactions Chart ]    |
| ⚙️ Settings    |                                   |
+----------------+-----------------------------------+
```

---

## 📂 Project Tree Structure

```text
CANTEEN-MANAGEMENT-SYSTEM/
├── backend/                       # FastAPI Backend
│   ├── alembic/                   # Database Migrations
│   ├── app/
│   │   ├── api/                   # API Endpoints (Menu, Orders, Auth)
│   │   ├── core/                  # Security & Config
│   │   ├── models/                # SQLAlchemy ORM Models
│   │   ├── schemas/               # Pydantic Validation Schemas
│   │   └── main.py                # App Entrypoint
│   ├── campusbite.db              # SQLite Database
│   ├── requirements.txt           # Python Dependencies
│   └── seed.py                    # DB Seeder (Users & Categories)
├── src/                           # React + Vite Frontend
│   ├── assets/                    # Static Assets (Logo)
│   ├── components/                # Reusable UI & Layouts
│   │   ├── admin/                 # Admin Dashboard Components
│   │   ├── ui/                    # Shadcn/ui Primitives
│   │   └── worker/                # Worker Dashboard Components
│   ├── contexts/                  # React Context (Auth, Cart)
│   ├── pages/                     # Full Page Views
│   ├── services/                  # API Integration Logic
│   ├── index.css                  # Tailwind Entrypoint
│   └── main.jsx                   # React Entrypoint
├── .env                           # Environment Variables
├── .gitignore                     # Git Ignored Files
├── package.json                   # NPM Dependencies
├── tailwind.config.js             # Tailwind Theme config
└── vite.config.js                 # Vite Bundler config
```

---

## 🚀 Getting Started

### 1. Start the Backend (FastAPI)

Open a terminal and navigate to the `backend/` directory:

```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed users
alembic upgrade head
python seed.py

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The API will be available at `http://localhost:8000/docs`

### 2. Start the Frontend (React + Vite)

Open a new terminal at the root of the project:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
> The web app will be available at `http://localhost:5173`

---

## 🔐 Built-in Roles & Testing

Navigate to the following routes in your browser to test the portals:

- **Customer App:** `http://localhost:5173/`
- **Worker Portal:** `http://localhost:5173/worker`
- **Admin Portal:** `http://localhost:5173/admin`

*Note: Default users (Admin, Cashier, Food Service) are provisioned automatically via `seed.py`.*

---

## 🛠️ Tech Stack & Security
- **Frontend:** React 18, React Router v6, Tailwind CSS, Shadcn UI, Framer Motion. SVG Vector Branding.
- **Backend:** FastAPI, SQLAlchemy, Pydantic, Alembic.
- **Database:** Pure Zero-Configuration SQLite (No MySQL installation required!).
- **Security:** 
  - JWT (JSON Web Tokens) for Stateless Authentication.
  - Role-based Access Control (RBAC) securely verified on the backend.
  - Argon2/Bcrypt password hashing.

---
<div align="center">
  <i>Designed with ♥ for campus cafeterias.</i>
</div>
