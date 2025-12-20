# Review Collection System - Full Implementation Guide

> **Status:** Backend Complete | Frontend Integration Pending
> **Last Updated:** December 3, 2025
> **To Resume:** Tell Claude "implement review system frontend from REVIEW_SYSTEM_IMPLEMENTATION.md"

---

## Quick Summary

| Component | Status | Location |
|-----------|--------|----------|
| Config & Utilities | Done | `src/constants/reviewConfig.ts` |
| Types | Done | `src/types/client.ts` (ReviewRequest, ReviewRequestStatus) |
| Database Schema | Done | `src/db/schema.ts` (version 11, reviewRequests table) |
| Database Operations | Done | `src/db/database.ts` (reviewRequestsDB) |
| Redux Thunks | Done | `src/store/slices/clientsSlice.ts` |
| UI Components | Done | `src/components/client-settings/components/ClientReviewsCard.tsx` |
| Tests | Done | `src/tests/reviewSystem.test.ts` (34 tests) |
| Frontend Integration | Pending | See steps below |

---

## How It Works

```
+---------------------------------------------------------------------------+
|                         REVIEW COLLECTION FLOW                              |
+---------------------------------------------------------------------------+
|                                                                            |
|  1. CLIENT CHECKS OUT --> System creates ReviewRequest (pending)           |
|                                                                            |
|  2. AFTER 2 HOURS --> System sends review invitation (email/sms)           |
|                   --> Status: 'sent'                                       |
|                                                                            |
|  3. CLIENT OPENS LINK --> Status: 'opened'                                 |
|                                                                            |
|  4. CLIENT SUBMITS REVIEW --> Creates ClientReview                         |
|                           --> Status: 'completed'                          |
|                           --> Updates client.averageRating                 |
|                                                                            |
|  5. IF 4+ STARS --> Prompt to share on Google/Yelp/Facebook                |
|                                                                            |
|  6. IF NO RESPONSE (24h) --> Send reminder (max 1)                         |
|                                                                            |
|  7. IF 7 DAYS PASS --> Request expires                                     |
|                                                                            |
+---------------------------------------------------------------------------+
```

---

## Default Settings

```typescript
// From src/constants/reviewConfig.ts
{
  autoRequestEnabled: true,       // Auto-send after checkout
  requestDelayHours: 2,           // Send 2 hours after checkout
  maxRequestsPerMonth: 2,         // Max 2 requests per client/month
  minRatingForExternalShare: 4,   // Show "Share on Google" for 4+ stars
  externalPlatforms: ['google', 'yelp'],
  smsEnabled: true,               // Enable SMS requests
  emailEnabled: true,             // Enable email requests
  reminderDelayHours: 24,         // Reminder after 24 hours
  maxReminders: 1,                // Max 1 reminder
}
```

---

## Backend Implementation (Complete)

### Available Redux Thunks

```typescript
import {
  createReviewRequest,
  sendReviewRequest,
  markReviewRequestOpened,
  completeReviewRequest,
  sendReviewReminder,
  fetchReviewRequests,
  processExpiredReviewRequests,
} from '@/store/slices/clientsSlice';

// 1. Create review request after checkout
dispatch(createReviewRequest({
  salonId: 'salon-123',
  clientId: 'client-456',
  clientName: 'John Smith',
  clientEmail: 'john@example.com',
  clientPhone: '555-1234',
  appointmentId: 'appt-789',
  staffId: 'staff-abc',
  staffName: 'Jane Stylist',
}));

// 2. Mark request as sent (after sending email/sms)
dispatch(sendReviewRequest({
  requestId: 'request-123',
  sentVia: 'email' // or 'sms' or 'both'
}));

// 3. When client opens review link
dispatch(markReviewRequestOpened({
  requestId: 'request-123'
}));

// 4. When client submits review
dispatch(completeReviewRequest({
  requestId: 'request-123',
  rating: 5,
  comment: 'Great service!'
}));

// 5. Send reminder for outstanding requests
dispatch(sendReviewReminder({
  requestId: 'request-123'
}));

// 6. Fetch all review requests for dashboard
dispatch(fetchReviewRequests({
  salonId: 'salon-123',
  status: 'sent' // optional: filter by status
}));

// 7. Process and mark expired requests
dispatch(processExpiredReviewRequests({
  salonId: 'salon-123'
}));
```

### Database Operations

```typescript
import { reviewRequestsDB, clientReviewsDB } from '@/db/database';

// Review Requests
const request = await reviewRequestsDB.create(requestData);
const request = await reviewRequestsDB.getById(id);
const requests = await reviewRequestsDB.getByClientId(clientId);
const requests = await reviewRequestsDB.getBySalonId(salonId);
const requests = await reviewRequestsDB.getByStatus(salonId, 'sent');
const request = await reviewRequestsDB.getByAppointmentId(appointmentId);
const updated = await reviewRequestsDB.markSent(id, 'email');
const updated = await reviewRequestsDB.markOpened(id);
const updated = await reviewRequestsDB.markCompleted(id, reviewId);
const updated = await reviewRequestsDB.markExpired(id);
const updated = await reviewRequestsDB.addReminder(id);
const count = await reviewRequestsDB.countRecentByClient(clientId, 30);

// Client Reviews
const review = await clientReviewsDB.create(reviewData);
const reviews = await clientReviewsDB.getByClientId(clientId);
const reviews = await clientReviewsDB.getByStaffId(staffId);
const updated = await clientReviewsDB.addResponse(id, 'Thank you!');
```

### Utility Functions

```typescript
import {
  canRequestReview,
  calculateExpirationDate,
  generateReviewMessage,
  generateReviewLink,
  calculateReviewAnalytics,
  shouldPromptExternalShare,
  getStarDisplay,
  getRatingLabel,
  getExternalReviewUrl,
} from '@/constants/reviewConfig';

// Check if client can receive another review request
const canSend = canRequestReview(recentRequests, settings);

// Calculate expiration date (default 7 days)
const expiresAt = calculateExpirationDate(new Date());

// Generate personalized message
const message = generateReviewMessage(template, {
  clientName: 'John',
  salonName: 'Best Salon',
  serviceName: 'Haircut',
  staffName: 'Jane',
  reviewLink: 'https://review.link/123',
});

// Calculate analytics for dashboard
const analytics = calculateReviewAnalytics(reviews);
// Returns: { averageRating, totalReviews, ratingDistribution, responseRate, platformBreakdown, recentTrend }

// Check if should prompt for external sharing
if (shouldPromptExternalShare(rating)) {
  // Show Google/Yelp buttons
}

// Display helpers
const stars = getStarDisplay(4.5); // "****1/2"
const label = getRatingLabel(4.5); // "Excellent"

// Get external review URL
const googleUrl = getExternalReviewUrl('google', placeId);
```

---

## Frontend Integration Steps (Pending)

### Step 1: Auto-Create Review Request After Checkout

**File:** `src/components/checkout/QuickCheckout.tsx`

```typescript
import { createReviewRequest } from '@/store/slices/clientsSlice';
import { DEFAULT_REVIEW_SETTINGS } from '@/constants/reviewConfig';

// In payment success handler
const handlePaymentSuccess = async () => {
  // ... existing payment logic ...

  // Auto-create review request if enabled
  if (DEFAULT_REVIEW_SETTINGS.autoRequestEnabled && client) {
    try {
      await dispatch(createReviewRequest({
        salonId: ticket.salonId,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        clientPhone: client.phone,
        appointmentId: ticket.appointmentId,
        staffId: ticket.services[0]?.staffId,
        staffName: ticket.services[0]?.staffName,
      })).unwrap();
      console.log('Review request created');
    } catch (error) {
      // Non-blocking - don't fail checkout
      console.log('Could not create review request:', error);
    }
  }

  // ... rest of success handling ...
};
```

---

### Step 2: Create Review Request Dashboard

**File:** `src/components/reviews/ReviewRequestDashboard.tsx`

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchReviewRequests, sendReviewRequest, processExpiredReviewRequests } from '@/store/slices/clientsSlice';
import { reviewRequestsDB } from '@/db/database';

const ReviewRequestDashboard = () => {
  const dispatch = useAppDispatch();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [filter, setFilter] = useState<ReviewRequestStatus | 'all'>('all');

  useEffect(() => {
    loadRequests();
    // Process expired requests on mount
    dispatch(processExpiredReviewRequests({ salonId }));
  }, [salonId]);

  const loadRequests = async () => {
    const result = await dispatch(fetchReviewRequests({
      salonId,
      status: filter !== 'all' ? filter : undefined,
    })).unwrap();
    setRequests(result);
  };

  const handleSendRequest = async (requestId: string) => {
    await dispatch(sendReviewRequest({
      requestId,
      sentVia: 'email', // or based on client preference
    }));
    loadRequests();
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'sent', 'completed', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={filter === status ? 'bg-blue-500 text-white' : 'bg-gray-100'}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Request list */}
      {requests.map(request => (
        <div key={request.id} className="p-4 border rounded mb-2">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{request.clientName}</p>
              <p className="text-sm text-gray-500">
                Created: {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>
          </div>
          {request.status === 'pending' && (
            <button
              onClick={() => handleSendRequest(request.id)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Send Now
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

### Step 3: Create Review Submission Page (Client-Facing)

**File:** `src/pages/ReviewPage.tsx`

```typescript
import { completeReviewRequest } from '@/store/slices/clientsSlice';
import { shouldPromptExternalShare, getExternalReviewUrl, DEFAULT_REVIEW_SETTINGS } from '@/constants/reviewConfig';

const ReviewPage = () => {
  const { requestId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showExternalPrompt, setShowExternalPrompt] = useState(false);

  useEffect(() => {
    // Mark as opened when client lands on page
    dispatch(markReviewRequestOpened({ requestId: requestId! }));
  }, [requestId]);

  const handleSubmit = async () => {
    await dispatch(completeReviewRequest({
      requestId: requestId!,
      rating,
      comment,
    })).unwrap();

    setSubmitted(true);

    // Check if should prompt for external sharing
    if (shouldPromptExternalShare(rating)) {
      setShowExternalPrompt(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
        <p>Your feedback helps us improve.</p>

        {showExternalPrompt && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="font-medium">Love us? Share the love!</p>
            <div className="flex gap-4 mt-4 justify-center">
              {DEFAULT_REVIEW_SETTINGS.externalPlatforms.map(platform => (
                <a
                  key={platform}
                  href={getExternalReviewUrl(platform, 'YOUR_PLACE_ID')}
                  target="_blank"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Review on {platform}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">How was your visit?</h2>

      {/* Star Rating */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-4xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us about your experience..."
        className="w-full p-3 border rounded h-32 mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="w-full py-3 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Submit Review
      </button>
    </div>
  );
};
```

---

### Step 4: Add Review Analytics to Client Dashboard

**File:** `src/components/client-settings/components/ClientReviewsCard.tsx`

The `ClientReviewsCard` component already exists. Enhance it with:

```typescript
import { calculateReviewAnalytics, getStarDisplay, getRatingLabel } from '@/constants/reviewConfig';

// In component
const analytics = calculateReviewAnalytics(reviews);

// Display
<div className="grid grid-cols-3 gap-4">
  <div>
    <p className="text-3xl font-bold">{analytics.averageRating}</p>
    <p className="text-sm text-gray-500">{getStarDisplay(analytics.averageRating)}</p>
    <p className="text-xs">{getRatingLabel(analytics.averageRating)}</p>
  </div>
  <div>
    <p className="text-3xl font-bold">{analytics.totalReviews}</p>
    <p className="text-sm text-gray-500">Total Reviews</p>
  </div>
  <div>
    <p className="text-3xl font-bold">{analytics.responseRate}%</p>
    <p className="text-sm text-gray-500">Response Rate</p>
  </div>
</div>

{/* Rating Distribution Bar */}
<div className="mt-4">
  {[5, 4, 3, 2, 1].map(rating => (
    <div key={rating} className="flex items-center gap-2 mb-1">
      <span className="w-4">{rating}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded">
        <div
          className="h-full bg-yellow-400 rounded"
          style={{ width: `${(analytics.ratingDistribution[rating] / analytics.totalReviews) * 100}%` }}
        />
      </div>
      <span className="w-8 text-sm text-right">{analytics.ratingDistribution[rating]}</span>
    </div>
  ))}
</div>
```

---

### Step 5: Create Background Job for Sending Reviews

**File:** `src/utils/reviewScheduler.ts`

```typescript
import { reviewRequestsDB } from '@/db/database';
import { sendReviewEmail, sendReviewSMS } from '@/services/notifications';
import { DEFAULT_REVIEW_SETTINGS, generateReviewMessage, generateReviewLink } from '@/constants/reviewConfig';

/**
 * Process pending review requests that are ready to send
 * Call this every 15 minutes via a scheduler or on app load
 */
export async function processPendingReviewRequests(salonId: string) {
  const pendingRequests = await reviewRequestsDB.getByStatus(salonId, 'pending');
  const now = new Date();

  for (const request of pendingRequests) {
    // Check if enough time has passed since creation
    const createdAt = new Date(request.createdAt);
    const delayMs = DEFAULT_REVIEW_SETTINGS.requestDelayHours * 60 * 60 * 1000;

    if (now.getTime() - createdAt.getTime() >= delayMs) {
      const reviewLink = generateReviewLink(request.id);
      const message = generateReviewMessage(DEFAULT_REVIEW_SETTINGS.requestMessageTemplate, {
        clientName: request.clientName,
        salonName: 'Your Salon Name', // Get from settings
        serviceName: 'your recent service',
        staffName: request.staffName || 'your stylist',
        reviewLink,
      });

      let sentVia: 'email' | 'sms' | 'both' = 'email';

      // Send via configured channels
      if (DEFAULT_REVIEW_SETTINGS.emailEnabled && request.clientEmail) {
        await sendReviewEmail(request.clientEmail, message);
      }
      if (DEFAULT_REVIEW_SETTINGS.smsEnabled && request.clientPhone) {
        await sendReviewSMS(request.clientPhone, message);
        sentVia = DEFAULT_REVIEW_SETTINGS.emailEnabled && request.clientEmail ? 'both' : 'sms';
      }

      await reviewRequestsDB.markSent(request.id, sentVia);
    }
  }
}

/**
 * Process requests that need reminders
 */
export async function processReviewReminders(salonId: string) {
  const needingReminder = await reviewRequestsDB.getNeedingReminder(salonId, DEFAULT_REVIEW_SETTINGS.maxReminders);
  const now = new Date();

  for (const request of needingReminder) {
    const sentAt = request.sentAt ? new Date(request.sentAt) : new Date(request.createdAt);
    const reminderDelayMs = DEFAULT_REVIEW_SETTINGS.reminderDelayHours * 60 * 60 * 1000;

    // Check if enough time has passed for a reminder
    const lastContactTime = request.lastReminderAt
      ? new Date(request.lastReminderAt)
      : sentAt;

    if (now.getTime() - lastContactTime.getTime() >= reminderDelayMs) {
      // Send reminder (reuse notification functions)
      // ...

      await reviewRequestsDB.addReminder(request.id);
    }
  }
}
```

---

### Step 6: Add Staff Response UI

**File:** `src/components/reviews/ReviewResponseModal.tsx`

```typescript
import { clientReviewsDB } from '@/db/database';

const ReviewResponseModal = ({ review, onClose, onSubmit }) => {
  const [response, setResponse] = useState('');

  const handleSubmit = async () => {
    await clientReviewsDB.addResponse(review.id, response);
    onSubmit();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-bold mb-4">Respond to Review</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">
            {review.clientName} - {getStarDisplay(review.rating)}
          </p>
          <p className="mt-1">{review.comment}</p>
        </div>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write your response..."
          className="w-full p-3 border rounded h-32 mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!response.trim()}
            className="flex-1 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send Response
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Testing Checklist

- [ ] Review request created after checkout
- [ ] Review request sent via email/SMS after delay
- [ ] Client can open review link
- [ ] Client can submit rating and comment
- [ ] Client prompted to share on Google for 4+ stars
- [ ] Reminder sent after 24 hours if no response
- [ ] Request expires after 7 days
- [ ] Staff can respond to reviews
- [ ] Analytics calculate correctly
- [ ] Max 2 requests per client per month enforced

---

## File References

| Purpose | File Path |
|---------|-----------|
| Configuration | `src/constants/reviewConfig.ts` |
| Types | `src/types/client.ts` (ReviewRequest, ClientReview) |
| Database Schema | `src/db/schema.ts` (version 11) |
| Database Operations | `src/db/database.ts` (reviewRequestsDB, clientReviewsDB) |
| Redux Thunks | `src/store/slices/clientsSlice.ts` |
| Tests | `src/tests/reviewSystem.test.ts` |
| Existing UI | `src/components/client-settings/components/ClientReviewsCard.tsx` |

---

## Notes

- Review requests are created in `pending` status
- Auto-send is configurable via `DEFAULT_REVIEW_SETTINGS.autoRequestEnabled`
- External sharing prompts only for 4+ star ratings
- Clients can receive max 2 review requests per month
- Reviews stored with platform info for analytics
