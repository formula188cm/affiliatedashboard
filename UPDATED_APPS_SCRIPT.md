# Updated Apps Script (Add to Your Existing Script)

## Just Add These Functions to Your Existing Script

Add these functions to your **existing** Apps Script. Don't replace anything - just add these new functions:

```javascript
// Add this function to handle influencers
function handleInfluencers(action, data) {
  const INFLUENCER_SHEET_NAME = "Influencers";
  const sheet = SpreadsheetApp.openById(SHEET_ID);
  let influencerSheet = sheet.getSheetByName(INFLUENCER_SHEET_NAME);
  
  // Create Influencers sheet if it doesn't exist
  if (!influencerSheet) {
    influencerSheet = sheet.insertSheet(INFLUENCER_SHEET_NAME);
    influencerSheet.appendRow(['id', 'name', 'referralCode', 'commissionPercentage', 'createdAt']);
  }
  
  if (action === 'addInfluencer') {
    // Check for duplicate referral code
    const rows = influencerSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][2] && rows[i][2].toUpperCase() === data.referralCode.toUpperCase()) {
        return { error: 'Referral code already exists' };
      }
    }
    
    influencerSheet.appendRow([
      data.id,
      data.name,
      data.referralCode,
      data.commissionPercentage,
      data.createdAt
    ]);
    return { success: true };
  }
  
  if (action === 'deleteInfluencer') {
    const rows = influencerSheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === data.id) {
        influencerSheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { error: 'Influencer not found' };
  }
  
  if (action === 'getInfluencers') {
    const rows = influencerSheet.getDataRange().getValues();
    const influencers = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        influencers.push({
          id: String(rows[i][0]),
          name: String(rows[i][1] || ''),
          referralCode: String(rows[i][2] || ''),
          commissionPercentage: Number(rows[i][3] || 0),
          createdAt: String(rows[i][4] || new Date().toISOString())
        });
      }
    }
    return { influencers };
  }
  
  return { error: 'Unknown influencer action' };
}
```

## Update Your doPost Function

Replace your existing `doPost` function with this (it adds influencer support):

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Handle influencers
    if (data.action && (data.action === 'addInfluencer' || data.action === 'deleteInfluencer')) {
      const result = handleInfluencers(data.action, data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle orders (your existing code)
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Add new row with order data
    sheet.appendRow([
      data.id || Utilities.getUuid(),
      data.name,
      data.phone,
      data.address,
      data.price,
      data.referralCode,
      data.status || "pending",
      new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Update Your doGet Function

Replace your existing `doGet` function with this (it adds influencer support):

```javascript
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Handle influencers
    if (action === "getInfluencers") {
      const result = handleInfluencers('getInfluencers', {});
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle order status update (your existing code)
    if (action === "updateStatus") {
      const orderId = e.parameter.orderId;
      const newStatus = e.parameter.status;
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      // Find and update the order status
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == orderId) {
          sheet.getRange(i + 1, 7).setValue(newStatus);
          return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ error: "Order not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Complete Updated Script

Here's your complete script with influencer support added:

```javascript
const SHEET_NAME = "Orders";
const SHEET_ID = "1YvGlnceA_57cUa-DvMtlJihzw5paTqfEYLRwg2HEhM8";

// Add this function to handle influencers
function handleInfluencers(action, data) {
  const INFLUENCER_SHEET_NAME = "Influencers";
  const sheet = SpreadsheetApp.openById(SHEET_ID);
  let influencerSheet = sheet.getSheetByName(INFLUENCER_SHEET_NAME);
  
  // Create Influencers sheet if it doesn't exist
  if (!influencerSheet) {
    influencerSheet = sheet.insertSheet(INFLUENCER_SHEET_NAME);
    influencerSheet.appendRow(['id', 'name', 'referralCode', 'commissionPercentage', 'createdAt']);
  }
  
  if (action === 'addInfluencer') {
    // Check for duplicate referral code
    const rows = influencerSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][2] && rows[i][2].toUpperCase() === data.referralCode.toUpperCase()) {
        return { error: 'Referral code already exists' };
      }
    }
    
    influencerSheet.appendRow([
      data.id,
      data.name,
      data.referralCode,
      data.commissionPercentage,
      data.createdAt
    ]);
    return { success: true };
  }
  
  if (action === 'deleteInfluencer') {
    const rows = influencerSheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === data.id) {
        influencerSheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { error: 'Influencer not found' };
  }
  
  if (action === 'getInfluencers') {
    const rows = influencerSheet.getDataRange().getValues();
    const influencers = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        influencers.push({
          id: String(rows[i][0]),
          name: String(rows[i][1] || ''),
          referralCode: String(rows[i][2] || ''),
          commissionPercentage: Number(rows[i][3] || 0),
          createdAt: String(rows[i][4] || new Date().toISOString())
        });
      }
    }
    return { influencers };
  }
  
  return { error: 'Unknown influencer action' };
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Handle influencers
    if (data.action && (data.action === 'addInfluencer' || data.action === 'deleteInfluencer')) {
      const result = handleInfluencers(data.action, data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle orders (your existing code)
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Add new row with order data
    sheet.appendRow([
      data.id || Utilities.getUuid(),
      data.name,
      data.phone,
      data.address,
      data.price,
      data.referralCode,
      data.status || "pending",
      new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Handle influencers
    if (action === "getInfluencers") {
      const result = handleInfluencers('getInfluencers', {});
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle order status update (your existing code)
    if (action === "updateStatus") {
      const orderId = e.parameter.orderId;
      const newStatus = e.parameter.status;
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      // Find and update the order status
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == orderId) {
          sheet.getRange(i + 1, 7).setValue(newStatus);
          return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ error: "Order not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## What Changed

✅ **Your order functionality stays exactly the same**
✅ **Added influencer support** (new "Influencers" sheet will be created automatically)
✅ **Same Apps Script URL** - no need to change Vercel settings
✅ **Simple and clean** - just added one helper function

## Next Steps

1. **Copy the complete script above** to your Apps Script
2. **Save** (Ctrl+S)
3. **Deploy** → **Manage deployments** → **Edit** → **New version** → **Deploy**
4. **Done!** Your existing Apps Script URL will now work for both orders and influencers

No need to change anything in Vercel - just use your existing `NEXT_PUBLIC_APPS_SCRIPT_URL`!

