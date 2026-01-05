/**
 * Mock Data for TicketPanel
 *
 * These are sample tickets used for development and testing.
 * In production, these would come from the database.
 */

import type { OpenTicket } from "../MergeTicketsDialog";

export const MOCK_OPEN_TICKETS: OpenTicket[] = [
  {
    id: "ticket-1",
    client: {
      id: "client-1",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+1 555-123-4567",
      email: "sarah.j@email.com",
    },
    services: [
      { id: "s1", serviceId: "1", serviceName: "Haircut - Women", price: 65, duration: 60, status: "in_progress" as const },
      { id: "s2", serviceId: "3", serviceName: "Color - Full", price: 120, duration: 120, status: "not_started" as const },
    ],
    subtotal: 185,
    tax: 15.73,
    discount: 0,
    total: 200.73,
    createdAt: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "ticket-2",
    client: {
      id: "client-2",
      firstName: "Mike",
      lastName: "Chen",
      phone: "+1 555-987-6543",
    },
    services: [
      { id: "s3", serviceId: "2", serviceName: "Haircut - Men", price: 45, duration: 45, status: "completed" as const },
    ],
    subtotal: 45,
    tax: 3.83,
    discount: 0,
    total: 48.83,
    createdAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ticket-3",
    client: null,
    services: [
      { id: "s4", serviceId: "6", serviceName: "Manicure", price: 35, duration: 30, status: "in_progress" as const },
      { id: "s5", serviceId: "7", serviceName: "Pedicure", price: 50, duration: 45, status: "not_started" as const },
    ],
    subtotal: 85,
    tax: 7.23,
    discount: 10,
    total: 82.23,
    createdAt: new Date(Date.now() - 15 * 60000),
  },
];

// Storage key for keyboard hints dismissal
export const KEYBOARD_HINTS_DISMISSED_KEY = "mango-pos-keyboard-hints-dismissed";
