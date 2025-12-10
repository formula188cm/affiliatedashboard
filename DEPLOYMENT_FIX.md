# Production Deployment Fix Guide

## Problem Fixed
The website was using file system storage (`data/influencers.json`) which doesn't work on Vercel (serverless). File writes don't persist in serverless environments.

## Solution Implemented
1. **Hybrid Storage System**: 
   - Local development: Uses file system (fast, easy)
   - Production: Uses Google Sheets via Apps Script (persistent, reliable)

2. **Automatic Detection**: 
   - Detects if running on Vercel (`VERCEL=1`)
   - Falls back to file system if Google Sheets isn't configured

## Required Environment Variables

### For Production (Vercel):

1. **NEXT_PUBLIC_ORDER_SITE_URL** (Required)
   ```
   https://growessence.vercel.app
   ```

2. **NEXT_PUBLIC_SHEET_ID** (Required for Orders)
   ```
   Your Google Sheet ID from the URL
   ```

3. **NEXT_PUBLIC_APPS_SCRIPT_URL** (Required for Influencers in Production)
   ```
   Your Google Apps Script Web App URL
   ```

## Setting Up Google Apps Script for Influencers

### Step 1: Create Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Replace the code with this:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Influencers') || 
                  SpreadsheetApp.getActiveSpreadsheet().insertSheet('Influencers');
    
    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['id', 'name', 'referralCode', 'commissionPercentage', 'createdAt']);
    }
    
    if (action === 'addInfluencer') {
      sheet.appendRow([
        data.id,
        data.name,
        data.referralCode,
        data.commissionPercentage,
        data.createdAt
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }));
    }
    
    if (action === 'deleteInfluencer') {
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] === data.id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }));
    }
    
    if (action === 'getInfluencers') {
      const rows = sheet.getDataRange().getValues();
      const influencers = [];
      for (let i = 1; i < rows.length; i++) {
        influencers.push({
          id: rows[i][0],
          name: rows[i][1],
          referralCode: rows[i][2],
          commissionPercentage: rows[i][3],
          createdAt: rows[i][4]
        });
      }
      return ContentService.createTextOutput(JSON.stringify({ influencers }));
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }));
  }
}

function doGet(e) {
  if (e.parameter.action === 'getInfluencers') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Influencers');
    if (!sheet || sheet.getLastRow() === 0) {
      return ContentService.createTextOutput(JSON.stringify({ influencers: [] }));
    }
    
    const rows = sheet.getDataRange().getValues();
    const influencers = [];
    for (let i = 1; i < rows.length; i++) {
      influencers.push({
        id: rows[i][0],
        name: rows[i][1],
        referralCode: rows[i][2],
        commissionPercentage: rows[i][3],
        createdAt: rows[i][4]
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ influencers }));
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }));
}
```

### Step 2: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Select type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Click "Deploy"
6. Copy the Web App URL
7. Add to Vercel environment variables as `NEXT_PUBLIC_APPS_SCRIPT_URL`

### Step 3: Set Up Google Sheet

1. Create or use existing Google Sheet
2. Create a sheet named "Influencers" (or the script will create it)
3. Make sure the sheet is accessible by your Apps Script
4. The script will automatically add headers: id, name, referralCode, commissionPercentage, createdAt

## Quick Fix (If Apps Script Not Ready)

If you need it working immediately without Apps Script setup:

1. The system will try to use Google Sheets
2. If that fails, it falls back to file system (which won't work on Vercel)
3. For a quick test, you can temporarily use file system in local dev

## Testing

1. **Local Development**: 
   - Works with file system automatically
   - No Apps Script needed for local testing

2. **Production**:
   - Requires Apps Script URL
   - All data persists in Google Sheets
   - Works perfectly on Vercel

## Troubleshooting

### "Failed to add influencer" error
- Check `NEXT_PUBLIC_APPS_SCRIPT_URL` is set in Vercel
- Verify Apps Script is deployed and accessible
- Check Apps Script execution logs

### "Sheet ID not configured" error
- Add `NEXT_PUBLIC_SHEET_ID` to Vercel environment variables
- Get Sheet ID from Google Sheets URL

### Data not persisting
- Make sure you're using Apps Script (not file system)
- Check Apps Script has proper permissions
- Verify sheet name is "Influencers"

## Next Steps

1. Set up Google Apps Script (see above)
2. Add environment variables to Vercel
3. Redeploy
4. Test adding/deleting influencers
5. Verify data persists after page refresh

