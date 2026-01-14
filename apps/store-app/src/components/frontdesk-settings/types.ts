// Types for all FrontDesk settings
export interface FrontDeskSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: FrontDeskSettingsData;
  onSettingsChange: (settings: Partial<FrontDeskSettingsData>) => void;
}

export interface FrontDeskSettingsData {
  // Operation Template
  operationTemplate: 'frontDeskBalanced' | 'frontDeskTicketCenter' | 'teamWithOperationFlow' | 'teamInOut';

  // Team Settings
  organizeBy: 'clockedStatus' | 'busyStatus';
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  viewWidth: 'ultraCompact' | 'compact' | 'wide' | 'fullScreen' | 'custom';
  customWidthPercentage: number;

  // Ticket Settings
  displayMode: 'column' | 'tab';
  viewStyle: 'expanded' | 'compact';
  showWaitList: boolean;
  showInService: boolean;
  showPending: boolean;
  closedTicketsPlacement: 'floating' | 'bottom' | 'hidden';
  sortBy: 'queue' | 'time';
  combineSections: boolean;

  // Workflow & Rules
  showComingAppointments: boolean;
  comingAppointmentsDefaultState: 'expanded' | 'collapsed';
  enableDragAndDrop: boolean;
  autoCloseAfterCheckout: boolean;
  autoNoShowCancel: boolean;
  autoNoShowTime: number;
  alertPendingTime: boolean;
  pendingAlertMinutes: number;

  // UI Controls - Team
  showAddTicketAction: boolean;
  showAddNoteAction: boolean;
  showEditTeamAction: boolean;
  showQuickCheckoutAction: boolean;
  showClockInOutAction: boolean;

  // UI Controls - Ticket
  showApplyDiscountAction: boolean;
  showRedeemBenefitsAction: boolean;
  showTicketNoteAction: boolean;
  showStartServiceAction: boolean;
  showPendingPaymentAction: boolean;
  showDeleteTicketAction: boolean;

  // Workflow Activation
  waitListActive: boolean;
  inServiceActive: boolean;

  // Urgency Settings (Pending Section)
  urgencyEnabled: boolean;
  urgencyAttentionMinutes: number;
  urgencyUrgentMinutes: number;
  urgencyCriticalMinutes: number;
}

// Template info type
export interface TemplateInfo {
  title: string;
  description: string;
  layoutRatio: {
    team: number;
    ticket: number;
  };
}

// Component prop types
export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: {
    value: string;
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

export interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
}

export interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export interface TemplateCardProps {
  id: string;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  layoutRatio: {
    team: number;
    ticket: number;
  };
}