# iPaymer Meeting Checklist

**Purpose:** Questions based on our review of the iPaymer API documentation
**API Reviewed:** https://api.ipaymer.com/docs/api
**Date Prepared:** January 25, 2025

---

## What We Found in Their API Documentation

| Endpoint | What It Does |
|----------|--------------|
| `/v1/card` | Save and manage customer credit cards |
| `/v2/bills` | Create and pay invoices |
| `/v2/bills/{id}/pay` | Process a payment |
| `/v1/payment/integration/cardconnect` | Connect to CardConnect gateway |
| `/v1/payment/integration/stripe` | Connect to Stripe gateway |
| `/v2/transaction` | View transaction history |

---

## Part 1: The Gap - Tap to Pay Not in API

| # | Question | Context |
|---|----------|---------|
| 1 | **"I reviewed your API at api.ipaymer.com/docs/api. I see endpoints for `/v1/card` and `/v2/bills/{id}/pay`, but I don't see any endpoint for Tap to Pay or NFC payments. Where is that documented?"** | Shows you did your homework |
| 2 | **"Is Tap to Pay handled through the CardConnect integration at `/v1/payment/integration/cardconnect`, or is there a separate SDK?"** | Connects what you found to what they claimed |
| 3 | **"Your API shows `PayBillRequest` requires a `bank_account_id`. How do we submit a Tap to Pay transaction instead?"** | Specific schema question |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Part 2: The CardConnect Connection

| # | Question | What We Found |
|---|----------|---------------|
| 4 | **"I see you have `/v1/payment/integration/cardconnect` endpoints to store gateway credentials. Does this mean we process Tap to Pay through CardConnect/Fiserv directly?"** | Their API stores CardConnect config |
| 5 | **"CardConnect is owned by Fiserv. Fiserv has a Tap to Pay SDK called `FiservTTP`. Do we use that SDK and then connect to iPaymer for reporting?"** | Shows you researched the Fiserv side |
| 6 | **"Do we need a separate merchant account with CardConnect/Fiserv, or does iPaymer provide that?"** | Clarifies the business relationship |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Part 3: Missing Documentation

| # | What's Missing | Question |
|---|----------------|----------|
| 7 | No mobile SDK docs | **"Your API docs show REST endpoints. Where is the mobile SDK documentation for iOS/Android Tap to Pay?"** |
| 8 | No NFC/contactless endpoints | **"I couldn't find any endpoints mentioning NFC, contactless, or card-present transactions. Can you point me to those?"** |
| 9 | No transaction creation | **"The `/v2/transaction` endpoints appear to be read-only for viewing history. How do we create a new Tap to Pay transaction?"** |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Part 4: Payment Flow Questions

Based on what we found, the current flow appears to be:

```
Create Bill --> Pay Bill --> Transaction Created
```

| # | Question | Why It Matters |
|---|----------|----------------|
| 10 | **"For a quick sale at checkout, do we need to create a bill first using `/v2/bills`, then pay it with `/v2/bills/{id}/pay`? Or is there a direct charge endpoint for Tap to Pay?"** | Need to understand the flow |
| 11 | **"The `PayBillRequest` schema shows `bank_account_id` and `amount`. What fields do we send for a card tap payment?"** | Schema doesn't match card payments |
| 12 | **"I see `/v1/card/resolve` for smart card lookup. Is this used during Tap to Pay to match a returning customer?"** | Connects to their existing endpoint |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Part 5: Specific Feature Verification

| # | Their API Shows | Question |
|---|-----------------|----------|
| 13 | CardConnect + Stripe integrations | **"Which gateway handles the actual Tap to Pay processing - CardConnect or Stripe? Or can we choose?"** |
| 14 | `/v1/card` for storing cards | **"After a Tap to Pay, can we save that card using your `/v1/card` endpoint for future purchases?"** |
| 15 | `/v2/transaction` for history | **"Will Tap to Pay transactions appear in the `/v2/transaction` endpoint for our reporting?"** |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Part 6: What We Need From Them

| # | Request | Why |
|---|---------|-----|
| 16 | **"Can you provide the OpenAPI spec or Postman collection that includes Tap to Pay endpoints?"** | We only found billing/invoicing endpoints |
| 17 | **"Can you share the mobile SDK package name and documentation link?"** | Need actual SDK docs |
| 18 | **"Can you show us a sample request/response for a Tap to Pay transaction?"** | See the actual data format |

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Summary Statement for the Meeting

> "I reviewed your API documentation at api.ipaymer.com/docs/api. I found endpoints for cards, bills, and payment gateway integrations with CardConnect and Stripe. However, I didn't find any endpoints or SDK documentation for Tap to Pay or NFC payments. Can you walk me through how Tap to Pay works with your platform and where that's documented?"

---

## Quick Reference: What We Found vs. What's Missing

| Found in API | Not Found |
|--------------|-----------|
| Card storage (`/v1/card`) | Tap to Pay endpoint |
| Bill creation (`/v2/bills`) | NFC/contactless docs |
| Bill payment (`/v2/bills/{id}/pay`) | Mobile SDK |
| CardConnect config | Card-present transactions |
| Transaction history | Direct charge endpoint |

---

## After the Meeting Checklist

Get these in writing:

- [ ] Documentation for Tap to Pay / mobile SDK
- [ ] OpenAPI spec or Postman collection with Tap to Pay endpoints
- [ ] Sample request/response for Tap to Pay transaction
- [ ] Pricing sheet
- [ ] Test/sandbox account credentials
- [ ] Technical support contact

---

## Meeting Notes

**Date:** ____________________

**Attendees:** ____________________

**Key Takeaways:**
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

**Action Items:**
_______________________________________________
_______________________________________________
_______________________________________________

**Follow-up Needed:**
_______________________________________________
_______________________________________________
_______________________________________________
