# Put March Mammal Madness Online (for your teacher)

This guide gets you a **public URL** like `https://march-mammal-madness.onrender.com` that all 400 students can use from school or home. **Free tier** is enough.

You need:
- A **GitHub** account (free)
- About **30 minutes** one time

---

## Step 1: Put the code on GitHub

1. Create a new repository on [github.com/new](https://github.com/new) (name it `march-mammal-madness`, Private is fine).
2. On your computer, open PowerShell in the project folder:

```powershell
cd C:\Users\andre\march-mammal-madness
git add .
git commit -m "March Mammal Madness bracket app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/march-mammal-madness.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Create a free cloud database (Neon)

SQLite files **do not persist** on most free web hosts. Use **Neon** (free PostgreSQL):

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. **New Project** → name it `mmm-brackets` → Create.
3. On the dashboard, copy the **connection string** (starts with `postgresql://...`).
   - Use the pooled connection if offered (`?sslmode=require` is fine).

Keep this string secret — it is the database password.

---

## Step 3: Deploy the website on Render

1. Go to [render.com](https://render.com) and sign up (free, GitHub login works).
2. **New +** → **Web Service**.
3. Connect your GitHub repo `march-mammal-madness`.
4. Settings:
   - **Name:** `march-mammal-madness` (this becomes part of your URL)
   - **Runtime:** Node
   - **Build Command:** `npm install --omit=dev`
   - **Start Command:** `npm start`
   - **Instance type:** Free
5. **Environment Variables** (click Add):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Paste the Neon connection string from Step 2 |
| `ADMIN_PASSWORD` | Pick a strong password only the teacher knows |

6. Click **Create Web Service**.
7. Wait ~5 minutes for the first deploy. When it says **Live**, open the URL Render gives you (e.g. `https://march-mammal-madness-xxxx.onrender.com`).

**Test:** open `https://YOUR-URL.onrender.com/api/health` — you should see `"storage":"PostgreSQL (cloud)"`.

---

## Step 4: Give your teacher these links

| Who | Link |
|-----|------|
| **Students** | `https://YOUR-URL.onrender.com` |
| **Teacher admin** | `https://YOUR-URL.onrender.com/admin.html` |
| **Leaderboard / PDF** | `https://YOUR-URL.onrender.com/leaderboard.html` |

Share the **admin password** you set as `ADMIN_PASSWORD` privately (not in the group chat).

---

## Free tier notes (Render)

- The site **sleeps after ~15 minutes** with no visitors. The first student to open it may wait **30–60 seconds** while it wakes up. After that it is fast.
- For a big class submitting at once, tell students to open the link **a few minutes before** the deadline so it wakes up.
- Upgrading to Render’s paid plan ($7/mo) removes sleep — optional.

---

## Updating the app later

After you change code locally:

```powershell
git add .
git commit -m "Describe your change"
git push
```

Render redeploys automatically in a few minutes.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build failed on `npm install` | Use build command `npm install --omit=dev`. Push the latest code from this repo (no `better-sqlite3`). |
| Deploy failed on `better-sqlite3` | Remove native SQLite deps; cloud uses Postgres only. Set `DATABASE_URL` on Render. |
| “Actual results not entered” on leaderboard | Teacher must save at least one winner in Admin first. |
| Students can’t connect | Check the URL uses `https://`. School filters sometimes block new domains — ask IT to allow your Render URL. |
| Lost admin password | Render Dashboard → your service → **Environment** → change `ADMIN_PASSWORD` → redeploy. |

---

## Alternative: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Add **PostgreSQL** plugin in the project (Railway provides `DATABASE_URL` automatically).
3. Set `ADMIN_PASSWORD` in Variables.
4. Generate a public domain in **Settings → Networking**.

Same app, same env vars — `DATABASE_URL` + `ADMIN_PASSWORD`.

---

## Using your domain: frogcoo.com

[frogcoo.com](https://frogcoo.com) is a **WordPress** site. The bracket app is a separate **Node.js** program, so it cannot run inside WordPress the way your Unity games are uploaded. The standard approach is a **subdomain** on the same domain:

| Link | Purpose |
|------|---------|
| `https://mmm.frogcoo.com` | Students submit brackets |
| `https://mmm.frogcoo.com/admin.html` | Teacher admin |
| `https://mmm.frogcoo.com/leaderboard.html` | Rankings + PDF |

(`mmm` can be any name you like: `brackets`, `marchmadness`, etc.)

### Step A — Deploy on Render first

Complete Steps 1–3 above so the app works on `https://something.onrender.com`.

### Step B — Add the subdomain in Render

1. Render Dashboard → your web service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** → enter `mmm.frogcoo.com`.
3. Render shows a **CNAME target** (something like `march-mammal-madness-xxxx.onrender.com`). Copy it.

### Step C — Add DNS at your domain registrar

Where you bought/manage **frogcoo.com** (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.):

| Type | Name / Host | Value / Points to |
|------|-------------|-------------------|
| **CNAME** | `mmm` | The Render CNAME target from Step B |

Save DNS. It can take **5 minutes to 48 hours** to propagate (often under an hour).

### Step D — Verify

1. In Render, wait until the custom domain shows **Verified** with a green check.
2. Open `https://mmm.frogcoo.com/api/health` — should return `"ok":true`.
3. Render provides a free SSL certificate automatically.

### Step E — Link from WordPress (optional)

On frogcoo.com, add a WordPress **Page** or menu item:

- **Title:** March Mammal Madness Brackets  
- **Link:** `https://mmm.frogcoo.com`

Students can find it from your main site; the bracket app still runs on the subdomain.

### Do not move the whole domain to Render

Pointing **frogcoo.com** (the root domain) at Render would **break your WordPress site**. Only add a **subdomain** (`mmm.frogcoo.com`), not the apex `frogcoo.com`.
