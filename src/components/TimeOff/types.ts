export interface TimeOffRequest {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  endDate: string | null;
  shiftType: "full" | "partial";
  reason?: string;
  status: "pending" | "approved" | "declined";
  payrollImpact: boolean;
  submittedAt: string;
  submittedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}