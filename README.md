# Inventory Manager — Setup & Deployment Guide

## Tech Stack
- **Next.js 16** (App Router, TypeScript)
- **Neon PostgreSQL** (free tier — 500 MB, cross-device sync)
- **Vercel** (free hosting, deploy from Git)
- **bcryptjs** — password hashing
- **jose** — JWT sessions
- **jsPDF + jspdf-autotable** — PDF export

---

## Step 1: Set Up Neon Database

1. Go to **[neon.tech](https://neon.tech)** and create a free account
2. Create a new project (any name, e.g. "inventory-app")
3. In the **SQL Editor**, paste and run the entire contents of [`db/schema.sql`](./db/schema.sql)
4. Then seed the first restaurant and note its ID:
   ```sql
   INSERT INTO restaurants (name) VALUES ('Your Restaurant Name') RETURNING id;
   ```
   The returned `id` is your `DEFAULT_RESTAURANT_ID` (likely `1`).
5. Copy your **connection string** from the Neon dashboard (Quickstart → Connection string)

---

## Step 2: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgres://...your neon connection string...?sslmode=require
JWT_SECRET=any-random-32-char-string-here
DEFAULT_RESTAURANT_ID=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

---

## Step 3: Run Locally

```bash
# Make sure Node.js is available (already at ~/node-v20.11.1-darwin-arm64/bin/)
export PATH="/Users/vamsikrapa/node-v20.11.1-darwin-arm64/bin:$PATH"

npm install
npm run dev
```

Open **http://localhost:3000** — the first account you create is automatically **Admin**.

---

## Step 4: Deploy to Vercel

### Option A: GitHub (recommended)

1. Push this project to a GitHub repository
2. Go to **[vercel.com](https://vercel.com)** → New Project → Import from GitHub
3. Select your repo — Vercel auto-detects Next.js
4. Add **Environment Variables** in Vercel dashboard (Project Settings → Environment Variables):
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET` — your random secret
   - `DEFAULT_RESTAURANT_ID` — `1`
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npx vercel
# Follow prompts, then add env vars in the Vercel dashboard
```

---

## First Login (Admin Account)

- The **first user to register** automatically gets the `admin` role
- Register at `/signup` — no email needed, just username + password
- Admin can access **Edit Mode** to add categories and items
- All subsequent signups create `user` accounts

---

## How It Works

| Feature | How |
|---|---|
| Sign up | Username + password only, no email |
| Sessions | HTTP-only JWT cookie, 7–day expiry |
| Edit Mode | Admin-only toggle → add/rename/delete categories & items |
| Selections | Per-user, saved to DB → syncs across devices |
| PDF Export | Client-side jsPDF → 4 sections: Get It / Maybe / Not Required / Unselected |
| Multi-restaurant support | Already in DB schema — `restaurants` table is ready |

---

## Adding Node.js to PATH Permanently (Mac)

Add to your `~/.zshrc`:

```bash
export PATH="/Users/vamsikrapa/node-v20.11.1-darwin-arm64/bin:$PATH"
```

Then run `source ~/.zshrc`.
