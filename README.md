# Food Delivery App — CraveBite 🍕

A full-stack food delivery application built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

## 🚀 Live Demo
> _Hosted link will be added after deployment_

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend (User) | React 19, Vite, Tailwind CSS, Zustand, Socket.IO Client |
| Frontend (Admin) | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, MongoDB, Mongoose, Socket.IO |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Real-time | Socket.IO (order status updates + driver tracking) |
| Maps | Leaflet + OpenStreetMap |
| Testing | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |

---

## 🏗️ Project Structure

```
FOOD DELIVERY APP/
├── backend/              # Express REST API
│   ├── controllers/      # Route handlers
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── middleware/        # Auth middleware
│   └── tests/            # Jest + Supertest tests
│       ├── order.test.js
│       └── product.test.js
├── frontend-user/        # Customer-facing React app
│   └── src/
│       ├── pages/        # Menu, Cart, Tracker, Profile
│       ├── components/   # Navbar, AuthModal, etc.
│       ├── store/        # Zustand state management
│       └── tests/        # Vitest + RTL tests
│           ├── Cart.test.jsx
│           └── Menu.test.jsx
└── frontend-admin/       # Admin dashboard React app
    └── src/
        └── pages/        # Orders, Menu Mgmt, Analytics
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/Chintujha72100/food-delivery-app.git
cd food-delivery-app
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

### 3. Frontend (User)
```bash
cd frontend-user
npm install
npm run dev
```

### 4. Frontend (Admin)
```bash
cd frontend-admin
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the `/backend` directory:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/cravebite
JWT_SECRET=your_jwt_secret_here
```

---

## 🧪 Running Tests

### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
```
**Coverage:** 29 tests across order CRUD, input validation, auth guards, status transitions, and cashback logic.

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend-user
npm test
```
**Coverage:** 31 tests across Cart rendering, quantity controls, checkout validation, Menu filtering, API calls, and loading states.

---

## ✨ Features

### User App
- 🍔 **Menu Display** — Food items with name, description, price, image, ratings
- 🛒 **Cart** — Add/remove items, quantity controls, coupon codes
- 📍 **Checkout** — Delivery address + phone number, GPS auto-fill, Pickup/Delivery toggle
- 📦 **Order Tracking** — Real-time status (Order Received → Preparing → Out for Delivery → Delivered)
- 🗺️ **Live Map** — Leaflet map showing restaurant, delivery address, and driver location
- 🔔 **Real-Time Updates** — Socket.IO auto-updates order status without page refresh

### Admin App
- 📊 **Dashboard** — Sales analytics and charts
- 🍕 **Menu Management** — Add/edit/delete products
- 📋 **Order Management** — View all orders, update status
- 👥 **User Management** — View all users
- 🎟️ **Discounts** — Coupon code management

### Backend
- 🔒 **Security** — Helmet, rate limiting, XSS protection, NoSQL injection prevention
- 🔄 **Auto-Simulation** — Order status auto-advances after placement (New → Cooking → Out for Delivery → Completed)
- 💳 **Wallet** — 5% cashback credited on order completion
- 📡 **Socket.IO** — Real-time events for status updates and driver location

---

## 📡 API Endpoints

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/orders` | Place a new order | User |
| GET | `/api/orders/myorders` | Get current user's orders | User |
| GET | `/api/orders` | Get all orders | Admin |
| PATCH | `/api/orders/:id/status` | Update order status | Admin |

### Products (Menu)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/products` | Get all menu items | Public |
| POST | `/api/products` | Create menu item | Admin |
| PUT | `/api/products/:id` | Update menu item | Admin |
| DELETE | `/api/products/:id` | Delete menu item | Admin |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

---

## 🎬 Loom Walkthrough
> _Video link will be added_

---

## 📝 License
MIT
