# The Bro's Feast - Monorepo Structure

This project has been separated into clean, independent **Frontend** and **Backend** directories.

## Project Structure

```
bros/
├── frontend/               # Vite + Tailwind CSS Web Application
│   ├── src/                # Frontend Javascript & CSS modules
│   ├── index.html          # Main customer storefront
│   ├── admin.html          # Real-time Admin Dashboard
│   ├── login.html          # Authentication pages
│   ├── register.html
│   ├── forgot-password.html
│   ├── reservation.html
│   ├── package.json
│   └── .env                # Local VITE_API_URL
│
├── backend/                # Node.js + Express + Socket.IO + SQLite/PostgreSQL
│   ├── server.js           # API entry point & WebSockets
│   ├── db.js               # Database connection (Sequelize)
│   ├── routes/             # API Endpoints (Auth, Menu, Orders, Reservations)
│   ├── models/             # Database Models
│   ├── package.json
│   └── .env                # PORT, JWT_SECRET, DATABASE_URL
│
├── package.json            # Root runner (starts both frontend & backend concurrently)
└── README.md
```

---

## 🚀 Running Locally

From the root directory:

```bash
# Start both Backend and Frontend concurrently
npm run dev
```

Or run them individually in separate terminals:

```bash
# Run Backend API (http://localhost:3000)
npm run dev:backend

# Run Frontend App (http://localhost:5173)
npm run dev:frontend
```

---

## 🌐 Online Deployment Instructions

### 1. Deploying the Backend (Render / Railway / Fly.io)

1. Connect your repository to **Render** (or Railway).
2. Choose **Web Service** and set root directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Set Environment Variables on Render:
   - `PORT`: `3000` (or leave default assigned by host)
   - `JWT_SECRET`: `your_secure_secret_key`
   - `DATABASE_URL` (optional): PostgreSQL connection string if using external PostgreSQL.
6. Copy your live backend URL (e.g., `https://bros-backend.onrender.com`).

### 2. Deploying the Frontend (Vercel / Netlify)

1. Connect your repository to **Vercel** (or Netlify).
2. Choose framework: **Vite**
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Set Environment Variable on Vercel:
   - `VITE_API_URL`: `https://bros-backend.onrender.com` (Your backend URL from step 1).
7. Deploy!
