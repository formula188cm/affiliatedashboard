# Order Website Integration Guide

## Overview

Your order website should:
1. ✅ **Keep sending orders to your main Google Sheet** (don't change this)
2. ✅ **Add a referral code field** in the checkout form
3. ✅ **If referral code exists**, ALSO send the order to the affiliate Google Sheet
4. ✅ The admin portal will automatically fetch from the affiliate sheet

---

## Step 1: Add Referral Code Field to Checkout

Add an input field for referral code in your checkout form:

### HTML Example:
```html
<!-- Add this to your checkout form -->
<div class="form-group">
  <label for="referralCode">Referral Code (Optional)</label>
  <input 
    type="text" 
    id="referralCode" 
    name="referralCode" 
    placeholder="Enter referral code"
    style="text-transform: uppercase;"
  />
</div>
```

### React Example:
```jsx
const [referralCode, setReferralCode] = useState('');

// In your checkout form:
<input
  type="text"
  value={referralCode}
  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
  placeholder="Enter referral code (optional)"
/>
```

### Vanilla JavaScript Example:
```html
<input 
  type="text" 
  id="referralCode" 
  oninput="this.value = this.value.toUpperCase()"
  placeholder="Enter referral code (optional)"
/>
```

---

## Step 2: Send Order to Affiliate Sheet (When Referral Code Exists)

After your order is successfully placed and sent to your main Google Sheet, add this code:

### JavaScript/TypeScript Code:

```javascript
// After your existing order submission code (that sends to main sheet)
// Add this function:

async function sendToAffiliateSheet(orderData) {
  // Only send if referral code exists
  if (!orderData.referralCode || orderData.referralCode.trim() === '') {
    return; // Skip if no referral code
  }

  // Prepare order data for affiliate sheet
  const affiliateOrder = {
    id: orderData.id || generateUniqueId(), // Use same order ID or generate new one
    name: orderData.name || orderData.customerName,
    phone: orderData.phone || orderData.customerPhone,
    address: orderData.address || orderData.shippingAddress,
    price: orderData.price || orderData.total || orderData.amount,
    referralCode: orderData.referralCode.toUpperCase().trim(), // Normalize referral code
    status: "pending" // Default status
  };

  // Send to affiliate Google Sheet via Apps Script
  const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbxkFfzt-WBcwJzFMmotXhIOvdYVjMa6goYe87MBp2_LER2Cqpl_3jPab60RtR9NG9uX/exec';
  
  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(affiliateOrder),
    });

    const result = await response.json();
    
    if (result.error) {
      console.error('Failed to send to affiliate sheet:', result.error);
      // Don't show error to customer - this is background process
    } else {
      console.log('Order sent to affiliate sheet successfully');
    }
  } catch (error) {
    console.error('Error sending to affiliate sheet:', error);
    // Don't show error to customer - this is background process
  }
}

// Helper function to generate unique ID (if needed)
function generateUniqueId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
```

---

## Step 3: Integration Examples

### Example 1: After Form Submission (Vanilla JS)

```javascript
// Your existing order submission
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Your existing code to send to main Google Sheet
  const orderData = {
    id: generateOrderId(),
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    price: parseFloat(document.getElementById('total').value),
    referralCode: document.getElementById('referralCode').value.trim()
  };

  // Send to main sheet (your existing code)
  await sendToMainSheet(orderData);
  
  // ALSO send to affiliate sheet if referral code exists
  if (orderData.referralCode) {
    await sendToAffiliateSheet(orderData);
  }
  
  // Show success message
  alert('Order placed successfully!');
});
```

### Example 2: React/Next.js

```jsx
const handleCheckout = async (formData) => {
  const orderData = {
    id: generateOrderId(),
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    price: formData.total,
    referralCode: formData.referralCode?.toUpperCase().trim() || ''
  };

  try {
    // Send to main Google Sheet (your existing code)
    await sendToMainSheet(orderData);
    
    // ALSO send to affiliate sheet if referral code exists
    if (orderData.referralCode) {
      await sendToAffiliateSheet(orderData);
    }
    
    // Show success
    toast.success('Order placed successfully!');
  } catch (error) {
    toast.error('Failed to place order');
  }
};
```

### Example 3: Shopify/WordPress/WooCommerce

If you're using a platform like Shopify or WooCommerce, add this to your order completion hook:

```javascript
// WordPress/WooCommerce hook
add_action('woocommerce_thankyou', 'send_to_affiliate_sheet', 10, 1);
function send_to_affiliate_sheet($order_id) {
  $order = wc_get_order($order_id);
  $referral_code = get_post_meta($order_id, 'referral_code', true);
  
  if ($referral_code) {
    $order_data = array(
      'id' => (string)$order_id,
      'name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
      'phone' => $order->get_billing_phone(),
      'address' => $order->get_formatted_billing_address(),
      'price' => (float)$order->get_total(),
      'referralCode' => strtoupper(trim($referral_code)),
      'status' => 'pending'
    );
    
    wp_remote_post('https://script.google.com/macros/s/AKfycbxkFfzt-WBcwJzFMmotXhIOvdYVjMa6goYe87MBp2_LER2Cqpl_3jPab60RtR9NG9uX/exec', array(
      'method' => 'POST',
      'headers' => array('Content-Type' => 'application/json'),
      'body' => json_encode($order_data)
    ));
  }
}
```

---

## Step 4: Order Data Format

Make sure your order data matches this exact format:

```javascript
{
  id: "1234567890",              // String - unique order ID
  name: "John Doe",              // String - customer full name
  phone: "+1234567890",          // String - customer phone
  address: "123 Main St, City",  // String - full shipping address
  price: 299.99,                 // Number - order total price
  referralCode: "ALEX001",      // String - referral code (uppercase)
  status: "pending"              // String - always "pending" for new orders
}
```

---

## Step 5: Testing

1. **Test without referral code:**
   - Place an order without referral code
   - Should only go to main sheet (no error)

2. **Test with referral code:**
   - Place an order with referral code "ALEX001"
   - Should go to BOTH main sheet AND affiliate sheet
   - Check affiliate sheet - order should appear

3. **Test invalid referral code:**
   - Place order with random referral code
   - Should still work (we don't validate codes on order website)

---

## Important Notes

1. ✅ **Don't break existing functionality** - Keep your main sheet integration as-is
2. ✅ **Silent failure** - If affiliate sheet fails, don't show error to customer
3. ✅ **Case insensitive** - Convert referral codes to uppercase
4. ✅ **Optional field** - Referral code is optional, orders without it work normally
5. ✅ **Background process** - Sending to affiliate sheet should not block order completion

---

## Troubleshooting

### Orders not appearing in affiliate sheet:
- Check browser console for errors
- Verify Apps Script URL is correct
- Make sure referral code field is being captured
- Check Apps Script logs in Google Scripts editor

### Referral code not being sent:
- Verify the referral code field value is not empty
- Check that the condition `if (referralCode)` is working
- Make sure referral code is trimmed and uppercase

---

## Quick Copy-Paste Code

Here's the complete code you can copy-paste into your order website:

```javascript
// Add this function to your order website
async function sendToAffiliateSheet(orderData) {
  if (!orderData.referralCode || orderData.referralCode.trim() === '') {
    return; // Skip if no referral code
  }

  const affiliateOrder = {
    id: orderData.id || Date.now().toString(),
    name: orderData.name || orderData.customerName,
    phone: orderData.phone || orderData.customerPhone,
    address: orderData.address || orderData.shippingAddress,
    price: parseFloat(orderData.price || orderData.total || orderData.amount),
    referralCode: orderData.referralCode.toUpperCase().trim(),
    status: "pending"
  };

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxkFfzt-WBcwJzFMmotXhIOvdYVjMa6goYe87MBp2_LER2Cqpl_3jPab60RtR9NG9uX/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(affiliateOrder),
    });
    const result = await response.json();
    if (result.error) console.error('Affiliate sheet error:', result.error);
  } catch (error) {
    console.error('Error sending to affiliate sheet:', error);
  }
}

// Call this after your existing order submission:
// if (orderData.referralCode) {
//   await sendToAffiliateSheet(orderData);
// }
```

