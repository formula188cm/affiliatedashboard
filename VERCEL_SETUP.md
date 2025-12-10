# 🚀 Complete Vercel Deployment Setup Guide

## ⚠️ IMPORTANT: Why This Is Needed

On Vercel (serverless), file system writes **don't work**. You MUST use Google Sheets for data storage. This guide will help you set it up in **5 minutes**.

---

## 📋 Step-by-Step Setup (5 Minutes)

### Step 1: Create Google Apps Script (2 minutes)

1. **Go to [Google Apps Script](https://script.google.com)**
2. **Click "New Project"**
3. **Delete the default code** and paste this:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Get or create Influencers sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Influencers');
    if (!sheet) {
      sheet = ss.insertSheet('Influencers');
      sheet.appendRow(['id', 'name', 'referralCode', 'commissionPercentage', 'createdAt']);
    }
    
    if (action === 'addInfluencer') {
      // Check for duplicate referral code
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][2] && rows[i][2].toUpperCase() === data.referralCode.toUpperCase()) {
          return ContentService.createTextOutput(JSON.stringify({ 
            error: 'Referral code already exists' 
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      sheet.appendRow([
        data.id,
        data.name,
        data.referralCode,
        data.commissionPercentage,
        data.createdAt
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'deleteInfluencer') {
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] === data.id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === 'getInfluencers') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Influencers');
      if (!sheet || sheet.getLastRow() === 0) {
        return ContentService.createTextOutput(JSON.stringify({ influencers: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const rows = sheet.getDataRange().getValues();
      const influencers = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]) { // Only add if ID exists
          influencers.push({
            id: String(rows[i][0]),
            name: String(rows[i][1] || ''),
            referralCode: String(rows[i][2] || ''),
            commissionPercentage: Number(rows[i][3] || 0),
            createdAt: String(rows[i][4] || new Date().toISOString())
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ influencers }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. **Click "Save"** (Ctrl+S or Cmd+S)
5. **Name your project**: "Influencer Manager" (or any name)

### Step 2: Link to Your Google Sheet (1 minute)

1. **Open your Google Sheet** (the one you're using for orders)
2. **In Apps Script**, click the **folder icon** next to the project name
3. **Select your Google Sheet** from the list
4. **Click "Select"**

**OR** if you already have the sheet open:
1. In Apps Script, click **"Resources"** → **"Libraries"** (or just use the same sheet)
2. The script will automatically use the active spreadsheet

### Step 3: Deploy as Web App (1 minute)

1. **Click "Deploy"** → **"New deployment"**
2. **Click the gear icon** ⚙️ next to "Select type"
3. **Select "Web app"**
4. **Fill in:**
   - **Description**: "Influencer Manager API"
   - **Execute as**: **"Me"** (your email)
   - **Who has access**: **"Anyone"** ⚠️ (Important!)
5. **Click "Deploy"**
6. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)
7. **Click "Done"**

### Step 4: Authorize the Script (30 seconds)

1. **Click "Authorize access"**
2. **Choose your Google account**
3. **Click "Advanced"** → **"Go to [Project Name] (unsafe)"**
4. **Click "Allow"**

### Step 5: Add to Vercel (1 minute)

1. **Go to your Vercel Dashboard**
2. **Select your project**
3. **Go to Settings** → **Environment Variables**
4. **Add these 3 variables:**

#### Variable 1: NEXT_PUBLIC_ORDER_SITE_URL
```
Key: NEXT_PUBLIC_ORDER_SITE_URL
Value: https://growessence.vercel.app
Environment: Production, Preview, Development (select all)
```

#### Variable 2: NEXT_PUBLIC_SHEET_ID
```
Key: NEXT_PUBLIC_SHEET_ID
Value: [Your Google Sheet ID from the URL]
Environment: Production, Preview, Development (select all)
```
**How to get Sheet ID**: From your Google Sheet URL:
`https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

#### Variable 3: NEXT_PUBLIC_APPS_SCRIPT_URL (NEW - Required!)
```
Key: NEXT_PUBLIC_APPS_SCRIPT_URL
Value: [The Web App URL you copied in Step 3]
Environment: Production, Preview, Development (select all)
```

5. **Click "Save"** for each variable

### Step 6: Redeploy (30 seconds)

1. **Go to "Deployments" tab**
2. **Click the "⋯" menu** on the latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment** (usually 1-2 minutes)

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Can add new influencers
- [ ] Can delete influencers
- [ ] Can view influencer list
- [ ] Data persists after page refresh
- [ ] Referral links show correct URL (not localhost)
- [ ] Can view orders

---

## 🐛 Troubleshooting

### "Configuration Error: NEXT_PUBLIC_APPS_SCRIPT_URL is required"
- ✅ Make sure you added the variable in Vercel
- ✅ Make sure you selected all environments (Production, Preview, Development)
- ✅ Redeploy after adding variables

### "Failed to save influencer"
- ✅ Check Apps Script is deployed
- ✅ Verify "Who has access" is set to "Anyone"
- ✅ Check Apps Script execution logs (View → Execution log)

### "Referral code already exists" (but it doesn't)
- ✅ Check your Google Sheet "Influencers" tab
- ✅ Make sure there are no duplicate codes

### Data not persisting
- ✅ Verify Apps Script URL is correct
- ✅ Check Apps Script has access to your sheet
- ✅ Make sure sheet name is exactly "Influencers"

---

## 📝 Quick Reference

**Required Environment Variables:**
```
NEXT_PUBLIC_ORDER_SITE_URL=https://growessence.vercel.app
NEXT_PUBLIC_SHEET_ID=your_sheet_id
NEXT_PUBLIC_APPS_SCRIPT_URL=your_apps_script_url
```

**Apps Script URL Format:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

## 🎉 You're Done!

Once you complete these steps, your website will work perfectly on Vercel. All influencer data will be stored in Google Sheets and persist across deployments.

**Need help?** Check the error message in your dashboard - it will tell you exactly what's missing!

