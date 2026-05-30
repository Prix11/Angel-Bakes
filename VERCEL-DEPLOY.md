# Deploy Angel Bakes on Vercel

## How it works on Vercel

| Part | On Vercel |
|------|-----------|
| Shop pages (`index.html`, `order.html`, CSS, images) | Hosted as static files |
| Order API (`/api/orders`, `/api/admin/login`) | Serverless functions (runs in the cloud) |
| Orders database | **Vercel KV** (required — file storage does not work online) |
| Admin | `https://your-site.vercel.app/admin.html` |

`start-server.bat` is **only for your PC**. Customers use your Vercel URL.

---

## Step 1 — Push code to GitHub

1. Create a repo on [github.com](https://github.com)
2. Upload the **Angel Bakes** folder (or use Git)

---

## Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. **Add New → Project**
3. Import your GitHub repo
4. Framework: **Other** (or leave default)
5. Root directory: project root (where `package.json` is)
6. Deploy once (orders will not save until Step 3)

---

## Step 3 — Add Vercel KV (stores orders)

1. In your Vercel project → **Storage** tab
2. **Create Database → KV**
3. Name it (e.g. `angel-bakes-kv`) and connect to this project
4. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically
5. **Redeploy** the project (Deployments → ⋯ → Redeploy)

---

## Step 4 — Set admin password

1. Project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** a strong password (not `angelbakes`)
3. Apply to **Production** (and Preview if you want)
4. **Redeploy** again

---

## Step 5 — Test

- Shop: `https://your-project.vercel.app`
- Admin: `https://your-project.vercel.app/admin.html`
- Place a test order → check admin page

---

## Optional — Custom domain

Vercel → **Settings → Domains** → add your domain (e.g. `angelbakes.com`)

---

## Local testing with Vercel tools

```bash
npm install -g vercel
cd "Angel Bakes"
vercel dev
```

Link KV to preview env in Vercel dashboard for full API testing locally.

---

## Costs

- Vercel hobby plan: free for small sites
- Vercel KV: free tier includes limited storage (enough for a cookie shop)

---

## Do not commit secrets

- Never put real `ADMIN_PASSWORD` in `config.json` on GitHub
- Use Vercel environment variables for production
