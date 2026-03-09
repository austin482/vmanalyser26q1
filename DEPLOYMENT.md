# Deployment Guide — Serverless Version

## Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New Project**.
3. Import your GitHub repository.
4. Open the **Settings > Environment Variables** section before deploying.
5. Add all the keys from your `.env.local` file:
   - `VITE_LARK_APP_ID`
   - `VITE_LARK_APP_SECRET`
   - `VITE_OPENROUTER_API_KEY`
   - `LARK_CHAT_ID`
   - `LARK_OKR_TABLE_ID` (your OKR table ID)
6. Click **Deploy**.

---

## Step 2: Push to GitHub

```bash
cd "/Users/austinyikning/Downloads/MKT VM 5"
git add .
git commit -m "chore: refactor to serverless (Vercel)"
git push
```

> **Note:** `.env.local` and `austina.db` are in `.gitignore` — they will NOT be pushed. ✅

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects Vite — just click **Deploy**

### Add Environment Variables in Vercel Dashboard:
Go to **Settings → Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_LARK_APP_ID` | `cli_a9d1efc6a2381ed4` |
| `VITE_LARK_APP_SECRET` | `wWL8cXBdwk2895DpQFNzBgSgrkT1kujN` |
| `OPENROUTER_API_KEY` | `sk-or-v1-ecf92ef...` |
| `VITE_OPENROUTER_API_KEY` | `sk-or-v1-ecf92ef...` |
| `LARK_CHAT_ID` | `oc_2b0eW1tXe8S6MbK4uQyWscyFVancWZtV` |
| `LARK_OKR_TABLE_ID` | *(your OKR table ID from Step 1)* |

---

## Step 4: Update Lark Automation Button

In your Lark Base automation, change the webhook URL from:
```
http://localhost:3001/api/lark/webhook
```
To your new Vercel URL:
```
https://your-app.vercel.app/api/lark/webhook
```

---

## ✅ Done! You Never Need to Run a Server Again

- App lives at: `https://your-app.vercel.app`
- Scoring triggers from the Lark button → Vercel wakes up → scores → writes back
- OKRs managed in the UI → saved to Lark Base
