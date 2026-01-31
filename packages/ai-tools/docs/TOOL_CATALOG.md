# AI Tools Catalog

Complete reference of all AI tools available in `@mango/ai-tools` for Mango Connect integration.

---

## Overview

| Category | Tool Count | Description |
|----------|------------|-------------|
| [Clients](#clients) | 6 | Client management and CRM operations |
| [Appointments](#appointments) | 6 | Booking, scheduling, and availability |
| [Services](#services) | 5 | Service catalog and pricing |
| [Tickets](#tickets) | 8 | Sales transactions and checkout |
| [Staff](#staff) | 6 | Staff schedules and performance |
| [Analytics](#analytics) | 5 | Business metrics and reports |
| [System](#system) | 6 | Store context and system utilities |

**Total: 42 tools**

---

## Clients

Tools for managing client records, profiles, and notes.

### searchClients

Search for clients by name, phone number, or email address.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search term (name, phone, email) |
| `filters` | object | No | - | Filter by loyalty tier, VIP status, visit history |
| `filters.loyaltyTier` | enum | No | - | `bronze`, `silver`, `gold`, `platinum`, `vip` |
| `filters.isVip` | boolean | No | - | Filter by VIP status |
| `filters.isBlocked` | boolean | No | - | Filter by blocked status |
| `filters.lastVisitWithinDays` | number | No | - | Clients who visited within N days |
| `filters.minTotalSpent` | number | No | - | Minimum lifetime spend |
| `filters.preferredStaffId` | UUID | No | - | Clients who prefer this staff |
| `filters.source` | enum | No | - | How client was acquired |
| `limit` | number | No | 10 | Max results (1-100) |
| `offset` | number | No | 0 | Pagination offset |

**Tags:** `read`, `search`

---

### getClient

Get complete details for a specific client.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | UUID | Yes | - | Client unique identifier |

**Tags:** `read`

---

### getClientHistory

Get a client's visit history including appointments and transactions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | UUID | Yes | - | Client unique identifier |
| `includeAppointments` | boolean | No | true | Include appointment history |
| `includeTickets` | boolean | No | true | Include ticket/transaction history |
| `limit` | number | No | 20 | Max items per type (1-100) |
| `startDate` | ISO datetime | No | - | Filter from this date |
| `endDate` | ISO datetime | No | - | Filter until this date |

**Tags:** `read`, `history`

---

### createClient

Create a new client record.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `firstName` | string | Yes | - | Client's first name |
| `lastName` | string | Yes | - | Client's last name |
| `phone` | string | Yes | - | Phone number (10+ digits) |
| `email` | string | No | - | Email address |
| `birthday` | YYYY-MM-DD | No | - | Birthday for promotions |
| `gender` | enum | No | - | `female`, `male`, `non_binary`, `prefer_not_to_say` |
| `address` | object | No | - | Mailing address |
| `source` | enum | No | - | How client found business |
| `referredByClientId` | UUID | No | - | Referring client ID |
| `allowEmail` | boolean | No | true | Allow email communications |
| `allowSms` | boolean | No | true | Allow SMS notifications |
| `allowMarketing` | boolean | No | false | Allow marketing messages |
| `notes` | string | No | - | Initial notes |

**Tags:** `write`, `create`

---

### updateClient

Update an existing client's profile information.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | UUID | Yes | - | Client to update |
| `firstName` | string | No | - | Updated first name |
| `lastName` | string | No | - | Updated last name |
| `phone` | string | No | - | Updated phone |
| `email` | string\|null | No | - | Updated email (null to clear) |
| `birthday` | string\|null | No | - | Updated birthday |
| `gender` | enum\|null | No | - | Updated gender |
| `address` | object\|null | No | - | Updated address |
| `isVip` | boolean | No | - | Set VIP status |
| `preferredStaffIds` | UUID[] | No | - | Preferred staff members |
| `allowEmail` | boolean | No | - | Email permission |
| `allowSms` | boolean | No | - | SMS permission |
| `allowMarketing` | boolean | No | - | Marketing permission |
| `tags` | string[] | No | - | Replace all tags |

**Tags:** `write`, `update`

---

### addClientNote

Add a note to a client's profile.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | UUID | Yes | - | Client ID |
| `note` | string | Yes | - | Note content (max 5000 chars) |
| `category` | enum | No | `general` | `general`, `service`, `preference`, `medical`, `important` |
| `isPrivate` | boolean | No | false | Staff-only visibility |

**Note:** Medical category notes are automatically marked as private.

**Tags:** `write`, `create`

---

## Appointments

Tools for managing bookings, availability, and scheduling.

### searchAppointments

Search for appointments on a specific date.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | YYYY-MM-DD | Yes | - | Date to search |
| `staffId` | UUID | No | - | Filter by staff member |
| `clientId` | UUID | No | - | Filter by client |
| `status` | enum | No | - | Filter by status |
| `includeAllStatuses` | boolean | No | false | Include cancelled/no-show |
| `limit` | number | No | 50 | Max results (1-100) |

**Status values:** `scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `no_show`, `cancelled`

**Tags:** `read`, `search`

---

### getAppointment

Get complete details for a specific appointment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appointmentId` | UUID | Yes | - | Appointment ID |

**Tags:** `read`

---

### checkAvailability

Check available time slots for booking an appointment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `serviceId` | UUID | Yes | - | Service to book |
| `date` | YYYY-MM-DD | Yes | - | Date to check |
| `staffId` | UUID | No | - | Specific staff (or all qualified) |
| `durationMinutes` | number | No | - | Override service duration |
| `preferredTime` | HH:MM | No | - | Preferred time (24hr) |
| `includeBreaks` | boolean | No | false | Show staff break times |

**Tags:** `read`, `availability`

---

### bookAppointment

Book a new appointment for a client.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clientId` | UUID | Yes | - | Client to book for |
| `staffId` | UUID | Yes | - | Staff performing service |
| `serviceId` | UUID | Yes | - | Service being booked |
| `startTime` | ISO datetime | Yes | - | Start time with timezone |
| `notes` | string | No | - | Staff-visible notes |
| `clientNotes` | string | No | - | Client's special requests |
| `sendConfirmation` | boolean | No | true | Send confirmation to client |
| `source` | enum | No | `ai_assistant` | Booking source |
| `additionalServices` | array | No | - | Additional services to add |

**Tags:** `write`, `create`

---

### rescheduleAppointment

Reschedule an existing appointment to a new time.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appointmentId` | UUID | Yes | - | Appointment to reschedule |
| `newStartTime` | ISO datetime | Yes | - | New start time |
| `newStaffId` | UUID | No | - | Change staff member |
| `reason` | string | Yes | - | Reason for reschedule |
| `notifyClient` | boolean | No | true | Send notification |
| `initiatedBy` | enum | No | `ai_assistant` | Who initiated |

**Tags:** `write`, `update`

---

### cancelAppointment

Cancel an existing appointment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appointmentId` | UUID | Yes | - | Appointment to cancel |
| `reason` | string | Yes | - | Cancellation reason |
| `notifyClient` | boolean | No | true | Send notification |
| `cancellationType` | enum | No | `client_request` | Type for reporting |
| `waiveCancellationFee` | boolean | No | false | Waive fee (may need approval) |
| `initiatedBy` | enum | No | `ai_assistant` | Who initiated |

**Permission:** Requires `staff` level

**Tags:** `write`, `delete`

---

## Services

Tools for browsing the service catalog and pricing.

### searchServices

Search for services by name, category, or price range.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | No | - | Search term (empty lists all) |
| `category` | enum | No | - | Service category |
| `minPrice` | number | No | - | Minimum price |
| `maxPrice` | number | No | - | Maximum price |
| `maxDurationMinutes` | number | No | - | Maximum duration |
| `includeInactive` | boolean | No | false | Include inactive services |
| `limit` | number | No | 20 | Max results (1-100) |
| `offset` | number | No | 0 | Pagination offset |

**Categories:** `haircut`, `color`, `styling`, `treatment`, `nails`, `manicure`, `pedicure`, `facial`, `massage`, `waxing`, `makeup`, `extensions`, `bridal`, `mens`, `kids`, `other`

**Tags:** `read`, `search`

---

### getService

Get complete details for a specific service.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `serviceId` | UUID | Yes | - | Service ID |

**Tags:** `read`

---

### getServicesByStaff

Get all services a staff member can perform.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Staff member ID |
| `includeInactive` | boolean | No | false | Include inactive services |

**Tags:** `read`

---

### getPopularServices

Get the most frequently booked services.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Top N services (1-50) |
| `timeRange` | enum | No | `month` | `week`, `month`, `quarter` |
| `category` | enum | No | - | Filter by category |

**Tags:** `read`, `analytics`

---

### getServicePricing

Get detailed pricing for a service.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `serviceId` | UUID | Yes | - | Service ID |
| `staffId` | UUID | No | - | Get staff-specific pricing |
| `includeAddons` | boolean | No | true | Include add-on pricing |

**Tags:** `read`

---

## Tickets

Tools for managing sales transactions and checkout.

### getOpenTickets

Get all currently open tickets.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | No | - | Filter by staff |
| `includeDetails` | boolean | No | false | Include item details |
| `limit` | number | No | 50 | Max results (1-100) |

**Tags:** `read`, `list`

---

### getTicket

Get complete details for a specific ticket.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket ID |

**Tags:** `read`

---

### createTicket

Create a new ticket to track a sale.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Ticket owner |
| `clientId` | UUID | No | - | Client (optional for walk-ins) |
| `notes` | string | No | - | Internal notes |
| `source` | enum | No | `walk_in` | Ticket origin |
| `appointmentId` | UUID | No | - | Link to appointment |

**Tags:** `write`, `create`

---

### addTicketItem

Add a service or product to a ticket.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket to add to |
| `serviceId` | UUID | - | - | Service ID (XOR with productId) |
| `productId` | UUID | - | - | Product ID (XOR with serviceId) |
| `quantity` | number | No | 1 | Item quantity |
| `staffId` | UUID | Yes | - | Staff who performed/sold |
| `price` | number | No | - | Price override |
| `notes` | string | No | - | Item-specific notes |

**Note:** Must specify either `serviceId` OR `productId`, not both.

**Tags:** `write`, `update`

---

### applyDiscount

Apply a discount to a ticket or item.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket to discount |
| `discountType` | enum | Yes | - | `percentage`, `fixed_amount`, `complimentary`, `price_override` |
| `value` | number | Yes | - | Discount value |
| `reason` | string | Yes | - | Reason (for audit) |
| `itemId` | UUID | No | - | Apply to specific item |
| `promotionCode` | string | No | - | Promo code if applicable |

**Permission:** Requires `staff` level. Large discounts may require manager approval.

**Tags:** `write`, `update`, `sensitive`

---

### closeTicket

Close a ticket by processing payment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket to close |
| `paymentMethod` | enum | Yes | - | Payment method |
| `tipAmount` | number | No | - | Tip in dollars |
| `tipRecipientId` | UUID | No | - | Tip recipient (defaults to owner) |
| `splitPayments` | array | No | - | For split payments |
| `printReceipt` | boolean | No | true | Print receipt |
| `emailReceipt` | boolean | No | false | Email receipt |
| `sendSmsReceipt` | boolean | No | false | SMS receipt |

**Payment methods:** `cash`, `credit_card`, `debit_card`, `gift_card`, `loyalty_points`, `check`, `house_account`, `split`, `other`

**Tags:** `write`, `update`

---

### voidTicket

Void (cancel) an entire ticket.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket to void |
| `reason` | string | Yes | - | Detailed reason (min 5 chars) |
| `managerApproval` | boolean | Yes | - | Confirm manager approved |
| `managerPin` | string | No | - | Manager PIN if required |
| `refundPayment` | boolean | No | false | Process refund |

**Permission:** Requires `manager` level

**Tags:** `write`, `delete`, `sensitive`

---

### removeTicketItem

Remove an item from an open ticket.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticketId` | UUID | Yes | - | Ticket ID |
| `itemId` | UUID | Yes | - | Item to remove |
| `reason` | string | No | - | Reason (recommended) |

**Note:** Cannot remove items from closed tickets.

**Tags:** `write`, `delete`

---

## Staff

Tools for staff schedules, availability, and performance.

### searchStaff

Search for staff members by name, role, or availability.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | No | - | Search name/nickname |
| `role` | enum | No | - | Filter by role |
| `available` | boolean | No | - | Currently available only |
| `canPerformServiceId` | UUID | No | - | Qualified for service |
| `includeInactive` | boolean | No | false | Include inactive staff |
| `limit` | number | No | 20 | Max results (1-100) |
| `offset` | number | No | 0 | Pagination offset |

**Roles:** `stylist`, `colorist`, `nail_tech`, `esthetician`, `massage_therapist`, `barber`, `receptionist`, `manager`, `assistant`, `apprentice`, `owner`, `other`

**Tags:** `read`, `search`

---

### getStaff

Get complete details for a specific staff member.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Staff member ID |
| `includePerformance` | boolean | No | false | Include metrics (needs permission) |
| `includeSchedule` | boolean | No | false | Include 7-day schedule |

**Tags:** `read`

---

### getStaffSchedule

Get a staff member's schedule for a date range.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Staff member ID |
| `startDate` | YYYY-MM-DD | Yes | - | Range start |
| `endDate` | YYYY-MM-DD | Yes | - | Range end (max 30 days) |
| `includeAppointments` | boolean | No | true | Include appointments |
| `includeTimeOff` | boolean | No | true | Include time off |

**Tags:** `read`, `schedule`

---

### getStaffAvailability

Get available time slots for a staff member on a date.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Staff member ID |
| `date` | YYYY-MM-DD | Yes | - | Date to check |
| `serviceId` | UUID | No | - | Filter by service duration |
| `minDurationMinutes` | number | No | - | Minimum slot duration |
| `startTime` | HH:MM | No | - | Start looking from |
| `endTime` | HH:MM | No | - | Stop looking after |

**Tags:** `read`, `availability`

---

### getOnDutyStaff

Get all staff members currently on duty.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | YYYY-MM-DD | No | today | Date to check |
| `time` | HH:MM | No | now | Time to check (24hr) |
| `role` | enum | No | - | Filter by role |
| `includeStatus` | boolean | No | true | Include current status |

**Status values:** `available`, `busy`, `on_break`, `off_duty`, `checked_out`

**Tags:** `read`

---

### getStaffPerformance

Get performance metrics for a staff member.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `staffId` | UUID | Yes | - | Staff member ID |
| `period` | enum | No | `month` | `week`, `month`, `quarter` |
| `includeRevenue` | boolean | No | true | Include revenue (needs permission) |
| `includeRatings` | boolean | No | true | Include ratings/reviews |
| `includeProductivity` | boolean | No | true | Include productivity metrics |
| `compareToAverage` | boolean | No | false | Compare to store average |

**Permission:** Requires `manager` level

**Tags:** `read`, `analytics`, `performance`

---

## Analytics

Tools for business metrics, reports, and insights.

### getDashboardMetrics

Get key dashboard metrics for a quick business overview.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | YYYY-MM-DD | No | today | Date to get metrics for |
| `includeComparison` | boolean | No | true | Compare to yesterday/last week |
| `includeStaffBreakdown` | boolean | No | false | Breakdown by staff (needs permission) |
| `includeGoals` | boolean | No | true | Show progress toward goals |

**Tags:** `read`, `analytics`, `dashboard`

---

### getSalesReport

Get detailed sales report for a time period.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | enum | No | `month` | `today`, `week`, `month`, `quarter`, `year`, `custom` |
| `startDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `endDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `comparison` | enum | No | `previous_period` | `previous_period`, `same_period_last_year`, `none` |
| `granularity` | enum | No | `day` | `hour`, `day`, `week`, `month` |
| `includeServiceBreakdown` | boolean | No | true | By service category |
| `includeProductBreakdown` | boolean | No | true | By product category |
| `includePaymentMethods` | boolean | No | true | By payment method |
| `includeStaffBreakdown` | boolean | No | false | By staff (needs permission) |
| `includeDiscounts` | boolean | No | true | Discount analysis |
| `includeTips` | boolean | No | true | Tip totals |

**Permission:** Requires `manager` level

**Tags:** `read`, `analytics`, `financial`, `report`

---

### getClientRetention

Get client retention and loyalty metrics.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | enum | No | `quarter` | Time period |
| `startDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `endDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `comparison` | enum | No | `previous_period` | Comparison period |
| `includeChurnAnalysis` | boolean | No | true | Include churn metrics |
| `includeNewClientSources` | boolean | No | true | How clients found business |
| `includeTopClients` | boolean | No | false | Top clients list (needs permission) |
| `topClientLimit` | number | No | 10 | Number of top clients (1-50) |
| `churnThresholdDays` | number | No | 90 | Days without visit = churned |

**Permission:** Requires `manager` level

**Tags:** `read`, `analytics`, `clients`, `retention`

---

### getServicePopularity

Get service popularity and performance metrics.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | enum | No | `month` | Time period |
| `startDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `endDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `comparison` | enum | No | `previous_period` | Comparison period |
| `sortBy` | enum | No | `bookings` | `bookings`, `revenue`, `growth`, `average_ticket` |
| `category` | string | No | - | Filter by category |
| `limit` | number | No | 10 | Top N services (1-50) |
| `includeStaffPerformance` | boolean | No | false | By staff (needs permission) |
| `includeTrends` | boolean | No | true | Trend data |

**Tags:** `read`, `analytics`, `services`

---

### getPeakHours

Get peak hours analysis for scheduling optimization.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | enum | No | `month` | Time period |
| `startDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `endDate` | YYYY-MM-DD | - | - | Required if `custom` |
| `metric` | enum | No | `bookings` | `bookings`, `revenue`, `staff_utilization`, `walk_ins` |
| `dayOfWeek` | enum | No | `all` | Day filter or `all`, `weekdays`, `weekends` |
| `includeHeatmap` | boolean | No | true | Day-hour heatmap data |
| `includeRecommendations` | boolean | No | true | Staffing/scheduling suggestions |

**Tags:** `read`, `analytics`, `scheduling`, `optimization`

---

## System

Tools for store context, business hours, and system utilities.

### getStoreInfo

Get store information and settings.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeSettings` | boolean | No | false | Booking rules, policies |
| `includeStaff` | boolean | No | false | Active staff list |
| `includeServices` | boolean | No | false | Services offered |

**Tags:** `read`, `system`, `context`

---

### getCurrentTime

Get the current date and time in the store's timezone.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | enum | No | `iso` | `iso`, `human`, `components` |
| `includeTimezone` | boolean | No | true | Include timezone info |

**Tags:** `read`, `system`, `time`

---

### getBusinessHours

Get the store's business hours.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | YYYY-MM-DD | No | - | Get hours for specific date |
| `includeSpecialHours` | boolean | No | true | Include holidays/events |
| `daysAhead` | number | No | 14 | How far ahead for special hours (0-90) |

**Tags:** `read`, `system`, `hours`

---

### isStoreOpen

Check if the store is currently open.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | YYYY-MM-DD | No | today | Date to check |
| `time` | HH:MM | No | now | Time to check (24hr) |
| `includeNextChange` | boolean | No | true | When store opens/closes next |

**Tags:** `read`, `system`, `hours`

---

### getSystemStatus

Get system health status and capabilities.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeFeatureFlags` | boolean | No | false | Enabled/disabled features |
| `includeIntegrations` | boolean | No | false | Third-party integration status |
| `includeAlerts` | boolean | No | true | Active system alerts |

**Tags:** `read`, `system`, `health`

---

### logAIAction

Log an AI action for auditing purposes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | Yes | - | Action description (max 100 chars) |
| `category` | enum | Yes | - | `booking`, `client`, `ticket`, `staff`, `system`, `recommendation`, `other` |
| `details` | object | No | - | Additional structured details |
| `reasoning` | string | No | - | AI's reasoning (max 500 chars) |
| `relatedEntityType` | enum | No | - | Entity type this relates to |
| `relatedEntityId` | UUID | No | - | Entity ID |
| `severity` | enum | No | `info` | `info`, `warning`, `important` |

**Tags:** `write`, `system`, `audit`

---

## Permission Levels

Some tools require specific permission levels:

| Level | Description | Required For |
|-------|-------------|--------------|
| `staff` | Basic staff member | `cancelAppointment`, `applyDiscount` |
| `manager` | Manager or higher | `voidTicket`, `getSalesReport`, `getClientRetention`, `getStaffPerformance` |
| `admin` | Administrator only | (none currently) |

Tools without permission requirements can be used by any authenticated user.

---

## Common Parameters

### UUID Format

All IDs use UUID v4 format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Date Formats

- **Date only:** `YYYY-MM-DD` (e.g., `2024-01-15`)
- **Datetime:** ISO 8601 with timezone (e.g., `2024-01-15T14:30:00-05:00`)
- **Time only:** `HH:MM` 24-hour format (e.g., `14:30`)

### Pagination

Tools supporting pagination use:
- `limit`: Maximum items to return
- `offset`: Number of items to skip

Response includes:
- `total`: Total matching items
- `hasMore`: Whether more items exist
