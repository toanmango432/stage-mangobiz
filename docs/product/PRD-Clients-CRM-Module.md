# Mango Biz — Clients (CRM) Module PRD
## Updated Section for mango-biz-prd-v4.md

**Version:** 4.2  
**Updated:** December 2025  
**Status:** Ready for Development  

> **Instructions:** Replace section `2.3 Clients (CRM)` in `mango-biz-prd-v4.md` (lines 363-456) with this content.

---

#### 2.3 Clients (CRM)

**Purpose:** Complete client database, relationship management, safety compliance, and loyalty program

**Key Features:**

---

##### 2.3.1 Client Profiles

**Personal Information**
- First name, last name, preferred name (display name)
- Email address (primary)
- Phone numbers (mobile - primary, home - secondary)
- Birthday and anniversary dates
- Gender and pronouns
- Address (street, city, state, postal code, country)
- Profile photo/avatar (URL or uploaded)
- Preferred language

**Emergency Contacts** *(New)*
- Contact name
- Relationship (spouse, parent, friend, etc.)
- Phone number
- Email (optional)
- Notes (e.g., "Call only in emergency")

**Preferences & Notes**
- Favorite staff members (multi-select)
- Preferred services (multi-select)
- Service preferences (free text, e.g., "prefers quiet during service")
- Allergies and sensitivities *(displayed as prominent alert)*
- Product preferences and dislikes
- Private staff notes (not visible to client)
- **Internal notes** (staff-only, unlimited entries)

**Staff Alert** *(New - High Visibility)*
> A single, prominently displayed alert for critical client information.

- **One alert per client** (separate from regular notes)
- Displayed on client card across all views (calendar, checkout, profile)
- Alert badge/icon on calendar appointment blocks
- Yellow/orange background for high visibility
- Exportable with client list
- **Use cases:** VIP treatment, special requests, behavioral notes, payment issues

**Consent & Privacy**
- SMS opt-in status with timestamp
- Email opt-in status with timestamp
- Marketing consent (separate from transactional)
- Photo consent (for social media/portfolio)
- GDPR/CCPA compliance flags
- Do-not-contact flag
- Preferred communication channel (SMS, Email, Both, None)
- Unsubscribe history with timestamps

---

##### 2.3.2 Client Blocking *(New)*

**Purpose:** Prevent problematic clients from booking online while preserving their history.

**Block Configuration**
- **Block Reasons** (dropdown selection):
  - `no_show` - Repeated no-shows
  - `late_cancellation` - Frequent late cancellations
  - `inappropriate_behavior` - Behavioral issues
  - `non_payment` - Payment/fraud issues
  - `other` - Custom reason (requires note)
- Block reason note (free text for context)
- Blocked by (staff ID who blocked)
- Blocked at (timestamp)

**Block Behavior**
- ✅ Blocked clients CANNOT book online (Mango Store, Client App)
- ✅ Client sees "Time slot unavailable" message (NOT told they're blocked)
- ✅ Blocked status badge displayed on client profile
- ✅ Blocked indicator on calendar appointments
- ✅ Manual booking allowed with warning override (staff discretion)
- ✅ Block/unblock directly from appointment on calendar
- ✅ Unblock available anytime (restores online booking)
- ✅ Block action logged in audit trail

**Bulk Block**
- Select multiple clients from list
- Apply single block reason to all
- Confirmation modal with count

---

##### 2.3.3 Safety & Compliance

**Allergy Information**
- Dedicated allergy field (prominently displayed)
- Displayed as warning badge on calendar appointments
- Shown during checkout
- Required field option per service category

**Patch Test Tracking** *(New)*

> For services requiring allergy tests (hair color, lash extensions, chemical peels, etc.)

**Patch Test Record**
- Client ID (linked)
- Service ID or Service Category
- Test date
- Result: `pass` | `fail` | `pending`
- Expiration date (calculated from test date + validity period)
- Performed by (staff ID)
- Notes (reaction details, etc.)

**Service Configuration** (add to Service entity)
- `requiresPatchTest: boolean` - Service requires valid patch test
- `patchTestValidityDays: number` - Days until retest required (default: 180)
- `patchTestServiceId: string` - Optional linked patch test service

**Booking Validation**
- ✅ Block booking if patch test required but missing
- ✅ Block booking if patch test expired
- ✅ Warning if patch test expires within 7 days of appointment
- ✅ Auto-prompt to book patch test appointment first

---

##### 2.3.4 Consultation Forms *(New)*

**Purpose:** Collect client information, consent, and health data before or during appointments.

**Form Types**
- **Automatic Forms:** Linked to services, sent automatically before appointment
- **Manual Forms:** Added to any appointment or client on-demand

**Form Template Configuration**
- Template name
- Description (internal)
- Send mode: `automatic` | `manual`
- Frequency (for automatic): `every_time` | `once`
- Linked services (for automatic forms)
- Requires signature: `true` | `false`
- Active status
- Sections (ordered list)

**Form Section Types**

| Section Type | Description | Configuration |
|--------------|-------------|---------------|
| `client_details` | Pre-filled from profile | Select fields: name, email, phone, address, birthday |
| `text_input` | Single or multi-line text | Label, placeholder, required, multiline |
| `single_choice` | Radio buttons | Label, options array, required |
| `multi_choice` | Checkboxes | Label, options array, required, min/max selections |
| `date_picker` | Date selection | Label, required, min/max date constraints |
| `number_input` | Numeric value | Label, required, min/max value |
| `file_upload` | Document/image upload | Label, required, accepted types (jpg, png, pdf) |
| `signature` | Electronic signature | Label, signature type: `draw` | `type` | `both` |
| `consent_checkbox` | Legal consent | Label, consent text, required |
| `info_text` | Display-only text | Content (markdown supported) |

**Form Delivery**
- Email with secure link (24-hour expiry)
- SMS with short link
- In-app notification (Mango Client App)
- Send X hours/days before appointment (configurable)
- Reminder if not completed (configurable interval)

**Form Completion**
- Client completes via secure web form (mobile-optimized)
- Staff can complete on behalf of client (in-store)
- Draft save (client can resume later)
- Completion timestamp and IP logged

**Electronic Signature**
- Draw signature (touch/mouse)
- Type signature (rendered in script font)
- Signature captured as image (PNG)
- Timestamp and IP address recorded
- Cannot be edited after submission

**Form Management**
- View all form requests per client
- Filter by: Pending, Completed, Expired
- Resend form link
- Print completed form (PDF)
- Form responses stored securely (encrypted)
- Retention period: Configurable (default: 7 years)

**Form Templates Library**
- COVID-19 Health Screening (pre-built)
- Hair Color Consultation (pre-built)
- Lash Extension Consent (pre-built)
- Medical History (pre-built)
- Photo Release Waiver (pre-built)
- Custom templates (create from scratch)

---

##### 2.3.5 Visit History

**Appointment History**
- Complete appointment history with dates and services
- Staff who performed each service
- Service duration (actual vs. scheduled)
- Appointment status (completed, no-show, cancelled, etc.)
- Notes from each visit
- Photos (before/after if applicable)
- Filter by: All, Completed, No-shows, Cancelled

**Sales History**
- All transactions with date and ticket number
- Itemized services and products
- Payment methods used
- Discounts applied
- Tips received (per staff)
- Filter by: All, Paid, Unpaid, Refunded

**Products Purchased**
- Product name and category
- Purchase date and quantity
- Price paid
- Associated appointment (if any)

**Patch Test History** *(New)*
- All patch tests with results
- Expiration dates
- Quick view of current validity per service

**Form History** *(New)*
- All submitted forms
- Submission date
- View/print completed forms

---

##### 2.3.6 Client Wallet *(Enhanced)*

**Purpose:** Unified view of client's financial relationship with the business.

**Wallet Dashboard** (in client profile)
- **Available Balance:** Total spendable amount (combined)
  - Gift card balance
  - Store credit / prepaid credits
  - Refund credits
- **Gift Card Balance:** Remaining value on active gift cards
  - List of gift cards with individual balances
  - Expiration dates
  - Redemption history
- **Upfront Payments:** *(New)*
  - Deposits tied to future appointments
  - Status: Active, Applied, Refunded
  - Appointment link
- **Saved Payment Card:**
  - Last 4 digits
  - Card type (Visa, MC, Amex)
  - Expiry date
  - One card at a time (new card replaces old)
  - Client can update via Mango Client App
- **Loyalty Rewards:** *(New)*
  - Available rewards from loyalty program
  - Reward type, value, expiration
  - Redemption button (for checkout)

**Wallet Actions**
- Add store credit (manual adjustment with reason)
- Issue refund to wallet
- View transaction history
- Configure upfront payment requirements per client

**Per-Client Settings**
- Require upfront payment: `always` | `for_new_clients` | `never`
- Require card on file: `true` | `false`
- Override store defaults

---

##### 2.3.7 Loyalty Program *(Enhanced)*

**Purpose:** Reward clients for repeat visits, spending, and referrals.

**Program Configuration** (Admin Portal → Settings → Loyalty)

**Points System**
- Points per dollar spent (e.g., 1 point per $1)
- Eligible items: Services, Products, Memberships, Packages (configurable)
- Include taxes in calculation: `true` | `false`
- Points expiration: Never, or X months from earning
- Bonus points events (e.g., double points Tuesdays)

**Tier System**
- Tier names (e.g., Bronze, Silver, Gold, Platinum)
- Tier thresholds (spend or points-based)
  - Bronze: $0+
  - Silver: $500+
  - Gold: $1,500+
  - Platinum: $5,000+
- Tier benefits per level (configurable)
- Tier evaluation period: Lifetime | Rolling 12 months

**Rewards Configuration**

| Reward Type | Description | Configuration |
|-------------|-------------|---------------|
| `amount_discount` | Fixed dollar discount | Value, min spend, eligible items |
| `percentage_discount` | Percentage off | Percentage, max value, eligible items |
| `free_service` | Complimentary service | Service ID, min spend |
| `free_product` | Complimentary product | Product ID, min spend |

**Reward Settings**
- Points required to claim
- Tier required (optional)
- Expiration after claiming (days)
- Stackable with other offers: `true` | `false`
- In-store only: `true` | `false`
- Limit per client (e.g., 1 per month)

**Client Loyalty View** (in client profile)
- Current tier and progress to next
- Points balance
- Points history (earned, redeemed, expired)
- Available rewards
- Manual point adjustment (add/deduct with reason)
- Exclude from loyalty program (opt-out)

**Automated Notifications**
- Points earned summary (weekly/monthly)
- Tier achieved notification
- Rewards expiring soon
- Welcome to new tier email

---

##### 2.3.8 Referral Program *(Enhanced)*

**Purpose:** Incentivize clients to refer friends.

**Referral Configuration**
- Referral link generation per client
- Referral link via: SMS, Email, Social share
- Referrer reward (when friend completes first appointment)
- Referred friend reward (first booking incentive)
- Referral limit: Unlimited or X per month

**Referral Tracking**
- Referrer client ID
- Referred client ID
- Referral link used
- First appointment date
- Reward issued: `true` | `false`
- Reward type and value

**Referral Rewards**
- Same reward types as loyalty (discounts, free items)
- Auto-apply to wallet after qualified action
- Notification sent to both parties

**Referral Dashboard** (Admin Portal)
- Total referrals this month/quarter/year
- Top referrers leaderboard
- Conversion rate (clicked → booked)
- Revenue from referred clients

**Business Rules**
- ✅ New Client Marketplace Fees waived for referral bookings
- ✅ Friend must complete first appointment for reward
- ✅ Referrer reward issued automatically
- ✅ Cannot self-refer (same email/phone detection)

---

##### 2.3.9 Client Reviews *(New)*

**Purpose:** Collect and display client feedback for reputation management.

**Review Collection**
- Auto-request after appointment (configurable delay: 2-24 hours)
- Review link via: Email, SMS, In-app notification
- Link to Google, Yelp, Facebook (configurable)
- Internal review option (not public)

**Review Display** (in client profile)
- Average rating (1-5 stars)
- Total review count
- Recent reviews list
- Reply to reviews (for public platforms)

**Review Analytics**
- Average rating by staff member
- Rating trends over time
- Sentiment analysis (future: AI-powered)

---

##### 2.3.10 Client Segmentation

**Default Segments**
- **Active:** Visited within last 60 days
- **At-Risk:** 60-90 days since last visit
- **Lapsed:** 90+ days since last visit
- **VIP:** Top 10% by lifetime spend
- **New:** First visit within last 30 days
- **Member:** Has active membership
- **Blocked:** Currently blocked from booking

**Custom Segments**
- Create based on any criteria:
  - Visit frequency
  - Spend thresholds
  - Service categories booked
  - Product categories purchased
  - Location
  - Tags
  - Loyalty tier
  - Referral source

**Segment Actions**
- Export segment to CSV/Excel
- Send blast message (SMS/Email)
- Add tag to all in segment
- Create marketing campaign targeting segment

---

##### 2.3.11 Client Analytics

**Individual Client Metrics**
- **Client Lifetime Value (LTV):** Total lifetime spend + projected future
- **Visit Frequency:** Average days between visits
- **Average Ticket Value:** Total spend ÷ Total visits
- **Retention Rate:** Return within 90 days
- **No-Show Rate:** No-shows ÷ Total bookings
- **Cancellation Rate:** Cancellations ÷ Total bookings

**Aggregate Reports** (see Reports module)
- New vs. returning clients
- Client acquisition by referral source
- Churn rate and reasons
- Cohort retention analysis
- Top spenders list

---

##### 2.3.12 Client List Management

**Import Clients**
- CSV/Excel upload
- Column mapping wizard
- Duplicate detection (by email or phone)
- Preview before import
- Invalid row handling:
  - Download invalid rows
  - Fix and re-upload
- Merge with existing on match

**Export Clients**
- Export to CSV, Excel, PDF
- Select fields to include
- Filter before export (by segment, date range, etc.)
- Include: Staff alerts, notes (optional)
- **Permission required:** "Can download clients"

**Bulk Actions** *(New)*
- Select multiple clients (checkbox)
- Select all (with filters applied)
- **Available actions:**
  - Bulk Delete (soft delete/archive)
  - Bulk Block (single reason for all)
  - Bulk Unblock
  - Bulk Add Tag
  - Bulk Remove Tag
  - Bulk Export
  - Bulk Send Message (SMS/Email)

**Merge Duplicate Profiles**
- Auto-detect duplicates (same email or phone)
- Manual merge (select clients to merge)
- Choose primary profile (name, contact to keep)
- Combine: Appointments, sales, notes, loyalty points
- ⚠️ Merge cannot be undone
- Audit log entry created

---

##### 2.3.13 Client Actions Summary

| Action | Description | Permission Required |
|--------|-------------|---------------------|
| Create Client | Add new client profile | Clients: Edit |
| Edit Client | Update client information | Clients: Edit |
| View Client | View profile and history | Clients: View |
| Delete Client | Soft delete (archive) | Clients: Delete |
| Block Client | Prevent online booking | Clients: Edit |
| Unblock Client | Restore online booking | Clients: Edit |
| Merge Profiles | Combine duplicate clients | Clients: Edit |
| Add Staff Alert | Set prominent alert | Clients: Edit |
| Add Note | Add internal note | Clients: Edit |
| Record Patch Test | Log patch test result | Clients: Edit |
| Send Form | Send consultation form | Forms: Send |
| Complete Form | Fill form for client | Forms: Complete |
| Book Appointment | Create appointment | Scheduling: Create |
| Send Message | Send SMS/Email | Marketing: Send |
| Add to Segment | Tag for marketing | Marketing: Edit |
| Adjust Points | Add/deduct loyalty points | Loyalty: Manage |
| Add Reward | Manually add reward | Loyalty: Manage |
| Export Data | GDPR data export | Clients: Export |

---

##### 2.3.14 Business Rules

- ✅ Duplicate detection on creation (by phone or email)
- ✅ SMS requires explicit opt-in consent
- ✅ No-show history tracked and visible
- ✅ At-risk clients flagged automatically
- ✅ Birthday automation eligible when birthday entered
- ✅ Blocked clients cannot book online (see "Time slot unavailable")
- ✅ Patch test validation prevents booking if expired/missing
- ✅ Form completion tracked and stored securely
- ✅ Loyalty points calculated automatically at checkout
- ✅ Referral rewards issued when friend completes first appointment
- ✅ Client data export available for GDPR/CCPA compliance
- ✅ Merge action logged in audit trail (irreversible)
- ✅ Staff alerts exported with client list

---

##### 2.3.15 Permissions Matrix

| Feature | Owner | Manager | Front Desk | Technician | Marketing | Accountant |
|---------|-------|---------|------------|------------|-----------|------------|
| View clients | ✓ | ✓ | ✓ | Own only | Segments | ✗ |
| Edit clients | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Block/Unblock | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Merge profiles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Add staff alert | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View contact info | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Export clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Import clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage forms | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Send forms | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Complete forms | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View form responses | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Record patch tests | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage loyalty | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Adjust points | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Bulk actions | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Send messages | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |

---

##### 2.3.16 Data Storage (Offline Considerations)

| Data | Local (IndexedDB) | Cloud (PostgreSQL) | Sync Priority |
|------|-------------------|-------------------|---------------|
| Client profiles | ✓ | ✓ | NORMAL |
| Block status | ✓ | ✓ | CRITICAL |
| Staff alerts | ✓ | ✓ | HIGH |
| Allergies | ✓ | ✓ | HIGH |
| Patch tests | ✓ | ✓ | HIGH |
| Loyalty points | ✓ | ✓ | HIGH |
| Rewards | ✓ | ✓ | HIGH |
| Visit history | ✓ | ✓ | NORMAL |
| Form templates | Cached | ✓ | LOW |
| Completed forms | ✗ | ✓ | NORMAL (write-only) |
| Wallet balance | ✓ | ✓ | HIGH |

**Offline Behavior:**
- ✅ Client search works offline
- ✅ Block status enforced offline (cannot override online check)
- ✅ Staff alerts displayed offline
- ✅ Loyalty points visible and redeemable offline
- ✅ Form completion queued for sync when online
- ✅ Patch test validation works offline

---

##### 2.3.17 Integrations

| Integration | Purpose | Data Flow |
|-------------|---------|-----------|
| Mango Store | Online booking | Block status → prevents booking |
| Mango Client App | Client self-service | Profile, wallet, loyalty, forms |
| Mango Marketing | Campaigns | Segments, consent, contact info |
| Mango Check-In | Kiosk check-in | Client lookup, form prompts |
| Mango Pad | Checkout display | Loyalty points, wallet balance |
| Mango Payment | Card storage | Saved payment card token |

---

##### 2.3.18 Implementation Notes for Dev Team

**Phase 1: Core Gaps (Q1 2026)** — 6 weeks
1. Client Blocking (2 weeks)
   - Add `isBlocked`, `blockedAt`, `blockedBy`, `blockReason` to Client model
   - Block UI in client profile
   - Booking validation check
   - Bulk block functionality

2. Staff Alerts (1 week)
   - Add `staffAlert` object to Client model
   - Alert display component (yellow card)
   - Calendar appointment badge

3. Emergency Contacts (1 week)
   - Add `emergencyContacts` array to Client model
   - Profile UI section

4. Bulk Actions (2 weeks)
   - Client list multi-select UI
   - Action handlers for each bulk action

**Phase 2: Forms System (Q2 2026)** — 9 weeks
1. Form Builder (3 weeks)
   - FormTemplate model
   - FormSection model with type variants
   - Template editor UI

2. Form Delivery (2 weeks)
   - Email/SMS trigger system
   - Form completion portal (web)

3. Form Completion (2 weeks)
   - ClientFormResponse model
   - Client-facing form renderer
   - Staff completion override

4. E-Signatures (1 week)
   - Signature capture component
   - Image storage

5. Patch Test Integration (1 week)
   - PatchTest model
   - Service configuration flags
   - Booking validation

**Phase 3: Loyalty Enhancement (Q3 2026)** — 7 weeks
1. Loyalty Configuration (2 weeks)
   - LoyaltyProgram settings model
   - Points rules engine

2. Rewards System (2 weeks)
   - Reward model
   - Checkout integration

3. Referral Program (2 weeks)
   - Referral model
   - Link generation
   - Tracking dashboard

4. Wallet UI (1 week)
   - Wallet tab in client profile
   - All balance types displayed

**Phase 4: Polish (Q4 2026)** — 3 weeks
1. Client Reviews (2 weeks)
2. Import/Export Enhancements (1 week)

---

*End of Clients (CRM) Module Specification*
