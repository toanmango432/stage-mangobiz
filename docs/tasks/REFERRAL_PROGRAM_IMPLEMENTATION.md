# Referral Program - Full Implementation Guide

> **Status:** Backend Complete | Frontend Integration Pending
> **Last Updated:** December 3, 2025
> **To Resume:** Tell Claude "implement referral program frontend from REFERRAL_PROGRAM_IMPLEMENTATION.md"

---

## Quick Summary

| Component | Status | Location |
|-----------|--------|----------|
| Config & Utilities | ✅ Done | `src/constants/referralConfig.ts` |
| Database Operations | ✅ Done | `src/db/database.ts` (referralsDB) |
| Redux Thunks | ✅ Done | `src/store/slices/clientsSlice.ts` |
| UI Tracking Card | ✅ Done | `src/components/client-settings/components/ReferralTrackingCard.tsx` |
| Tests | ✅ Done | `src/tests/referralSystem.test.ts` (26 tests) |
| Frontend Integration | ❌ Pending | See steps below |

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REFERRAL FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. REFERRER generates code ──► "REFJOHN1"                              │
│                                                                          │
│  2. NEW CLIENT signs up with code ──► Links to referrer                 │
│                                       ──► Gets 15% off first visit      │
│                                                                          │
│  3. NEW CLIENT completes first appointment                               │
│                                                                          │
│  4. REFERRER gets $25 credit ──► Auto-issued on completion              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Default Settings

```typescript
// From src/constants/referralConfig.ts
{
  referrerRewardAmount: 25,        // $25 credit
  referrerRewardType: 'credit',    // 'credit' | 'points' | 'cash'
  referredDiscountPercent: 15,     // 15% off first visit
  referredMaxDiscount: 50,         // Max $50 discount
  codeFormat: 'alphanumeric',      // 'alphanumeric' | 'numeric' | 'name_based'
  codeLength: 6,
  codePrefix: 'REF',               // Codes look like "REFABC123"
  expirationDays: 90,              // Referral expires after 90 days
  autoIssueRewards: true,          // Auto-issue rewards on completion
}
```

---

## Backend Implementation (Complete)

### Available Redux Thunks

```typescript
import {
  generateClientReferralCode,
  applyReferralCode,
  completeReferral,
  getReferralDiscount,
} from '@/store/slices/clientsSlice';

// 1. Generate referral code for a client
dispatch(generateClientReferralCode({ clientId: 'client-123' }));

// 2. Apply referral code when new client signs up
dispatch(applyReferralCode({
  newClientId: 'new-client-456',
  referralCode: 'REFJOHN1'
}));

// 3. Get discount for referred client at checkout
dispatch(getReferralDiscount({
  clientId: 'client-456',
  originalAmount: 100
}));
// Returns: { discountPercent: 15, discountAmount: 15, finalAmount: 85 }

// 4. Complete referral after first appointment
dispatch(completeReferral({
  referralId: 'referral-789',
  appointmentId: 'appt-abc',
  transactionAmount: 85
}));
```

### Database Operations

```typescript
import { referralsDB } from '@/db/database';

// Get referrals by referrer
const referrals = await referralsDB.getByReferrerId(clientId);

// Get referral by referred client (check if they were referred)
const referral = await referralsDB.getByReferredId(clientId);

// Get referral by code
const referral = await referralsDB.getByCode('REFJOHN1');
```

---

## Frontend Integration Steps (Pending)

### Step 1: Wire up Generate Code Button

**File:** `src/components/client-settings/components/ReferralTrackingCard.tsx`

```typescript
// Add at top of file
import { useAppDispatch } from '@/store/hooks';
import { generateClientReferralCode } from '@/store/slices/clientsSlice';

// Inside component
const dispatch = useAppDispatch();

const handleGenerateCode = async () => {
  try {
    await dispatch(generateClientReferralCode({ clientId })).unwrap();
    // Code will be in client.loyaltyInfo.referralCode after state update
  } catch (error) {
    console.error('Failed to generate code:', error);
  }
};

// Pass to button
<Button onClick={handleGenerateCode}>Generate Code</Button>
```

---

### Step 2: Add Referral Code Input on Client Registration

**File:** `src/components/Book/QuickClientModal.tsx` (or equivalent)

```typescript
// Add state for referral code
const [referralCode, setReferralCode] = useState('');

// Add input field in form
<div className="mt-4">
  <label className="text-sm text-gray-600">Referral Code (optional)</label>
  <input
    type="text"
    value={referralCode}
    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
    placeholder="e.g., REFJOHN1"
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>

// After creating client, apply referral code if provided
const handleCreateClient = async () => {
  const newClient = await dispatch(createClient(clientData)).unwrap();

  if (referralCode.trim()) {
    try {
      await dispatch(applyReferralCode({
        newClientId: newClient.id,
        referralCode: referralCode.trim(),
      })).unwrap();
      toast.success('Referral code applied! You\'ll get 15% off your first visit.');
    } catch (error) {
      toast.error('Invalid referral code');
    }
  }
};
```

---

### Step 3: Check for Referral Discount at Checkout

**File:** `src/components/checkout/QuickCheckout.tsx`

```typescript
// Add imports
import { getReferralDiscount, completeReferral } from '@/store/slices/clientsSlice';
import { referralsDB } from '@/db/database';

// Add state for referral discount
const [referralDiscount, setReferralDiscount] = useState<{
  discountPercent: number;
  discountAmount: number;
  referralId: string;
} | null>(null);

// Check for referral discount when client is selected
useEffect(() => {
  const checkReferralDiscount = async () => {
    if (!client?.id) return;

    // Check if client was referred and hasn't completed first visit
    const referral = await referralsDB.getByReferredId(client.id);
    if (referral && !referral.completedAt) {
      const result = await dispatch(getReferralDiscount({
        clientId: client.id,
        originalAmount: subtotal,
      })).unwrap();

      if (result) {
        setReferralDiscount({
          ...result,
          referralId: referral.id,
        });
      }
    }
  };

  checkReferralDiscount();
}, [client?.id, subtotal]);
```

---

### Step 4: Apply Referral Discount to Total

**File:** `src/components/checkout/QuickCheckout.tsx`

```typescript
// In your checkout summary calculation
const calculateTotal = () => {
  let total = subtotal;

  // Apply loyalty points discount
  if (pointsDiscount > 0) {
    total -= pointsDiscount;
  }

  // Apply referral discount (first-time client)
  if (referralDiscount) {
    total -= referralDiscount.discountAmount;
  }

  // Apply other discounts...

  return Math.max(0, total);
};

// Display in UI
{referralDiscount && (
  <div className="flex justify-between text-green-600">
    <span>First Visit Discount ({referralDiscount.discountPercent}%)</span>
    <span>-${referralDiscount.discountAmount.toFixed(2)}</span>
  </div>
)}
```

---

### Step 5: Complete Referral After Successful Payment

**File:** `src/components/checkout/QuickCheckout.tsx`

```typescript
// In your payment success handler
const handlePaymentSuccess = async () => {
  // ... existing payment logic ...

  // Complete referral if this was referred client's first visit
  if (referralDiscount?.referralId) {
    try {
      await dispatch(completeReferral({
        referralId: referralDiscount.referralId,
        appointmentId: ticket.appointmentId || '',
        transactionAmount: finalTotal,
      })).unwrap();

      console.log('Referral completed! Referrer rewarded.');
    } catch (error) {
      console.error('Failed to complete referral:', error);
      // Non-blocking - don't fail the transaction
    }
  }

  // ... rest of success handling ...
};
```

---

### Step 6: Display Referral Credits in Client Profile

**File:** `src/components/client-settings/sections/LoyaltySection.tsx` or similar

```typescript
// Fetch and display referral rewards
import { loyaltyRewardsDB } from '@/db/database';

const [referralCredits, setReferralCredits] = useState<LoyaltyReward[]>([]);

useEffect(() => {
  const loadReferralCredits = async () => {
    const rewards = await loyaltyRewardsDB.getByClientId(clientId);
    const credits = rewards.filter(r => r.earnedFrom === 'referral' && !r.redeemedAt);
    setReferralCredits(credits);
  };
  loadReferralCredits();
}, [clientId]);

// Display
{referralCredits.length > 0 && (
  <div className="p-4 bg-green-50 rounded-lg">
    <h4 className="font-medium text-green-800">Referral Credits</h4>
    {referralCredits.map(credit => (
      <div key={credit.id} className="flex justify-between mt-2">
        <span>{credit.description}</span>
        <span className="font-bold">${credit.value}</span>
      </div>
    ))}
  </div>
)}
```

---

### Step 7: Allow Redemption of Referral Credits at Checkout

**File:** `src/components/checkout/QuickCheckout.tsx`

```typescript
// Add to existing discount options
const [selectedReferralCredit, setSelectedReferralCredit] = useState<LoyaltyReward | null>(null);

// Fetch available credits
const [availableCredits, setAvailableCredits] = useState<LoyaltyReward[]>([]);

useEffect(() => {
  if (client?.id) {
    loyaltyRewardsDB.getByClientId(client.id).then(rewards => {
      setAvailableCredits(rewards.filter(r =>
        r.earnedFrom === 'referral' && !r.redeemedAt
      ));
    });
  }
}, [client?.id]);

// Display credit selection
{availableCredits.length > 0 && (
  <div className="mt-4 p-3 bg-green-50 rounded-lg">
    <label className="text-sm font-medium text-green-800">
      Apply Referral Credit
    </label>
    <select
      value={selectedReferralCredit?.id || ''}
      onChange={(e) => {
        const credit = availableCredits.find(c => c.id === e.target.value);
        setSelectedReferralCredit(credit || null);
      }}
      className="w-full mt-1 px-3 py-2 border rounded-lg"
    >
      <option value="">Select credit to apply</option>
      {availableCredits.map(credit => (
        <option key={credit.id} value={credit.id}>
          ${credit.value} - {credit.description}
        </option>
      ))}
    </select>
  </div>
)}

// Apply to total
const creditDiscount = selectedReferralCredit?.value || 0;

// Mark as redeemed after payment
if (selectedReferralCredit) {
  await loyaltyRewardsDB.update(selectedReferralCredit.id, {
    redeemedAt: new Date().toISOString(),
  });
}
```

---

## Testing Checklist

- [ ] Generate referral code for existing client
- [ ] Copy/share referral code
- [ ] New client signs up with referral code
- [ ] New client sees 15% discount at checkout
- [ ] After payment, referrer receives $25 credit
- [ ] Referrer can view referral history
- [ ] Referrer can redeem $25 credit at checkout
- [ ] Expired referrals (>90 days) don't apply discount
- [ ] Same client can't be referred twice

---

## File References

| Purpose | File Path |
|---------|-----------|
| Configuration | `src/constants/referralConfig.ts` |
| Redux Thunks | `src/store/slices/clientsSlice.ts` |
| Database Ops | `src/db/database.ts` (referralsDB, loyaltyRewardsDB) |
| Types | `src/types/client.ts` (Referral, LoyaltyReward) |
| UI Card | `src/components/client-settings/components/ReferralTrackingCard.tsx` |
| Tests | `src/tests/referralSystem.test.ts` |
| Checkout | `src/components/checkout/QuickCheckout.tsx` |
| Client Modal | `src/components/Book/QuickClientModal.tsx` |

---

## Notes

- Referral codes are stored in `client.loyaltyInfo.referralCode`
- Referrer ID stored in referred client's `loyaltyInfo.referredBy`
- Rewards stored as `LoyaltyReward` with `earnedFrom: 'referral'`
- All settings configurable in `DEFAULT_REFERRAL_SETTINGS`
