# Deployment Guide

## Prerequisites

- A [Turso](https://turso.tech) account (free tier works)
- A [Render](https://render.com) account (free tier works)
- Git installed locally

---

## Step 1 — Create a Turso Database

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Log in and create a database:
   ```bash
   turso auth login
   turso db create ecom-test-tracker
   ```

3. Get your credentials:
   ```bash
   # Get the database URL
   turso db show ecom-test-tracker --url

   # Create an auth token
   turso db tokens create ecom-test-tracker
   ```

4. Save both values — you'll need them in Step 3.

---

## Step 2 — Push Your Code to GitHub

1. Create a new GitHub repository (public or private).

2. In this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

---

## Step 3 — Deploy to Render

### Option A — Using the Dashboard (recommended)

1. Go to [render.com](https://render.com) and sign in.

2. Click **New → Web Service**.

3. Connect your GitHub account and select your repository.

4. Render will detect `render.yaml` automatically. Confirm the settings:
   - **Build Command:** `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
   - **Start Command:** `node server/index.js`
   - **Environment:** Node

5. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `TURSO_URL` | The URL from Step 1 (e.g. `libsql://ecom-test-tracker-xxx.turso.io`) |
   | `TURSO_TOKEN` | The auth token from Step 1 |

6. Click **Create Web Service**.

7. Render will build and deploy. This takes ~2–3 minutes on first deploy.

### Option B — Using render.yaml (Blueprint)

1. Go to [render.com/blueprints](https://render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select your repository.
4. Fill in the `TURSO_URL` and `TURSO_TOKEN` environment variables when prompted.
5. Click **Apply**.

---

## Step 4 — Verify

Once deployed, Render gives you a URL like `https://ecom-test-tracker.onrender.com`.

Open it in your browser — the app should load and the database tables are created automatically on first start.

---

## Running Locally

1. Copy the example env file:
   ```bash
   cp .env.example server/.env
   ```

2. Edit `server/.env` with your Turso credentials.

3. Install dependencies and start both servers:
   ```bash
   # Terminal 1 — backend
   npm install --prefix server
   npm run dev --prefix server

   # Terminal 2 — frontend
   npm install --prefix client
   npm run dev --prefix client
   ```

4. Open `http://localhost:5173` in your browser.

---

## Notes

- The free Render plan spins down after 15 minutes of inactivity. First request after idle may take ~30 seconds to cold-start.
- Turso free tier allows up to 500 databases and 1 GB storage — more than enough for this app.
- All database tables are created automatically on server start — no manual migrations needed.
