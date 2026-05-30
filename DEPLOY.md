# Go live — GitHub + Render or Railway

Orders must be stored in **Upstash Redis** (free). The `orders.json` file only works on your PC and is erased on cloud redeploys.

---

## Part 1 — Free database (Upstash) — 5 minutes

Do this once. Works with **Render**, **Railway**, and **Vercel**.

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. **Create Database** → name `angel-bakes` → region near you → **Create**
3. Open the database → **REST API** tab
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. You will paste these into your host as:
   - `KV_REST_API_URL` = the URL
   - `KV_REST_API_TOKEN` = the token

---

## Part 2 — GitHub

### A. Create empty repo on GitHub

1. [github.com/new](https://github.com/new)
2. Name: `angel-bakes` (or any name)
3. **Do not** add README (you already have files)
4. Create repository

### B. Push from your PC

Open PowerShell in the **Angel Bakes** folder:

```powershell
cd "C:\Users\Administrator\Documents\Angel Bakes"
git init
git add .
git commit -m "Angel Bakes shop with orders and admin"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/angel-bakes.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Part 3 — Deploy on Render (recommended, free tier)

1. [dashboard.render.com](https://dashboard.render.com) → sign up (GitHub login is easiest)
2. **New +** → **Blueprint** → connect repo **or** **Web Service** → connect repo
3. If using **Web Service** manually:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. **Environment variables** (required):

   | Key | Value |
   |-----|--------|
   | `ADMIN_PASSWORD` | Your secret owner password |
   | `KV_REST_API_URL` | From Upstash REST API |
   | `KV_REST_API_TOKEN` | From Upstash REST API |

5. **Create Web Service** → wait for deploy (~2–5 min)
6. Your shop URL: `https://angel-bakes-xxxx.onrender.com`
7. Admin: `https://angel-bakes-xxxx.onrender.com/admin.html`

**Note:** Free Render apps sleep after ~15 min idle. First visit may take 30–60 seconds to wake up.

### Or use Blueprint

1. **New +** → **Blueprint**
2. Connect this repo (includes `render.yaml`)
3. Set the 3 environment variables when prompted
4. Apply

---

## Part 4 — Deploy on Railway (alternative)

1. [railway.app](https://railway.app) → sign up with GitHub
2. **New Project** → **Deploy from GitHub repo** → select `angel-bakes`
3. Railway detects Node and runs `npm start` (see `railway.toml`)
4. **Variables** tab → add:

   | Key | Value |
   |-----|--------|
   | `ADMIN_PASSWORD` | Your secret password |
   | `KV_REST_API_URL` | From Upstash |
   | `KV_REST_API_TOKEN` | From Upstash |

5. **Settings** → **Networking** → **Generate Domain**
6. Open your URL → shop works; admin at `/admin.html`

---

## Part 5 — Custom domain (optional)

**Render:** Service → **Settings** → **Custom Domains** → add domain → follow DNS instructions.

**Railway:** Service → **Settings** → **Domains** → add custom domain.

---

## Checklist after deploy

- [ ] Open shop URL → home page loads
- [ ] Place test order on **Order** page
- [ ] Open **admin.html** → login with `ADMIN_PASSWORD`
- [ ] Test order appears in admin

---

## Local vs live

| | Local (`start-server.bat`) | Live (Render/Railway) |
|--|---------------------------|------------------------|
| URL | `localhost:8080` | `https://….onrender.com` |
| Orders | `data/orders.json` OR Upstash if env vars set | Upstash only |
| Server | Your PC must run | Always on (Render free sleeps) |

---

## Vercel

See **VERCEL-DEPLOY.md** if you prefer Vercel instead (uses Vercel KV instead of Upstash).

---

## Security

- Never commit real passwords to GitHub
- Use a strong `ADMIN_PASSWORD`
- `config.json` on your PC is for local use only
