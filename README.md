# Angel Bakes

Homemade cookie shop — choco chip & Biscoff. Prices: ₱35/pc, ₱100/3 pcs.

## Run locally

1. Double-click **`start-server.bat`**
2. Shop: http://localhost:8080
3. Admin: http://localhost:8080/admin.html (password in `.env` or `config.json`)

## Go live

See **[DEPLOY.md](./DEPLOY.md)** for GitHub + Render/Railway + Upstash setup.

## Project structure

- `index.html` / `order.html` — customer pages
- `admin.html` — owner order dashboard
- `server.js` — local & cloud server (Render/Railway)
- `api/` — serverless routes (Vercel)
- `lib/` — shared order & auth logic
