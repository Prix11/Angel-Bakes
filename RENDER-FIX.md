# Render not deploying? — Fix guide

## Correct Render settings

Open your service → **Settings** and confirm:

| Setting | Must be |
|---------|---------|
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Auto-Deploy** | Yes |

---

## Deploy step by step

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click your **angel-bakes** service
3. **Settings** → **Build & Deploy** → confirm **Branch** is `main`
4. Click **Manual Deploy** → **Deploy latest commit**
5. Open **Logs** tab and watch for errors
6. Wait until status is **Live** (green) — can take 3–8 minutes

---

## If you see "Deploy will start after current deploy completes"

- **Wait** — only one deploy runs at a time
- Do **not** click Deploy many times
- Check **Events** tab for progress

---

## If deploy fails (red X)

Click **Logs** and look for:

### `Build failed`
- Usually `npm install` problem
- Fix: latest code on GitHub already includes fixes — redeploy

### `Timed out` or health check failed
- Was caused by slow Upstash check — **now fixed** in latest code
- Redeploy **latest commit**

### `Port scan timeout`
- Start command must be: `npm start`
- Not `node server.js` alone (either works, but use `npm start`)

---

## Environment variables (required)

In **Environment** tab:

```
ADMIN_PASSWORD=your-password
KV_REST_API_URL=https://prepared-snapper-38746.upstash.io
KV_REST_API_TOKEN=your-upstash-token
```

Click **Save** → **Manual Deploy** again after changing these.

---

## Connect GitHub (if not connected)

1. **Settings** → **Build & Deploy**
2. **Connect repository** → choose **Prix11/Angel-Bakes**
3. Branch: **main**
4. Save → Deploy

---

## Test after Live

- Site: https://angel-bakes.onrender.com
- Health: https://angel-bakes.onrender.com/api/health  
  Should show: `{"ok":true,...}`
- Database: https://angel-bakes.onrender.com/api/health/db  
  Should show: `"database":"connected"`

---

## Still stuck?

In Render **Logs**, copy the **last 10 lines** of the failed deploy and share them — that shows the exact error.
