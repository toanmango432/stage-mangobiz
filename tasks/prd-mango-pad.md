# PRD: Mango Pad - Customer-Facing Payment & Signature Display

## Introduction

Mango Pad is a customer-facing secondary display that handles the payment flow for Mango POS. When the POS initiates checkout, the Pad receives the transaction details via MQTT, displays the order summary to the client, captures tip selection and signature, instructs the client to use the external payment terminal, and handles the post-payment receipt flow.

This is similar to Toast's customer-facing display, Square's customer display, and other modern POS secondary screens. The Pad runs on iPad, Android tablets, or as a computer secondary display.

---

## Goals

- Provide a professional, intuitive customer-facing payment experience
- Seamlessly integrate with the POS via MQTT real-time communication
- Support external payment terminals (PAX, Dejavoo, Clover, etc.)
- Capture digital signatures for service records
- Offer flexible tip selection (suggested percentages, custom amounts)
- Handle configurable receipt delivery (email, SMS, print, or skip)
- Work across iPad, Android, and desktop secondary displays
- Support offline queuing when connection is temporarily lost

---

## User Flow Overview

```
┌─────────────┐     MQTT: ready_to_pay      ┌─────────────────┐
│  IDLE       │ ─────────────────────────▶  │  ORDER REVIEW   │
│  (Standby)  │                             │  (Show details) │
└─────────────┘                             └────────┬────────┘
                                                     │ Client taps "Confirm"
                                                     ▼
                                            ┌─────────────────┐
                                            │  TIP SELECTION  │
                                            │  (%, $, custom) │
                                            └────────┬────────┘
                                                     │ Client selects tip
                                                     ▼
                                            ┌─────────────────┐
                                            │  SIGNATURE      │
                                            │  (Draw + agree) │
                                            └────────┬────────┘
                                                     │ Client signs
                                                     ▼
                                            ┌─────────────────┐
                                            │  PAYMENT        │
                                            │  "Tap/Insert"   │
                                            └────────┬────────┘
                                                     │ Terminal responds
                                                     ▼
                                            ┌─────────────────┐
                                            │  RESULT         │
                                            │  Success/Fail   │
                                            └────────┬────────┘
                                                     │ (if configured)
                                                     ▼
                                            ┌─────────────────┐
                                            │  RECEIPT        │
                                            │  Email/SMS/Skip │
                                            └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  THANK YOU      │
                                            │  (3-5 seconds)  │
                                            └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  IDLE           │
                                            │  (Standby)      │
                                            └─────────────────┘
```

---

## User Stories

### Phase 1: Foundation

#### US-001: Project Setup and MQTT Integration
**Description:** As a developer, I want the project foundation with MQTT connectivity so that the Pad can communicate with the POS.

**Acceptance Criteria:**
- [ ] Redux store configured with slices: padSlice, transactionSlice, configSlice, uiSlice
- [ ] MQTT client initialized and connects to broker
- [ ] Subscribe to `salon/{id}/pad/ready_to_pay` topic
- [ ] Subscribe to `salon/{id}/pad/payment_result` topic
- [ ] Subscribe to `salon/{id}/pad/cancel` topic
- [ ] Publish capability to `salon/{id}/pad/signature` topic
- [ ] Publish capability to `salon/{id}/pad/tip_selected` topic
- [ ] Connection status indicator (connected/disconnected)
- [ ] TypeScript types for all MQTT message payloads
- [ ] Typecheck passes
- [ ] pnpm build succeeds

---

#### US-002: Idle/Standby Screen with Digital Signage
**Description:** As a salon, I want an attractive idle screen with promotional content so that the Pad engages customers and reinforces our brand.

**Acceptance Criteria:**
- [ ] Full-screen idle display with salon branding
- [ ] Shows salon logo (configurable via settings)
- [ ] Displays current date and time
- [ ] **Promotional Carousel**: Rotating slides with configurable content:
  - Service promotions and seasonal offers
  - New service announcements
  - Membership/loyalty program benefits
  - Staff spotlights ("Meet our team")
  - Customer testimonials/reviews
  - Social media handles with QR code
- [ ] Configurable slide duration (default 8 seconds)
- [ ] Smooth fade/slide transitions between content
- [ ] Ambient background option (gradient animation or static brand colors)
- [ ] MQTT connection status indicator (subtle, corner)
- [ ] Transitions smoothly when transaction begins
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-003: Order Review Screen
**Description:** As a client, I want to see my service details and total so that I can verify the charges before paying.

**Acceptance Criteria:**
- [ ] Receives transaction data via MQTT `ready_to_pay` message
- [ ] Displays client name prominently
- [ ] Lists all services with individual prices
- [ ] Shows product items if any
- [ ] Displays subtotal, tax, and total
- [ ] Shows applied discounts if any
- [ ] "Looks Good" / "Confirm" button to proceed
- [ ] "Need Help?" button to alert staff
- [ ] Staff name who served the client
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 2: Core Payment Flow

#### US-004: Tip Selection Screen
**Description:** As a client, I want to select a tip amount easily so that I can reward good service.

**Acceptance Criteria:**
- [ ] Suggested tip buttons: 18%, 20%, 25%, 30% (configurable)
- [ ] Each button shows calculated dollar amount
- [ ] "Custom" button opens numeric keypad for custom amount
- [ ] "No Tip" option available
- [ ] Running total updates as tip is selected
- [ ] Selected tip visually highlighted
- [ ] "Continue" button proceeds to signature
- [ ] Publish tip selection to MQTT `salon/{id}/pad/tip_selected`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-005: Signature Capture Screen
**Description:** As a client, I want to sign digitally so that the salon has my authorization on record.

**Acceptance Criteria:**
- [ ] Canvas-based signature pad (react-signature-canvas or similar)
- [ ] Works with finger touch and stylus
- [ ] "Clear" button to reset signature
- [ ] Displays agreement text: "I agree to pay the total shown"
- [ ] Shows final total including tip
- [ ] "Done" / "Complete" button to proceed
- [ ] Signature captured as base64 image
- [ ] Publish signature to MQTT `salon/{id}/pad/signature`
- [ ] Minimum signature validation (not empty)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-006: Payment Instruction Screen
**Description:** As a client, I want clear instructions on how to pay so that I know what to do with the terminal.

**Acceptance Criteria:**
- [ ] Large, clear text: "Please Insert or Tap Card"
- [ ] Animated visual showing card insert/tap on terminal
- [ ] Terminal brand/image if configured (PAX, Dejavoo, Clover)
- [ ] Shows total amount being charged
- [ ] Loading/processing indicator
- [ ] Cancel button (alerts staff, doesn't cancel directly)
- [ ] Listens for MQTT `salon/{id}/pad/payment_result`
- [ ] Timeout handling (configurable, default 120 seconds)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-007: Payment Result Screen
**Description:** As a client, I want to see if my payment succeeded so that I know the transaction is complete.

**Acceptance Criteria:**
- [ ] Success state: Green checkmark, "Payment Successful" message
- [ ] Failure state: Red X, "Payment Failed" with retry option
- [ ] Shows last 4 digits of card used
- [ ] Shows authorization code on success
- [ ] "Try Again" button on failure (returns to payment instruction)
- [ ] Auto-proceeds after 3 seconds on success (configurable)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 3: Post-Payment Flow

#### US-008: Receipt Selection Screen (Configurable)
**Description:** As a client, I want to choose how to receive my receipt so that I have a record of my visit.

**Acceptance Criteria:**
- [ ] Only shown if `config.showReceiptOptions` is true
- [ ] Options: Email, SMS, Print, No Receipt
- [ ] Email option: Shows client email if on file, allows edit
- [ ] SMS option: Shows client phone if on file, allows edit
- [ ] Print option: Sends print command to POS via MQTT
- [ ] "No Receipt" skips directly to thank you
- [ ] Publish receipt preference to MQTT `salon/{id}/pad/receipt_preference`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-009: Thank You Screen
**Description:** As a client, I want a pleasant closing experience so that I leave with a positive impression.

**Acceptance Criteria:**
- [ ] Displays "Thank You, [Client Name]!"
- [ ] Shows loyalty points earned if applicable
- [ ] Optional: Next appointment reminder if booked
- [ ] Optional: Promotional message
- [ ] Auto-returns to idle after configurable delay (default 5 seconds)
- [ ] Publish `salon/{id}/pad/transaction_complete` to MQTT
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4: Split Payments & Configuration

#### US-010: Split Payment Flow
**Description:** As a client paying with friends/family, I want to split the bill across multiple cards so that each person pays their share.

**Acceptance Criteria:**
- [ ] "Split Payment" button available on Order Review screen (if enabled in settings)
- [ ] Split options: Equal split (2, 3, or 4 ways) or Custom amounts
- [ ] Equal split calculates and displays amount per person
- [ ] Custom split allows entering specific dollar amounts per payment
- [ ] Validation: split amounts must equal total
- [ ] Each split follows the flow: Tip (optional) → Sign → Pay
- [ ] Track which splits are completed vs pending
- [ ] Visual progress indicator showing completed payments
- [ ] After each successful split payment, return to split status screen
- [ ] When all splits complete, proceed to receipt/thank you
- [ ] Cancel split returns to Order Review with option to pay full amount
- [ ] Publish split payment details to MQTT `salon/{id}/pad/split_payment`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-011: Comprehensive Settings/Configuration Screen
**Description:** As a salon admin, I want to fully customize the Pad experience so that it matches our business preferences and workflow.

**Acceptance Criteria:**
- [ ] Accessible via hidden gesture (4-finger long press) or PIN entry
- [ ] **Connection Settings:**
  - Configure salon ID for MQTT topics
  - Configure MQTT broker URL
  - Test MQTT Connection button with status feedback
- [ ] **Payment Flow Settings:**
  - Toggle tip screen on/off
  - Set tip type: percentage-based OR dollar-based suggestions
  - Set tip suggestion values (e.g., [18, 20, 25, 30] or [$5, $10, $15, $20])
  - Toggle signature requirement on/off
  - Toggle receipt options screen on/off
  - Set payment timeout duration (30-300 seconds)
- [ ] **Idle Screen / Digital Signage Settings:**
  - Set salon logo URL
  - Enable/disable promotional carousel
  - Add/edit/remove promotional slides (image URL + optional text)
  - Set slide duration (3-15 seconds)
  - Choose background style (gradient, solid color, image)
  - Set brand primary and secondary colors
- [ ] **Display Settings:**
  - Thank you screen delay (3-10 seconds)
  - Enable high contrast mode
  - Enable large text mode
  - Screen brightness control (if supported)
- [ ] **Split Payment Settings:**
  - Enable/disable split payment option
  - Maximum number of splits (2-4)
- [ ] Settings persisted to localStorage
- [ ] Export/Import settings as JSON (for multi-device setup)
- [ ] Reset to defaults button
- [ ] Exit settings button returns to idle
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-012: Offline Mode & Sync Queue
**Description:** As a salon, I want the Pad to handle brief disconnections so that transactions aren't lost.

**Acceptance Criteria:**
- [ ] Detect MQTT disconnection
- [ ] Show "Reconnecting..." indicator
- [ ] Queue outbound messages (tip, signature, receipt preference)
- [ ] Replay queue when reconnected
- [ ] If disconnected during transaction, show "Please wait" message
- [ ] Alert staff if disconnected for > 30 seconds
- [ ] Typecheck passes

---

#### US-013: Cancel/Abort Flow
**Description:** As a client or staff, I want to cancel a transaction so that mistakes can be corrected.

**Acceptance Criteria:**
- [ ] POS can send `salon/{id}/pad/cancel` message
- [ ] Pad immediately returns to idle on cancel
- [ ] "Need Help" button on most screens
- [ ] "Need Help" publishes `salon/{id}/pad/help_requested`
- [ ] Staff can cancel from POS, Pad reflects immediately
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Quality & Accessibility

#### US-014: Accessibility (WCAG 2.1 AA)
**Description:** As a client with accessibility needs, I want the Pad to be usable so that I can complete payment independently.

**Acceptance Criteria:**
- [ ] Touch targets minimum 48x48px (larger than typical for tablet use)
- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Large, readable fonts (minimum 18px body, 24px+ headers)
- [ ] Screen reader labels on all interactive elements
- [ ] High contrast mode option
- [ ] Large text mode option
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-015: Responsive Design (Multi-Device)
**Description:** As a salon, I want the Pad to work on various devices so that I can use my preferred hardware.

**Acceptance Criteria:**
- [ ] Works on iPad (9.7" - 12.9")
- [ ] Works on Android tablets (7" - 10")
- [ ] Works on desktop secondary display (any resolution)
- [ ] Portrait and landscape orientation support
- [ ] Scales gracefully across screen sizes
- [ ] Touch-optimized on tablets
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-016: Unit Tests (70% Coverage)
**Description:** As a developer, I want comprehensive tests so that the Pad is reliable.

**Acceptance Criteria:**
- [ ] Unit tests for all Redux thunks
- [ ] Unit tests for MQTT message handlers
- [ ] Unit tests for tip calculations
- [ ] Unit tests for signature validation
- [ ] Test coverage >= 70%
- [ ] All tests pass
- [ ] Typecheck passes

---

#### US-017: E2E Tests (Happy Path)
**Description:** As a developer, I want E2E tests so that the complete flow is verified.

**Acceptance Criteria:**
- [ ] Playwright E2E test for complete payment flow
- [ ] Test: Idle → Review → Tip → Sign → Pay → Receipt → Thank You → Idle
- [ ] Mock MQTT messages for testing
- [ ] Test cancel flow
- [ ] Test payment failure and retry
- [ ] All E2E tests pass
- [ ] Typecheck passes

---

#### US-018: Performance Optimization
**Description:** As a user, I want the Pad to be fast and responsive so that checkout is smooth.

**Acceptance Criteria:**
- [ ] Bundle size < 300KB gzipped (it's a focused app)
- [ ] Time to interactive < 2 seconds
- [ ] Smooth animations (60fps)
- [ ] No jank during signature capture
- [ ] Lazy load settings screen
- [ ] Typecheck passes

---

#### US-019: Documentation & Production Readiness
**Description:** As a developer, I want documentation so that the Pad can be deployed and maintained.

**Acceptance Criteria:**
- [ ] README.md with setup instructions
- [ ] MQTT topic documentation
- [ ] Configuration guide
- [ ] Deployment guide (web, Capacitor iOS, Capacitor Android)
- [ ] No console errors in production build
- [ ] No hardcoded credentials
- [ ] Environment variables documented
- [ ] Typecheck passes

---

## Functional Requirements

- **FR-1:** The Pad must connect to the MQTT broker on startup and maintain connection
- **FR-2:** The Pad must subscribe to `salon/{id}/pad/ready_to_pay` and display transaction details
- **FR-3:** The Pad must capture tip selection and publish to `salon/{id}/pad/tip_selected`
- **FR-4:** The Pad must capture digital signature and publish to `salon/{id}/pad/signature`
- **FR-5:** The Pad must display payment instructions and wait for terminal result
- **FR-6:** The Pad must receive payment result via `salon/{id}/pad/payment_result`
- **FR-7:** The Pad must optionally display receipt selection based on configuration
- **FR-8:** The Pad must return to idle state after transaction completion
- **FR-9:** The Pad must handle cancellation via `salon/{id}/pad/cancel`
- **FR-10:** The Pad must persist configuration to localStorage
- **FR-11:** The Pad must queue messages during brief disconnections
- **FR-12:** The Pad must work on iPad, Android, and desktop displays

---

## Non-Goals (Out of Scope)

- **No payment processing on the Pad** - External terminal handles card processing
- **No direct Supabase integration** - Pad only communicates via MQTT to POS
- **No inventory management** - Order details come from POS
- **No appointment booking** - This is a payment-only display
- **No staff login/authentication** - Pad is device-authenticated via salon ID
- **No receipt generation** - POS handles receipt creation, Pad only captures preference
- **No multi-language support** (v1) - English only for MVP
- **No queue position display** - This is handled by Check-In app

---

## MQTT Topics Reference

| Topic | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `salon/{id}/pad/ready_to_pay` | POS → Pad | TransactionPayload | Initiates payment flow |
| `salon/{id}/pad/tip_selected` | Pad → POS | { tipAmount, tipPercent, splitIndex? } | Client tip selection |
| `salon/{id}/pad/signature` | Pad → POS | { signatureBase64, agreedAt, splitIndex? } | Captured signature |
| `salon/{id}/pad/payment_result` | POS → Pad | { success, last4, authCode, error?, splitIndex? } | Terminal result |
| `salon/{id}/pad/receipt_preference` | Pad → POS | { method, email?, phone? } | Receipt delivery choice |
| `salon/{id}/pad/transaction_complete` | Pad → POS | { transactionId } | Flow complete |
| `salon/{id}/pad/cancel` | POS → Pad | { reason? } | Cancel current transaction |
| `salon/{id}/pad/help_requested` | Pad → POS | { screen, timestamp } | Client needs assistance |
| `salon/{id}/pad/split_payment` | Pad → POS | { splitType, splits[], totalSplits } | Split payment initiated |

### TransactionPayload Schema

```typescript
interface TransactionPayload {
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    type: 'service' | 'product';
  }[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  loyaltyPoints?: number;
  suggestedTips: number[]; // e.g., [18, 20, 25, 30]
  showReceiptOptions: boolean;
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}
```

---

## Design Considerations

- **Large touch targets** (48px minimum) for easy tablet use
- **High contrast** for visibility in bright salon environments
- **Minimal steps** - Each screen has one clear action
- **Prominent totals** - Dollar amounts always visible and large
- **Brand-able** - Salon logo and colors configurable
- **Calming animations** - Smooth transitions, not jarring
- **Error recovery** - Clear retry paths for failures

---

## Technical Considerations

- **React 18 + TypeScript** - Consistent with monorepo
- **Redux Toolkit** - State management
- **MQTT.js** - Real-time communication with POS
- **react-signature-canvas** - Signature capture
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Styling with design tokens
- **Capacitor** - iOS and Android deployment
- **Vite** - Build tool (already configured)

---

## Success Metrics

- Transaction completion rate > 95%
- Average time from review to payment < 45 seconds
- Signature capture success rate > 99%
- MQTT message delivery latency < 100ms
- Zero dropped transactions due to Pad issues
- Lighthouse accessibility score > 90

---

## Open Questions

1. ~~Should we support split payments (multiple cards)?~~ **YES - Added US-010**
2. ~~Should tip suggestions be percentage-based or dollar-based by default?~~ **Configurable in Settings - US-011**
3. ~~Should there be a "manager override" for adjusting totals on the Pad?~~ **NO - POS controls everything**
4. ~~Do we need multi-language support in v1?~~ **NO - English only for v1**
5. ~~Should the idle screen show queue position for waiting clients?~~ **NO - Handled by Check-In app**

### Remaining Questions
- Should we add a customer feedback/rating screen after Thank You?
- Should promotional slides support video content or just images?
- Should we integrate with loyalty apps (Marsello, Smile.io) for points display?

---

## Appendix: Screen Mockup Descriptions

### Idle Screen
- Full-screen salon logo (centered)
- Current date/time (top right)
- "Ready to assist you" subtle text
- Ambient gradient or subtle animation

### Order Review Screen
- Header: "Hi, [Client Name]!"
- Service list with prices
- Subtotal, tax, discount, total
- Staff: "Served by [Staff Name]"
- Large "Looks Good" button
- Small "Need Help?" link

### Tip Selection Screen
- Header: "Add a Tip?"
- 4 large buttons: 18%, 20%, 25%, 30%
- Each shows: "$X.XX" calculated amount
- "Custom" button → numeric keypad
- "No Tip" smaller button
- Running total at bottom
- "Continue" button

### Signature Screen
- Header: "Sign Below"
- Large signature canvas (white, full width)
- "Clear" button
- "I agree to pay $XXX.XX" text
- "Done" button

### Payment Instruction Screen
- Large: "Please Insert or Tap Card"
- Animated card + terminal graphic
- Total: "$XXX.XX"
- Subtle "Processing..." when waiting
- "Cancel" small button (alerts staff)

### Success Screen
- Large green checkmark
- "Payment Successful!"
- Card: "Visa •••• 4242"
- Auto-proceed countdown

### Receipt Screen
- Header: "How would you like your receipt?"
- 4 buttons: Email, Text, Print, No Thanks
- Pre-filled email/phone if known

### Thank You Screen
- "Thank You, [Name]!"
- "You earned X loyalty points"
- "See you next time!"
- Auto-return to idle

---

*PRD Version: 1.0*
*Created: January 2026*
*Author: Amp PRD Generator*
