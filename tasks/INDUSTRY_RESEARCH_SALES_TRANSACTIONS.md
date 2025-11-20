# Industry Research: Sales Transactions Best Practices

**Research Date**: 2025-11-19
**Companies Researched**: Fresha, Square, Booksy, Vagaro, Mindbody
**Focus**: Service industry (salons, spas, beauty) transaction handling

---

## 📋 **What to Include on Each Transaction Line Item**

### **Required Information (Industry Standard)**

Based on research from Fresha, Square, Vagaro, and Mindbody:

#### **1. Transaction Header**
```
✅ Transaction/Receipt Number (unique identifier)
✅ Transaction Date
✅ Transaction Time
✅ Business Name & Location
✅ Business Contact Info (optional)
```

#### **2. Client Information**
```
✅ Client Name
✅ Client Phone/Email (at least one)
✅ Client ID (internal tracking)
```

#### **3. Service Line Items**
For each service performed:
```
✅ Service Name
✅ Service Provider/Staff Name
✅ Duration (minutes)
✅ Individual Price
✅ Start Time (optional but recommended)
✅ End Time (optional but recommended)
```

**Example:**
```
Manicure
Emily Chen • 45 min
$35.00
```

#### **4. Product Line Items**
For each product sold:
```
✅ Product Name
✅ Quantity
✅ Unit Price
✅ Line Total (Quantity × Unit Price)
```

**Example:**
```
OPI Nail Polish - Red
Qty: 2 × $12.00
$24.00
```

#### **5. Financial Breakdown**
```
✅ Subtotal (Services + Products before tax/discount)
✅ Discount Amount (if applicable)
✅ Discount Reason/Code (loyalty, promo, etc.)
✅ Tax Amount
✅ Tax Rate (%) - optional but recommended
✅ Subtotal after Tax
✅ Gratuity/Tip Amount
✅ Service Charge (if applicable - different from tip)
✅ TOTAL (bold, prominent)
```

**Example:**
```
Subtotal              $80.00
Discount (10% Loyalty) -$8.00
Tax (9%)               $6.48
Subtotal after tax    $78.48
Gratuity              $15.00
─────────────────────────────
TOTAL                 $93.48
```

#### **6. Payment Details**
For each payment method used:
```
✅ Payment Method (Cash, Credit Card, Debit Card, Gift Card, etc.)
✅ Amount Paid
✅ Card Type (Visa, Mastercard, Amex, Discover)
✅ Card Last 4 Digits (****1234)
✅ Transaction ID / Authorization Code
✅ Payment Timestamp
✅ Payment Status (Approved, Declined, Pending)
```

**Example for Single Payment:**
```
💳 Visa ****1234
Transaction ID: txn_1234567890
Approved at 11:50 AM
Amount: $93.48
```

**Example for Split Payment:**
```
💵 Cash               $50.00
💳 Visa ****1234      $43.48
Transaction ID: txn_1234567890
```

#### **7. Additional Information (Optional)**
```
○ Booking Source (Online, Phone, Walk-in)
○ Appointment ID (if from appointment)
○ Employee Commission (internal view only)
○ Notes/Special Instructions
○ Receipt Footer (return policy, thank you message, social media)
```

---

## 🏷️ **Transaction Status Types**

### **Standard Industry Statuses**

Based on Fresha, Square, Vagaro, and Mindbody research:

#### **Primary Transaction/Payment Statuses:**

1. **Paid** ✅
   - Transaction completed successfully
   - Full payment received
   - Most common status for completed sales
   - Alternative names: Completed, Closed, Settled

2. **Unpaid** ⏳
   - Service performed but payment not yet received
   - Outstanding balance
   - Alternative names: Pending Payment, Outstanding, Due

3. **Partial Payment** 💰
   - Some payment received, balance remaining
   - Split across multiple payment methods
   - May have payment plan
   - Alternative names: Partially Paid, Deposit Received

4. **Refunded** 🔄
   - Full refund issued to client
   - Original transaction reversed
   - Alternative names: Returned, Reversed

5. **Partially Refunded** ↩️
   - Partial amount returned to client
   - Some charges retained
   - Alternative names: Partial Return

6. **Voided** ❌
   - Transaction cancelled before completion
   - No money exchanged
   - Cannot be modified after void
   - Alternative names: Cancelled, Deleted

7. **Pending** ⏱️
   - Transaction initiated but not finalized
   - Awaiting payment processing
   - Card authorization pending
   - Alternative names: Processing, In Progress, Authorizing

8. **Failed** ⚠️
   - Payment attempt unsuccessful
   - Card declined or error occurred
   - Alternative names: Declined, Error, Rejected

9. **Disputed/Chargeback** ⚡
   - Client disputed charge with bank
   - Under investigation
   - Alternative names: Under Review, Contested

---

## 🎯 **Appointment vs Transaction Statuses**

### **Important Distinction:**

**Appointment Statuses** (booking-related):
- Scheduled/Booked
- Confirmed
- Checked-In
- In-Service/In-Progress
- Completed
- Cancelled
- No-Show
- Rescheduled

**Transaction/Payment Statuses** (financial):
- Paid
- Unpaid
- Partial Payment
- Refunded
- Voided
- Pending
- Failed

**Note:** A completed appointment may have:
- Appointment Status: "Completed"
- Transaction Status: "Paid" or "Unpaid" or "Partial Payment"

---

## 💡 **Key Findings from Industry Leaders**

### **Fresha:**
- Receipts include: Sale ID, client info, business info, itemized services/products
- Shows discounts, tax, total, and payment method
- All receipt updates tracked in Activity log with timestamps
- Can edit sales receipts after completion
- Appointment statuses: Booked, Completed, Cancelled, No-Show

### **Square:**
- Provides itemized breakdown with quantities, discounts, taxes
- Includes: Authorization code, unique receipt number, transaction timestamp
- Shows VAT rates per item for applicable regions
- Labels reprints as "Duplicate" or "Copy"
- Includes barcode for easy returns/exchanges
- Transaction status report shows: Unprocessed, Declined, Cancelled, Expired

### **Vagaro:**
- Transaction list includes: Business name, checkout date, employee, transaction ID
- Shows appointment date, customer name, item sold, commission employee
- Allows custom footer text on receipts
- Separates digital and physical receipt options

### **Mindbody/Booker:**
- Customizable receipt fields
- Can include business logo, customer reward points
- Allows custom notes/messages on receipts
- Email receipts standard practice

---

## 📊 **Tax & Gratuity Handling**

### **Critical Legal Distinctions:**

#### **Tips/Gratuity (Voluntary):**
- Optional payment from customer
- NOT subject to sales tax (in most states)
- Goes directly to service provider
- Must be clearly marked as optional
- Shows as separate line item

#### **Service Charge (Mandatory):**
- Automatically added to bill
- SUBJECT TO SALES TAX (in most states)
- Considered business revenue
- Often for large parties (18% for 8+ people)
- Must be clearly disclosed before service

#### **Receipt Requirements:**
```
✅ Separately state gratuity/tip on receipt
✅ Show it's optional (for tips)
✅ Disclose mandatory service charges upfront
✅ Calculate tax BEFORE adding tip
✅ Show tax rate/amount clearly
```

**Example - Correct Way:**
```
Subtotal (services)    $80.00
Discount              -$8.00
Tax (9% on $72)        $6.48
Subtotal after tax    $78.48
Gratuity (optional)   $15.00  ← NOT taxed
─────────────────────────────
TOTAL                 $93.48
```

**Example - Service Charge:**
```
Subtotal (services)    $80.00
Service Charge (18%)   $14.40  ← IS taxed
Tax (9% on $94.40)     $8.50
─────────────────────────────
TOTAL                 $102.90
```

---

## 🔐 **Credit Card Receipt Security Requirements**

### **Federal Law (FACT Act):**

**Required:**
- ✅ Truncate card number - show ONLY last 4 digits
- ✅ DO NOT print card expiration date
- ✅ Include authorization approval code
- ✅ Show transaction date
- ✅ Display merchant DBA name
- ✅ Show merchant city/state

**Prohibited:**
- ❌ Full credit card number
- ❌ Card expiration date
- ❌ CVV code

**Best Practices:**
- Maximum last 5 digits (but 4 is safer)
- Include transaction ID for tracking
- Print merchant contact info for disputes
- Add return/refund policy

---

## 📋 **Recommended Transaction Structure**

### **For Service Industry (Salons/Spas/Beauty):**

```
┌─────────────────────────────────────────────┐
│  BUSINESS NAME                             │
│  123 Main St, City, ST 12345              │
│  (555) 123-4567                           │
│                                            │
│  RECEIPT #12345                           │
│  November 19, 2024 at 11:50 AM           │
│                                            │
├─────────────────────────────────────────────┤
│  CLIENT                                    │
│  Sarah Johnson                             │
│  (555) 234-5678                           │
│                                            │
├─────────────────────────────────────────────┤
│  SERVICES                                  │
│                                            │
│  Manicure                                  │
│  Emily Chen • 45 min        $35.00        │
│                                            │
│  Pedicure                                  │
│  Emily Chen • 60 min        $45.00        │
│                                            │
├─────────────────────────────────────────────┤
│  PRODUCTS                                  │
│                                            │
│  OPI Nail Polish - Red                    │
│  Qty: 2 × $12.00            $24.00        │
│                                            │
├─────────────────────────────────────────────┤
│  PAYMENT SUMMARY                           │
│                                            │
│  Subtotal                   $104.00       │
│  Discount (10% Loyalty)      -$10.40      │
│  Tax (9%)                     $8.42       │
│  Subtotal after tax         $102.02       │
│  Gratuity                    $15.00       │
│  ─────────────────────────────────────     │
│  TOTAL                      $117.02       │
│                                            │
├─────────────────────────────────────────────┤
│  PAYMENT DETAILS                           │
│                                            │
│  💳 Visa ****1234           $117.02       │
│  Transaction ID: txn_abc123xyz            │
│  Approved at 11:50 AM                     │
│                                            │
│  Status: Paid ✓                           │
│                                            │
├─────────────────────────────────────────────┤
│  Thank you for your business!             │
│  Returns within 30 days with receipt      │
│  Follow us @salon on Instagram            │
└─────────────────────────────────────────────┘
```

---

## ✅ **Implementation Checklist for Mango POS**

### **Currently Have:**
- ✅ Transaction ID
- ✅ Client name and phone
- ✅ Services with staff and duration
- ✅ Service prices
- ✅ Subtotal, tax, tip, total
- ✅ Discount amount
- ✅ Transaction date/time
- ✅ Status

### **Need to Add:**
- ⬜ **Transaction Status Types**
  - Implement: Paid, Unpaid, Partial Payment, Refunded, Partially Refunded, Voided, Pending, Failed
  - Currently only showing appointment statuses (completed, pending, etc.)

- ⬜ **Payment Details Section**
  - Payment method (Cash, Credit, Debit, etc.)
  - Card type and last 4 digits
  - Transaction ID/Authorization code
  - Payment timestamp
  - Multiple payment support (split payments)

- ⬜ **Enhanced Line Items**
  - Product sales display ✅ (already added!)
  - Service start/end times (actual vs scheduled)
  - Commission tracking (optional, internal view)

- ⬜ **Tax Details**
  - Tax rate (%) not just amount
  - Clear indication of what's taxed
  - "Subtotal after tax" line item

- ⬜ **Gratuity Handling**
  - Clearly labeled as "Gratuity" or "Tip"
  - Separated from taxable amounts
  - Optional vs mandatory indication

- ⬜ **Receipt Footer**
  - Business contact info
  - Return/refund policy
  - Thank you message
  - Social media handles

---

## 🎯 **Priority Recommendations**

### **High Priority (Critical for Compliance):**
1. ✅ Truncate card numbers (last 4 digits only)
2. ✅ Add payment method details
3. ✅ Implement proper transaction statuses (Paid/Unpaid/etc.)
4. ✅ Show tax rate, not just amount
5. ✅ Separate gratuity from taxable items

### **Medium Priority (Industry Standard):**
6. ✅ Add transaction ID to receipts
7. ✅ Show "Subtotal after tax" line
8. ✅ Support split/multiple payments
9. ✅ Add payment timestamps
10. ✅ Include discount reason/code

### **Nice to Have (Enhanced UX):**
11. ✅ Receipt footer with business info
12. ✅ Service start/end times
13. ✅ Booking source indicator
14. ✅ Barcode for returns
15. ✅ Commission tracking (staff view)

---

## 📝 **Transaction Status Workflow**

### **Typical Flow:**

```
Appointment Created
      ↓
[Appointment Status: Scheduled]
      ↓
Client Checks In
      ↓
[Appointment Status: Checked-In]
      ↓
Service Starts
      ↓
[Appointment Status: In-Service]
      ↓
Service Completes
      ↓
[Appointment Status: Completed]
      ↓
Generate Transaction/Sale
      ↓
[Transaction Status: Pending Payment]
      ↓
Process Payment
      ↓
Payment Successful?
   Yes ↓         No ↓
[Paid]      [Failed] → Retry or [Unpaid]
      ↓
Complete
      ↓
Issue Receipt
```

### **Special Cases:**

**Partial Payment:**
```
Total: $100
Payment 1: $60 (Cash)
[Status: Partial Payment]
Payment 2: $40 (Card)
[Status: Paid]
```

**Refund:**
```
Original: Paid
Client Request Refund
Process Refund
[Status: Refunded or Partially Refunded]
```

**Void:**
```
Transaction Created
Client Changes Mind Before Payment
[Status: Voided]
```

---

## 🏆 **Best Practices Summary**

### **From Industry Leaders:**

1. **Transparency** - Show all charges clearly and separately
2. **Detail** - Itemize everything (services, products, taxes, tips)
3. **Compliance** - Follow legal requirements (card truncation, tax disclosure)
4. **Clarity** - Use clear labels (Subtotal, Tax, Gratuity, Total)
5. **Accuracy** - Include unique IDs, timestamps, authorization codes
6. **Flexibility** - Support multiple payment methods and split payments
7. **Accessibility** - Offer both printed and digital receipts
8. **Tracking** - Maintain audit trail of all changes
9. **Security** - Protect sensitive payment information
10. **Professionalism** - Clean, organized receipt layout

---

## 📚 **Sources:**
- Fresha Help Center & Documentation
- Square Support & POS Documentation
- Booksy Business Documentation
- Vagaro Support Center
- Mindbody Knowledge Base
- California CDTFA Publication 115 (Tips & Gratuities)
- Federal FACT Act (Credit Card Receipt Requirements)
- Various State Tax Authorities

---

**Status**: ✅ Research Complete
**Next Step**: Implement transaction status types and payment details in Mango POS
