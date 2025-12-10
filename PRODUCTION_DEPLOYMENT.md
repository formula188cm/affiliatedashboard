# Production Deployment Guide

## ✅ System is Production Ready!

All referral link features are implemented and tested. Here's what's been set up:

### Features Implemented

1. **Automatic Referral Link Generation**
   - Dashboard generates unique referral links for each influencer
   - Links format: `https://growessence.vercel.app/?ref=REFERRALCODE`
   - One-click copy functionality with visual feedback

2. **Auto-Detection on Ordering Site**
   - Referral codes from URL are automatically captured
   - Codes are saved to localStorage and cookies (30-day expiry)
   - Checkout form auto-fills with referral code
   - No manual entry required for customers

3. **Validation & Error Handling**
   - Server-side validation for referral codes (alphanumeric, 3-20 chars)
   - Client-side validation matching server rules
   - Duplicate referral code prevention
   - Commission percentage validation (0-100%)
   - Clipboard API with fallback for older browsers
   - URL protocol handling (auto-adds https:// if missing)

4. **Production Optimizations**
   - Proper URL encoding for referral codes
   - Error handling that doesn't break UX
   - Silent failures for non-critical operations
   - Responsive design maintained

## Environment Variables

### Required for Production

Create `.env.local` (already done) or set in your deployment platform:

```bash
NEXT_PUBLIC_ORDER_SITE_URL=https://growessence.vercel.app
```

### Optional

```bash
# If your dashboard is on a different domain
NEXT_PUBLIC_SITE_URL=https://your-dashboard-domain.com

# Google Sheets integration (if using)
NEXT_PUBLIC_SHEET_ID=your_google_sheet_id
NEXT_PUBLIC_APPS_SCRIPT_URL=your_apps_script_web_app_url
```

## Deployment Checklist

### Before Deploying

- [x] Environment variable `NEXT_PUBLIC_ORDER_SITE_URL` set to production URL
- [x] All referral links point to `growessence.vercel.app`
- [x] Validation working on both client and server
- [x] Error handling in place
- [x] Clipboard functionality tested

### Vercel Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_ORDER_SITE_URL` = `https://growessence.vercel.app`
   - Deploy to: Production, Preview, Development (as needed)

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Production ready: Referral link system"
   git push
   ```

3. **Verify After Deployment:**
   - Visit your dashboard
   - Go to Influencers page
   - Check that referral links show `https://growessence.vercel.app/?ref=CODE`
   - Copy a link and test it opens correctly
   - Verify ordering site auto-fills the code

## Testing in Production

1. **Test Referral Link Generation:**
   - Add a new influencer
   - Copy the generated referral link
   - Verify link format: `https://growessence.vercel.app/?ref=CODE`

2. **Test Auto-Detection:**
   - Open referral link in incognito/private window
   - Navigate to checkout
   - Verify referral code is auto-filled
   - Place test order
   - Verify order appears in dashboard with correct referral code

3. **Test Validation:**
   - Try adding duplicate referral code (should fail)
   - Try invalid referral code format (should fail)
   - Try invalid commission percentage (should fail)

## How It Works

### Flow Diagram

```
1. Admin adds influencer → Dashboard generates link
   ↓
2. Influencer shares: growessence.vercel.app/?ref=HAWA121
   ↓
3. Customer clicks link → Code auto-saved to localStorage/cookie
   ↓
4. Customer goes to checkout → Code auto-filled in form
   ↓
5. Customer places order → Code automatically included
   ↓
6. Order appears in dashboard → Track commissions
```

### Technical Details

- **URL Format:** `https://growessence.vercel.app/?ref=REFERRALCODE`
- **Storage:** localStorage + cookie (30-day expiry)
- **Validation:** Alphanumeric, 3-20 characters, uppercase
- **Error Handling:** Silent failures, graceful degradation

## Troubleshooting

### Links showing localhost instead of production URL
- Check `NEXT_PUBLIC_ORDER_SITE_URL` is set correctly in Vercel
- Redeploy after setting environment variable
- Clear browser cache

### Referral codes not auto-filling
- Check ordering site has the referral hook implemented
- Verify URL parameter `?ref=CODE` is present
- Check browser console for errors

### Orders not appearing with referral codes
- Verify ordering site sends `referralCode` in order payload
- Check Google Sheets/Apps Script integration
- Verify referral code format matches validation rules

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Test referral link in incognito window
4. Check that ordering site integration is complete

---

**Status: ✅ Production Ready**
**Last Updated: Ready for deployment**

