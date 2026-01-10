# PRD: Mango Check-In App

> Self-service kiosk application for salon and spa client check-in

**Version**: 1.0
**Last Updated**: 2026-01-09
**Author**: Product Team
**Status**: Draft
**Priority**: P1 (High)

---

## 1. Executive Summary

### Problem Statement

Walk-in clients and clients with appointments currently face friction when arriving at salons:

- **Front desk bottleneck**: Staff spend 2-3 minutes per client on check-in during peak hours, creating lobby congestion
- **Inconsistent data capture**: Manual entry leads to typos in phone numbers/emails, breaking future communication
- **Lost upsell opportunities**: Rushed check-ins skip service recommendations and loyalty engagement
- **No visibility for waiting clients**: Clients don't know their queue position or estimated wait time, leading to anxiety and walkouts

> *"On Saturdays, I have a line of 6 people waiting to check in while I'm also answering phones and processing payments. Something always gets missed."* — Front Desk Manager, nail salon

### Proposed Solution

**Mango Check-In**: A self-service kiosk/tablet application that allows clients to:
1. Identify themselves via phone number or QR code scan
2. Select services and preferred technicians
3. Add guests to their party
4. Receive real-time queue position and estimated wait time
5. Earn and view loyalty progress

**Target**: Returning clients complete check-in in **under 45 seconds**. New clients complete registration + check-in in **under 90 seconds**.

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Average check-in time (returning) | 2-3 min (manual) | < 45 sec | App analytics |
| Average check-in time (new) | 4-5 min (manual) | < 90 sec | App analytics |
| Front desk interruptions | 100% of check-ins | < 20% | Staff survey |
| Client data accuracy | ~85% | > 98% | Database audit |
| Walk-out rate during wait | ~8% | < 3% | POS correlation |
| Loyalty program awareness | ~40% | > 80% | Exit survey |

### Target Users

**Primary**: Walk-in clients at nail salons, hair salons, spas, and barbershops

**Secondary**:
- Clients with appointments (express check-in)
- Groups/parties checking in together
- Front desk staff (admin mode for assistance)

---

## 2. Background & Context

### Current State

Most salons handle check-in through one of these methods:

1. **Paper sign-in sheet**: Client writes name, staff manually enters into system
2. **Front desk verbal**: Staff asks questions, types into POS
3. **Basic tablet with form**: Generic form builder, no POS integration

**Pain Points**:
- High error rate in phone number entry (transposed digits)
- No service pre-selection, leading to longer conversations
- No queue visibility creates client anxiety
- Walk-ins during appointments create scheduling chaos
- Loyalty points are mentioned inconsistently

### Competitive Analysis

| Feature | Fresha | Booksy | Vagaro | Square | **Mango (Proposed)** |
|---------|--------|--------|--------|--------|---------------------|
| Self check-in kiosk | Limited | No | Basic | No | **Full-featured** |
| Phone lookup | Yes | Yes | Yes | No | **Yes** |
| QR code check-in | No | No | No | No | **Yes** |
| Real-time queue | No | No | No | No | **Yes** |
| Wait time estimate | No | No | No | No | **Yes** |
| Guest party support | No | No | No | No | **Yes** |
| Loyalty integration | Basic | Basic | Yes | No | **Deep** |
| Offline mode | No | No | No | Yes | **Yes** |
| Service recommendations | No | No | No | No | **Yes** |

### Strategic Alignment

- **Mango Vision**: "Effortless operations for beauty businesses"
- **2026 OKR**: Reduce front desk workload by 40%
- **Ecosystem Play**: Check-In App feeds real-time data to Store App, enabling better staff allocation and client flow management

---

## 3. User Stories & Use Cases

### Primary User Stories

#### US-1: Returning Client Walk-In
> As a **returning client**, I want to **check in using my phone number**, so that **I can skip the front desk line and start my wait immediately**.

**Acceptance Criteria**:
- Phone number lookup completes in < 2 seconds
- My name and preferences are recognized
- I can select services I want today
- I see my queue position immediately

#### US-2: New Client Registration
> As a **new client**, I want to **quickly register my basic info**, so that **I can check in without holding up the line**.

**Acceptance Criteria**:
- Registration requires only: first name, last name, phone, email (optional), zip code
- Form auto-formats phone number as I type
- Validation happens inline, not after submission
- I'm immediately checked in after registration

#### US-3: Appointment Check-In
> As a **client with an appointment**, I want to **scan my confirmation QR code**, so that **I can check in instantly without typing anything**.

**Acceptance Criteria**:
- QR scan identifies my appointment
- Shows appointment details for confirmation
- One-tap to confirm arrival
- Staff is notified immediately

#### US-4: Group Check-In
> As a **client bringing friends**, I want to **add guests to my check-in**, so that **we can be served together or in sequence**.

**Acceptance Criteria**:
- "Add Guest" option after my services selected
- Each guest can select their own services
- Option to request "serve together" or "serve in order"
- Single confirmation for entire party

#### US-5: Queue Visibility
> As a **waiting client**, I want to **see my position in the queue and estimated wait time**, so that **I can relax or step out briefly without losing my spot**.

**Acceptance Criteria**:
- Queue position updates in real-time
- Estimated wait time is reasonably accurate (±5 min)
- I can see how many people are ahead of me
- Optional SMS notification when I'm next

### Edge Cases

#### EC-1: No-Show Handling
- If client doesn't arrive within 15 minutes of appointment, prompt staff to mark as no-show
- No-show clients checking in late see: "Your appointment time has passed. Check in as walk-in?"

#### EC-2: Busy Period Warning
- When estimated wait exceeds 45 minutes, show warning before check-in completion
- Offer: "Would you like to book an appointment for later today instead?"

#### EC-3: Service Not Available
- If selected service requires unavailable technician, show alternatives
- "Sarah is fully booked. Would you like to see Jenny or wait for Sarah (est. 2 hours)?"

#### EC-4: Offline Mode
- Check-in continues working without internet
- Data syncs when connection restored
- Shows "Offline Mode" indicator subtly

#### EC-5: Accessibility Needs
- Client can request assistance via single button
- Staff receives notification to help at kiosk
- Large text mode available

---

## 4. Detailed Requirements

### 4.1 Functional Requirements

#### FR-1: Client Identification (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Phone number entry with numeric keypad (10-digit US format) | Must Have |
| FR-1.2 | Real-time phone formatting as user types: (XXX) XXX-XXXX | Must Have |
| FR-1.3 | Instant lookup against client database (< 2 sec) | Must Have |
| FR-1.4 | QR code scanning via device camera | Must Have |
| FR-1.5 | QR code supports: appointment confirmation, client profile link, loyalty card | Should Have |
| FR-1.6 | "Can't find my info" help option | Must Have |

#### FR-2: New Client Registration (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Required fields: First name, Last name, Phone number | Must Have |
| FR-2.2 | Optional fields: Email, Zip code | Must Have |
| FR-2.3 | Phone number validation (prevent duplicates, format check) | Must Have |
| FR-2.4 | Email validation (format check only) | Should Have |
| FR-2.5 | Zip code auto-lookup for city/state (informational) | Nice to Have |
| FR-2.6 | SMS opt-in consent checkbox (pre-checked, required disclosure) | Must Have |
| FR-2.7 | Privacy policy link (tap to view modal) | Must Have |

#### FR-3: Service Selection (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Display all active services grouped by category | Must Have |
| FR-3.2 | Show service name, duration, and price | Must Have |
| FR-3.3 | Multi-select capability (tap to add, tap to remove) | Must Have |
| FR-3.4 | Running total of selected services (price + duration) | Must Have |
| FR-3.5 | Service search/filter by name | Should Have |
| FR-3.6 | "Popular" or "Recommended" section based on client history | Should Have |
| FR-3.7 | Service photos/thumbnails | Nice to Have |
| FR-3.8 | Add-on services suggestion after main service selected | Should Have |

#### FR-4: Technician Selection (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | "Anyone Available" default option (recommended for fastest service) | Must Have |
| FR-4.2 | List technicians qualified for selected services | Must Have |
| FR-4.3 | Show technician photo, name, and current status | Must Have |
| FR-4.4 | Status indicators: Available (green), With Client (yellow), On Break (gray) | Must Have |
| FR-4.5 | Show estimated wait time per technician | Should Have |
| FR-4.6 | Remember client's preferred technician from history | Should Have |
| FR-4.7 | "Request" vs "Require" preference (request = if available, require = will wait) | Nice to Have |

#### FR-5: Guest/Party Check-In (Should Have - V1.1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | "Add Guest" button after primary client services selected | Should Have |
| FR-5.2 | Guest flow: Name only required (or phone if existing client) | Should Have |
| FR-5.3 | Each guest selects their own services independently | Should Have |
| FR-5.4 | Party preference: "Serve together" or "Serve in order" | Should Have |
| FR-5.5 | Maximum 6 guests per party | Should Have |
| FR-5.6 | Single confirmation screen for entire party | Should Have |

#### FR-6: Confirmation & Queue (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Generate unique check-in number (format: A001, A002, etc.) | Must Have |
| FR-6.2 | Display current queue position | Must Have |
| FR-6.3 | Display estimated wait time | Must Have |
| FR-6.4 | Show loyalty points balance and progress to next reward | Must Have |
| FR-6.5 | "Thank you" message with salon branding | Must Have |
| FR-6.6 | Option to receive SMS when next in queue | Should Have |
| FR-6.7 | Auto-reset to welcome screen after 10 seconds | Must Have |
| FR-6.8 | Print ticket option (if receipt printer connected) | Nice to Have |

#### FR-7: Staff Integration (Must Have - MVP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Real-time push to Store App when client checks in | Must Have |
| FR-7.2 | Include: client info, selected services, technician preference | Must Have |
| FR-7.3 | Update wait queue on Front Desk dashboard | Must Have |
| FR-7.4 | Sound/visual notification on Store App | Should Have |
| FR-7.5 | Staff can view check-in details and reassign technician | Should Have |

### 4.2 Non-Functional Requirements

#### Performance
| Requirement | Target |
|-------------|--------|
| Phone lookup response time | < 2 seconds |
| QR code scan to result | < 1 second |
| Screen transition animations | 300ms max |
| App cold start | < 3 seconds |
| Offline data sync on reconnect | < 30 seconds |

#### Scalability
- Support 100+ concurrent check-ins across all store kiosks
- Client database: 100,000+ records with instant search
- Queue: 50+ clients in queue without performance degradation

#### Security
- Phone numbers masked after entry (XXX-XXX-1234)
- No payment data on check-in device
- Session timeout after 60 seconds of inactivity
- Admin mode requires PIN

#### Accessibility (WCAG 2.1 AA)
- Minimum 44x44px touch targets
- 4.5:1 color contrast ratio for text
- Screen reader compatible
- Large text mode option
- "Request Assistance" button always visible

#### Device Support
- **Primary**: iPad (10th gen+), iPad Pro
- **Secondary**: Android tablets (10"+, Android 10+)
- **Future**: Web app for client's own phone

### 4.3 Business Rules

#### BR-1: Queue Position Calculation
```
Position = Number of clients checked in before you
           who selected same or similar service category
           and haven't been called yet
```

#### BR-2: Wait Time Estimation
```
Estimated Wait = (Position in Queue × Average Service Duration)
                 ÷ Number of Available Technicians for Service
                 + Current Client Remaining Time
```

#### BR-3: Technician Availability Status
| Status | Condition |
|--------|-----------|
| Available | No active ticket, clocked in, not on break |
| With Client | Has active ticket in progress |
| Finishing Soon | Active ticket > 80% complete (based on service duration) |
| On Break | Break status in Store App |
| Off | Not clocked in or shift ended |

#### BR-4: Check-In Number Reset
- Reset daily at store opening time
- Format: Single letter (A-Z) + 3 digits (001-999)
- Cycles A001 → A999 → B001

#### BR-5: Duplicate Phone Prevention
- If phone exists: "Welcome back, [Name]!"
- If phone doesn't exist: Proceed to registration
- No duplicate phone numbers allowed in system

---

## 5. User Experience Specifications

### 5.1 Screen Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHECK-IN APP FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   WELCOME    │ ← Attract screen with salon branding                      │
│  │   SCREEN     │   "Tap anywhere to check in"                              │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐     ┌──────────────┐                                     │
│  │  IDENTIFY    │────▶│  QR SCANNER  │ (if QR option selected)             │
│  │  YOURSELF    │     └──────┬───────┘                                     │
│  │              │            │                                              │
│  │ • Phone #    │            │                                              │
│  │ • Scan QR    │◀───────────┘                                              │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐     ┌──────────────┐                                     │
│  │   LOOKUP     │────▶│    NEW       │ (if phone not found)                │
│  │   RESULT     │     │  CUSTOMER    │                                     │
│  │              │     │  SIGN-UP     │                                     │
│  │ "Welcome     │     │              │                                     │
│  │  back, Sam!" │     │ • First name │                                     │
│  └──────┬───────┘     │ • Last name  │                                     │
│         │             │ • Email      │                                     │
│         │             │ • Zip code   │                                     │
│         │             └──────┬───────┘                                     │
│         │                    │                                              │
│         ▼◀───────────────────┘                                              │
│  ┌──────────────┐                                                           │
│  │   SELECT     │ ← Services grouped by category                            │
│  │   SERVICES   │   Multi-select, running total shown                       │
│  │              │   "Popular for you" section (returning clients)           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │   SELECT     │ ← "Anyone Available" recommended                          │
│  │  TECHNICIAN  │   Photos, names, status indicators                        │
│  │              │   Wait time per technician                                │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐     ┌──────────────┐                                     │
│  │   REVIEW &   │────▶│  ADD GUEST   │ (optional loop)                     │
│  │   CONFIRM    │◀────│    FLOW      │                                     │
│  │              │     └──────────────┘                                     │
│  │ • Services   │                                                           │
│  │ • Technician │                                                           │
│  │ • Add guest? │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ CONFIRMATION │ ← Check-in number (large)                                 │
│  │              │   Queue position & wait time                              │
│  │   #A042      │   Loyalty points progress                                 │
│  │              │   "We'll call your name!"                                 │
│  │  3rd in line │   Auto-reset to Welcome after 10s                        │
│  │  ~15 min wait│                                                           │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Screen Specifications

#### Screen 1: Welcome (Attract Screen)

**Purpose**: Draw attention, invite interaction, reinforce brand

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│           [SALON LOGO]                  │
│                                         │
│                                         │
│      ✨ Welcome to [Salon Name] ✨      │
│                                         │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │   TAP ANYWHERE TO CHECK IN  │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│                                         │
│         Have an appointment?            │
│         Scan your QR code ──────> 📷    │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Full-screen, salon brand colors as background gradient
- Logo: Centered, max 200px height
- Main CTA: Pulsing subtle animation to draw attention
- QR hint: Bottom right, secondary emphasis
- Touch anywhere triggers transition

**Behavior**:
- Tap anywhere → Identify screen
- Camera icon tap → Direct to QR scanner
- Idle animation: Subtle logo float or particle effects

---

#### Screen 2: Identify Yourself

**Purpose**: Fast identification via phone or QR

**Layout**:
```
┌─────────────────────────────────────────┐
│  ← Back                    Need Help? 🙋 │
│                                         │
│         Enter Your Phone Number         │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │    (___) ___-____          │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    ┌─────┬─────┬─────┐                 │
│    │  1  │  2  │  3  │                 │
│    ├─────┼─────┼─────┤                 │
│    │  4  │  5  │  6  │                 │
│    ├─────┼─────┼─────┤                 │
│    │  7  │  8  │  9  │                 │
│    ├─────┼─────┼─────┤                 │
│    │  ⌫  │  0  │  ✓  │                 │
│    └─────┴─────┴─────┘                 │
│                                         │
│    ─────────── or ───────────          │
│                                         │
│    ┌─────────────────────────────┐     │
│    │   📷  Scan QR Code          │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Phone input: 48px font, auto-formatting as user types
- Keypad buttons: 72x72px minimum, high contrast
- Check button (✓): Disabled until 10 digits entered, then green
- QR option: Secondary button below keypad
- Help button: Top right, triggers staff notification

**Behavior**:
- Auto-format: 5551234567 → (555) 123-4567
- Auto-submit when 10 digits entered (with 500ms delay for correction)
- Backspace clears one digit
- QR tap opens camera overlay

**Validation**:
- Must be exactly 10 digits
- Error: "Please enter a valid 10-digit phone number"

---

#### Screen 3: New Customer Sign-Up

**Purpose**: Minimal friction registration for new clients

**Layout**:
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│         Welcome, New Friend! 👋         │
│     Just a few quick details...         │
│                                         │
│    First Name *                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    Last Name *                          │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    Email (for receipts & offers)        │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    Zip Code                             │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    ☑ Text me appointment reminders      │
│      & special offers                   │
│                                         │
│    ┌─────────────────────────────┐     │
│    │      CONTINUE  →            │     │
│    └─────────────────────────────┘     │
│                                         │
│    By continuing, you agree to our      │
│    Privacy Policy                       │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Input fields: 56px height, 18px font, 16px label above
- Required indicator: Subtle asterisk, not red
- SMS checkbox: Pre-checked, clearly worded
- Continue button: Full width, 56px height, primary color
- Privacy link: Tappable, opens modal

**Behavior**:
- Keyboard appears when field focused
- Next button on keyboard moves to next field
- Inline validation (green checkmark when valid)
- Continue enabled when First + Last name filled

**Validation**:
- First/Last name: 2+ characters, letters only
- Email: Valid format if provided (not required)
- Zip: 5 digits if provided (not required)

---

#### Screen 4: Select Services

**Purpose**: Quick, visual service selection

**Layout**:
```
┌─────────────────────────────────────────┐
│  ← Back              Your Total: $45    │
│                       ~1 hr 15 min      │
│         What would you like today?      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search services...           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⭐ POPULAR FOR YOU                     │
│  ┌─────────────────────────────────┐   │
│  │ ☑ Gel Manicure         $35  45m │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Spa Pedicure         $45  60m │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💅 MANICURES                           │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Classic Manicure     $25  30m │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ☑ Gel Manicure         $35  45m │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🦶 PEDICURES                           │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Classic Pedicure     $35  45m │   │
│  └─────────────────────────────────┘   │
│                                         │
│    ┌─────────────────────────────┐     │
│    │      CONTINUE  →            │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Service cards: 72px height, full width, tap to toggle
- Selected state: Checkmark, subtle background color
- Price right-aligned, duration in lighter text
- Category headers: Sticky on scroll, icon + text
- Running total: Sticky header, updates in real-time
- Continue button: Sticky footer

**Behavior**:
- Tap service → Toggle selection (with haptic feedback)
- Search filters list in real-time
- "Popular for you" shows last 3 services (returning clients only)
- Continue disabled until at least 1 service selected

**Enhancements**:
- After selecting main service, show relevant add-ons in toast: "Add gel polish for just $10 more?"

---

#### Screen 5: Select Technician

**Purpose**: Choose preferred technician or fastest option

**Layout**:
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│         Who would you like to see?      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⚡                              │   │
│  │  ANYONE AVAILABLE               │   │
│  │  Fastest service • ~10 min wait │   │
│  │                          ✓      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────── Or choose a technician ─────── │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [PHOTO]  Sarah M.              │   │
│  │           🟢 Available now      │   │
│  │           ~5 min wait           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [PHOTO]  Jenny L.              │   │
│  │           🟡 With client        │   │
│  │           ~25 min wait          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [PHOTO]  Mike T.               │   │
│  │           🔴 On break           │   │
│  │           ~45 min wait          │   │
│  └─────────────────────────────────┘   │
│                                         │
│    ┌─────────────────────────────┐     │
│    │      CONTINUE  →            │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- "Anyone Available" card: Highlighted, recommended badge
- Technician cards: 88px height, photo 64x64px rounded
- Status indicators: Colored dot + text
- Wait time: Right-aligned, updates in real-time
- Unavailable technicians: Grayed out but visible

**Status Colors**:
- 🟢 Green (#22C55E): Available
- 🟡 Yellow (#EAB308): With Client / Finishing Soon
- 🔴 Red (#EF4444): On Break / Unavailable
- ⚫ Gray (#9CA3AF): Off / Not Working Today

**Behavior**:
- "Anyone Available" pre-selected by default
- Tap technician → Select (radio button behavior)
- Long-press → View technician profile (photo, specialties, reviews)
- Sort by: Wait time (default), then alphabetical

---

#### Screen 6: Review & Confirm

**Purpose**: Final review before submission, guest addition

**Layout**:
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│         Almost done, Sarah! ✨          │
│                                         │
│  YOUR SERVICES                          │
│  ┌─────────────────────────────────┐   │
│  │ Gel Manicure              $35   │   │
│  │ Spa Pedicure              $45   │   │
│  ├─────────────────────────────────┤   │
│  │ Total                     $80   │   │
│  │ Est. Duration          1h 45m   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  TECHNICIAN                             │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO] Anyone Available        │   │
│  │         ~10 min wait            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  👥 + Add a Guest               │   │
│  │  Checking in with a friend?     │   │
│  └─────────────────────────────────┘   │
│                                         │
│                                         │
│    ┌─────────────────────────────┐     │
│    │   ✓  CONFIRM CHECK-IN       │     │
│    └─────────────────────────────┘     │
│                                         │
│    Need to make changes? Tap any       │
│    section above to edit.              │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Summary cards: Tappable to edit (goes back to that step)
- Add Guest: Secondary action, expandable
- Confirm button: Large, green, prominent
- Edit hint: Small text below button

**Behavior**:
- Tap service section → Back to service selection
- Tap technician section → Back to technician selection
- "Add Guest" → Opens guest flow (mini-wizard)
- Confirm → Show loading state → Confirmation screen

---

#### Screen 7: Confirmation

**Purpose**: Reassurance, queue info, loyalty engagement

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│              ✓                          │
│         You're Checked In!              │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │          # A042             │     │
│    │     Your Check-In Number    │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    ┌───────────┬───────────────┐       │
│    │    3rd    │   ~15 min     │       │
│    │ in queue  │  est. wait    │       │
│    └───────────┴───────────────┘       │
│                                         │
│    ──────────────────────────────       │
│                                         │
│    🌟 LOYALTY POINTS                    │
│    ┌─────────────────────────────┐     │
│    │ ████████████░░░░  240/300   │     │
│    │ 60 more points to FREE      │     │
│    │ Classic Manicure!           │     │
│    └─────────────────────────────┘     │
│                                         │
│    ──────────────────────────────       │
│                                         │
│    Have a seat - we'll call your       │
│    name when we're ready for you!      │
│                                         │
│    ┌─────────────────────────────┐     │
│    │  📱 Text me when I'm next   │     │
│    └─────────────────────────────┘     │
│                                         │
│         Returning to home in 10s...     │
│                                         │
└─────────────────────────────────────────┘
```

**Design Specs**:
- Check-in number: 72px font, bold, high contrast
- Queue stats: Two equal columns, large numbers
- Loyalty progress: Visual progress bar, encouraging copy
- SMS option: Secondary button, one-tap enrollment
- Auto-reset countdown: Subtle text at bottom

**Behavior**:
- Success animation on load (confetti or checkmark)
- Haptic feedback (success pattern)
- "Text me" → Confirms SMS notification enrollment
- Auto-reset to Welcome screen after 10 seconds
- Tap anywhere during countdown → Reset immediately

**Sound** (optional, configurable):
- Pleasant chime on check-in confirmation

---

### 5.3 Guest Addition Flow

When "Add Guest" is tapped:

```
┌─────────────────────────────────────────┐
│  ✕ Cancel                               │
│                                         │
│         Add a Guest                     │
│                                         │
│    Is your guest an existing client?    │
│                                         │
│    ┌─────────────────────────────┐     │
│    │  Yes, look them up          │     │
│    └─────────────────────────────┘     │
│                                         │
│    ┌─────────────────────────────┐     │
│    │  No, just enter their name  │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

- "Yes" → Phone number entry → Service selection for guest
- "No" → Name entry only → Service selection for guest
- After guest services selected → Return to Review screen with guest added
- Can add multiple guests (up to 6)

---

## 6. Technical Considerations

### 6.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHECK-IN APP                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     React + TypeScript                       │   │
│  │                     (apps/check-in)                          │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Redux + IndexedDB                         │   │
│  │                  (Offline-First Storage)                     │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│              ┌──────────────┴──────────────┐                       │
│              │                             │                       │
│              ▼                             ▼                       │
│  ┌───────────────────────┐    ┌───────────────────────┐           │
│  │    MQTT Client        │    │   Supabase Client     │           │
│  │  (Real-time to POS)   │    │  (Cloud Sync)         │           │
│  └───────────┬───────────┘    └───────────┬───────────┘           │
│              │                             │                       │
└──────────────┼─────────────────────────────┼───────────────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│     STORE APP (POS)      │    │      SUPABASE            │
│  • Receives check-ins    │    │  • Client database       │
│  • Updates queue         │    │  • Service catalog       │
│  • Staff notifications   │    │  • Check-in history      │
└──────────────────────────┘    └──────────────────────────┘
```

### 6.2 MQTT Topics

| Topic | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `salon/{id}/checkin/new` | Check-In → Store | Check-in details | New check-in notification |
| `salon/{id}/checkin/update` | Check-In → Store | Updated check-in | Guest added, services changed |
| `salon/{id}/queue/status` | Store → Check-In | Queue positions | Real-time queue updates |
| `salon/{id}/staff/status` | Store → Check-In | Staff availability | Technician status updates |
| `salon/{id}/checkin/called` | Store → Check-In | Client ID | Client called from queue |

### 6.3 Data Models

#### CheckIn
```typescript
interface CheckIn {
  id: string;                    // UUID
  checkInNumber: string;         // "A042"
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianPreference: 'anyone' | string;  // 'anyone' or technician ID
  guests: CheckInGuest[];
  partyPreference?: 'together' | 'sequence';
  status: 'waiting' | 'in_service' | 'completed' | 'no_show';
  queuePosition: number;
  estimatedWaitMinutes: number;
  checkedInAt: string;           // ISO timestamp
  calledAt?: string;
  completedAt?: string;
  source: 'kiosk' | 'web' | 'staff';
  deviceId: string;
  syncStatus: 'synced' | 'pending';
}

interface CheckInService {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

interface CheckInGuest {
  id: string;
  name: string;
  clientId?: string;             // If existing client
  services: CheckInService[];
  technicianPreference: 'anyone' | string;
}
```

### 6.4 Offline Capability

**Cached Data** (synced on app start):
- Service catalog (all active services)
- Staff list with photos
- Client database (searchable subset)

**Offline Behavior**:
- Check-ins saved to IndexedDB
- Queue position shows "Syncing..."
- Sync when connection restored
- Visual indicator: "Offline Mode" banner

### 6.5 Device Requirements

| Requirement | Specification |
|-------------|---------------|
| Display | 10"+ recommended, 7" minimum |
| Resolution | 1280x800 minimum |
| Touch | Capacitive multi-touch |
| Camera | Rear camera for QR scanning |
| Network | WiFi required, cellular optional |
| Storage | 500MB available |
| OS | iOS 15+ or Android 10+ |

---

## 7. Success Metrics & Analytics

### 7.1 Key Metrics

| Metric | Definition | Target | Tracking |
|--------|------------|--------|----------|
| Check-in completion rate | Completed / Started | > 90% | Funnel analytics |
| Average completion time (returning) | Start to confirmation | < 45 sec | Timer event |
| Average completion time (new) | Start to confirmation | < 90 sec | Timer event |
| QR code usage rate | QR scans / Total check-ins | > 30% | Event tracking |
| Guest addition rate | Check-ins with guests / Total | Track only | Event tracking |
| SMS opt-in rate | SMS selected / Confirmations shown | > 60% | Event tracking |
| Abandon rate by screen | Exits per screen | < 5% per screen | Funnel analytics |

### 7.2 Events to Track

```typescript
// Check-in flow events
track('checkin_started', { source: 'tap' | 'qr' });
track('phone_entered', { isExisting: boolean });
track('registration_completed', { fields: string[] });
track('services_selected', { count: number, total: number });
track('technician_selected', { type: 'anyone' | 'specific' });
track('guest_added', { guestCount: number });
track('checkin_completed', { totalTime: number, isNewClient: boolean });
track('checkin_abandoned', { screen: string, timeSpent: number });
track('sms_notification_enabled', {});
track('help_requested', { screen: string });
```

### 7.3 Dashboard Metrics

**Daily View**:
- Total check-ins
- New vs returning ratio
- Average wait time
- Peak hours heatmap
- Abandon rate

**Weekly/Monthly**:
- Check-in trend
- Popular services
- Busiest days/times
- Guest party frequency

---

## 8. Launch Plan

### Phase 1: MVP (4 weeks)
- Phone number check-in
- New client registration
- Service selection
- "Anyone Available" technician only
- Basic confirmation screen
- MQTT integration with Store App

### Phase 2: Enhanced (2 weeks after MVP)
- QR code scanning
- Specific technician selection with status
- Wait time estimation
- Loyalty points display

### Phase 3: Full Feature (2 weeks after Phase 2)
- Guest/party check-in
- SMS notification option
- Offline mode
- Analytics dashboard

### Rollout Strategy
1. **Internal testing**: 1 week at test salon
2. **Beta**: 5 pilot salons, gather feedback
3. **Soft launch**: 20 salons, monitor metrics
4. **General availability**: All Mango customers

---

## 9. Open Questions & Risks

### Open Questions

| Question | Owner | Due Date |
|----------|-------|----------|
| Should we support appointment check-in differently than walk-ins? | Product | Week 1 |
| What happens if all technicians are unavailable for a service? | Product | Week 1 |
| Do we need parental consent for minors? | Legal | Week 2 |
| Should loyalty points be redeemable at check-in? | Product | Week 3 |

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Kiosk theft/damage | High | Low | Security mount, insurance, remote wipe |
| Client data privacy concerns | High | Medium | Clear privacy policy, minimal data collection |
| Inaccurate wait times frustrate clients | Medium | Medium | Conservative estimates, continuous refinement |
| Staff resistance to change | Medium | Medium | Training, show time savings metrics |
| Offline sync conflicts | Medium | Low | Conflict resolution logic, staff override |

---

## 10. Appendix

### A. Competitive Screenshots
*(To be added)*

### B. User Research Summary
*(To be added after interviews)*

### C. Technical Architecture Diagram
*(See Section 6.1)*

### D. Accessibility Checklist

- [ ] All touch targets ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] No information conveyed by color alone
- [ ] Screen reader labels for all interactive elements
- [ ] Keyboard navigation support (for connected keyboards)
- [ ] Large text mode option
- [ ] Reduced motion option
- [ ] High contrast mode option

---

*Document created: 2026-01-09*
*Last updated: 2026-01-09*
