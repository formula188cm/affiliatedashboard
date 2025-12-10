# Vercel Environment Variables Setup

## Required Environment Variables for Production

Add these in your Vercel Dashboard → Project Settings → Environment Variables:

### 1. NEXT_PUBLIC_ORDER_SITE_URL (Required)
```
NEXT_PUBLIC_ORDER_SITE_URL=https://growessence.vercel.app
```
**Purpose**: Sets the ordering website URL for referral links

### 2. NEXT_PUBLIC_SHEET_ID (Required)
```
NEXT_PUBLIC_SHEET_ID=your_google_sheet_id_here
```
**Purpose**: Google Sheet ID for fetching orders
**How to get**: From your Google Sheet URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

### 3. NEXT_PUBLIC_APPS_SCRIPT_URL (Required for Influencers)
```
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
**Purpose**: Google Apps Script URL for managing influencers (add/delete)
**How to get**: 
1. Create Apps Script (see DEPLOYMENT_FIX.md)
2. Deploy as Web App
3. Copy the Web App URL

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Add each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_ORDER_SITE_URL`)
   - **Value**: Variable value (e.g., `https://growessence.vercel.app`)
   - **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**
6. **Redeploy** your application for changes to take effect

## After Adding Variables

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Test your application

## Verification

After deployment, verify:
- ✅ Referral links show correct URL (not localhost)
- ✅ Can add influencers
- ✅ Can delete influencers
- ✅ Can view orders
- ✅ Data persists after page refresh

## Troubleshooting

### Variables not working?
- Make sure variable names are **exact** (case-sensitive)
- Redeploy after adding variables
- Check variable values don't have extra spaces
- Verify environment is set to **Production**

### Still seeing errors?
- Check browser console (F12) for detailed errors
- Verify Apps Script is deployed and accessible
- Make sure Google Sheet is publicly viewable
- Check Vercel deployment logs

