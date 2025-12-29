import { FrontDeskSettingsData } from './types';

// Default settings for FrontDesk
export const defaultFrontDeskSettings: FrontDeskSettingsData = {
  // Operation Template
  operationTemplate: 'frontDeskBalanced',

  // Team Settings
  organizeBy: 'busyStatus',
  showTurnCount: true,
  showNextAppointment: true,
  showServicedAmount: true,
  showTicketCount: true,
  showLastDone: true,
  showMoreOptionsButton: true,
  viewWidth: 'wide',
  customWidthPercentage: 40,

  // Ticket Settings
  displayMode: 'column',
  viewStyle: 'expanded',
  showWaitList: true,
  showInService: true,
  showPending: true,
  closedTicketsPlacement: 'floating',
  sortBy: 'queue',
  combineSections: false,

  // Workflow & Rules
  showComingAppointments: true,
  comingAppointmentsDefaultState: 'expanded',
  enableDragAndDrop: true,
  autoCloseAfterCheckout: false,
  autoNoShowCancel: false,
  autoNoShowTime: 30,
  alertPendingTime: false,
  pendingAlertMinutes: 15,

  // UI Controls - Team
  showAddTicketAction: true,
  showAddNoteAction: true,
  showEditTeamAction: true,
  showQuickCheckoutAction: true,

  // UI Controls - Ticket
  showApplyDiscountAction: true,
  showRedeemBenefitsAction: true,
  showTicketNoteAction: true,
  showStartServiceAction: true,
  showPendingPaymentAction: true,
  showDeleteTicketAction: true,

  // Workflow Activation
  waitListActive: true,
  inServiceActive: true,

  // Urgency Settings (Pending Section)
  urgencyEnabled: true,
  urgencyAttentionMinutes: 10,
  urgencyUrgentMinutes: 15,
  urgencyCriticalMinutes: 20
};