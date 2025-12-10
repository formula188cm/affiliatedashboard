# ⚡ Quick Vercel Fix (5 Minutes)

## The Problem
- ❌ Can't add influencers
- ❌ Can't delete influencers
- ❌ Data not saving

## The Solution
Add **ONE** environment variable to Vercel: `NEXT_PUBLIC_APPS_SCRIPT_URL`

---

## 🚀 3-Step Fix

### Step 1: Get Apps Script URL (2 min)

1. Go to [script.google.com](https://script.google.com)
2. New Project → Paste code from `VERCEL_SETUP.md` (Step 1)
3. Deploy → New deployment → Web app
4. Execute as: **Me**, Access: **Anyone**
5. **Copy the URL** (looks like: `https://script.google.com/macros/s/.../exec`)

### Step 2: Add to Vercel (1 min)

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `NEXT_PUBLIC_APPS_SCRIPT_URL`
   - **Value**: [Paste the URL from Step 1]
   - **Environment**: ✅ Production ✅ Preview ✅ Development
4. **Save**

### Step 3: Redeploy (1 min)

1. **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

---

## ✅ Done!

Now test:
- Add influencer → Should work ✅
- Delete influencer → Should work ✅
- Refresh page → Data persists ✅

---

## 📋 Also Add These (If Not Already Added)

```
NEXT_PUBLIC_ORDER_SITE_URL=https://growessence.vercel.app
NEXT_PUBLIC_SHEET_ID=your_sheet_id
```

---

## 🆘 Still Not Working?

1. Check error message in dashboard - it tells you what's missing
2. Verify Apps Script URL is correct
3. Make sure Apps Script is deployed with "Anyone" access
4. Check Vercel deployment logs

**Full guide**: See `VERCEL_SETUP.md` for detailed instructions.

