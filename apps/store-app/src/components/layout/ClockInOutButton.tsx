import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, Loader2, AlertCircle, CheckCircle, User, LogIn, LogOut, Users, ChevronLeft, Search } from 'lucide-react';
import type { AppDispatch } from '../../store';
import {
  clockIn,
  clockOut,
  fetchStaffShiftStatus,
} from '../../store/slices/timesheetSlice';
import { selectStoreId } from '../../store/slices/authSlice';
import { authService } from '../../services/supabase/authService';
import { timesheetDB } from '../../db/timesheetOperations';
import { teamDB } from '../../db/teamOperations';
import type { TeamMemberSettings } from '../team-settings/types';

/**
 * ClockInOutButton - Punch clock for staff time tracking
 *
 * Flow for Regular Staff:
 * 1. Staff clicks the clock button
 * 2. PIN entry modal appears
 * 3. After PIN verification, system checks if staff is clocked in/out
 * 4. Performs the opposite action (clock in if out, clock out if in)
 *
 * Flow for Admin (owner/manager):
 * 1. Admin clicks the clock button
 * 2. PIN entry modal appears
 * 3. After PIN verification, admin sees two options:
 *    - "Clock Myself" - proceed as regular staff
 *    - "Clock Other Staff" - show staff list to select who to clock
 * 4. Perform clock action for selected staff
 */

interface VerifiedStaff {
  memberId: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ShiftInfo {
  isClockedIn: boolean;
  clockInTime: string | null;
  totalWorkedMinutes: number;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  avatar?: string;
}

// Admin roles that can clock in/out other staff
const ADMIN_ROLES = ['owner', 'manager', 'admin'];

export function ClockInOutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const storeId = useSelector(selectStoreId) || 'default-store';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'pin' | 'loading' | 'admin-choice' | 'staff-list' | 'confirm' | 'success'>('pin');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [verifiedStaff, setVerifiedStaff] = useState<VerifiedStaff | null>(null);
  const [targetStaff, setTargetStaff] = useState<StaffMember | null>(null); // Who we're clocking in/out
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = verifiedStaff && ADMIN_ROLES.includes(verifiedStaff.role);

  // Reset modal state when closed
  useEffect(() => {
    if (!isModalOpen) {
      setStep('pin');
      setPin(['', '', '', '', '', '']);
      setError(null);
      setVerifiedStaff(null);
      setTargetStaff(null);
      setShiftInfo(null);
      setIsProcessing(false);
      setStaffList([]);
      setStaffSearch('');
    }
  }, [isModalOpen]);

  // Focus first input when modal opens or returns to PIN step
  useEffect(() => {
    if (isModalOpen && step === 'pin' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isModalOpen, step]);

  // Focus search input when entering staff list
  useEffect(() => {
    if (step === 'staff-list' && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Format time for display
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatWorkedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Load staff list for admin
  const loadStaffList = async () => {
    setLoadingStaff(true);
    try {
      const members = await teamDB.getActiveMembers(storeId);
      const staffMembers: StaffMember[] = members.map((m: TeamMemberSettings) => ({
        id: m.profile.id,
        firstName: m.profile.firstName,
        lastName: m.profile.lastName,
        displayName: m.profile.displayName || `${m.profile.firstName} ${m.profile.lastName}`,
        role: m.permissions.role,
        avatar: m.profile.avatar,
      }));
      setStaffList(staffMembers);
    } catch (err) {
      console.error('Failed to load staff list:', err);
      setError('Failed to load staff list');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Load shift status for a staff member
  const loadShiftStatus = async (staffId: string) => {
    const status = await timesheetDB.getStaffShiftStatus(storeId, staffId);
    setShiftInfo({
      isClockedIn: status.isClockedIn,
      clockInTime: status.clockInTime,
      totalWorkedMinutes: status.totalWorkedMinutes,
    });
  };

  // Verify PIN and get staff info
  const handlePinSubmit = useCallback(async (enteredPin?: string) => {
    const pinToVerify = enteredPin || pin.join('');
    if (pinToVerify.length < 4) return;

    setStep('loading');
    setError(null);

    try {
      // Verify PIN and get member info
      const memberSession = await authService.loginMemberWithPin(storeId, pinToVerify);

      const staff: VerifiedStaff = {
        memberId: memberSession.memberId,
        firstName: memberSession.firstName,
        lastName: memberSession.lastName,
        role: memberSession.role,
      };
      setVerifiedStaff(staff);

      // Check if admin role
      if (ADMIN_ROLES.includes(staff.role)) {
        // Show admin choice
        setStep('admin-choice');
      } else {
        // Regular staff - go directly to confirm
        setTargetStaff({
          id: staff.memberId,
          firstName: staff.firstName,
          lastName: staff.lastName,
          displayName: `${staff.firstName} ${staff.lastName}`,
          role: staff.role,
        });
        await loadShiftStatus(staff.memberId);
        setStep('confirm');
      }
    } catch (err: unknown) {
      console.error('PIN verification failed:', err);
      setError('Invalid PIN');
      setPin(['', '', '', '', '', '']);
      setStep('pin');
      inputRefs.current[0]?.focus();
    }
  }, [pin, storeId]);

  // Admin chooses to clock themselves
  const handleClockMyself = async () => {
    if (!verifiedStaff) return;
    setTargetStaff({
      id: verifiedStaff.memberId,
      firstName: verifiedStaff.firstName,
      lastName: verifiedStaff.lastName,
      displayName: `${verifiedStaff.firstName} ${verifiedStaff.lastName}`,
      role: verifiedStaff.role,
    });
    setStep('loading');
    await loadShiftStatus(verifiedStaff.memberId);
    setStep('confirm');
  };

  // Admin chooses to clock another staff
  const handleClockOther = async () => {
    setStep('loading');
    await loadStaffList();
    setStep('staff-list');
  };

  // Admin selects a staff member from list
  const handleSelectStaff = async (staff: StaffMember) => {
    setTargetStaff(staff);
    setStep('loading');
    await loadShiftStatus(staff.id);
    setStep('confirm');
  };

  // Perform clock in/out action
  const handleClockAction = async () => {
    if (!targetStaff || !shiftInfo) return;

    setIsProcessing(true);
    setError(null);
    try {
      if (shiftInfo.isClockedIn) {
        // Clock out
        await dispatch(clockOut({ staffId: targetStaff.id })).unwrap();
      } else {
        // Clock in
        await dispatch(clockIn({ staffId: targetStaff.id })).unwrap();
      }

      // Refresh status
      await dispatch(fetchStaffShiftStatus({ staffId: targetStaff.id }));

      setStep('success');

      // Auto-close after success
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Clock action failed:', err);
      setError('Failed to record time. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter staff list by search
  const filteredStaff = staffList.filter(staff => {
    const searchLower = staffSearch.toLowerCase();
    return (
      staff.firstName.toLowerCase().includes(searchLower) ||
      staff.lastName.toLowerCase().includes(searchLower) ||
      staff.displayName.toLowerCase().includes(searchLower)
    );
  });

  // PIN input handlers
  const handlePinChange = useCallback((index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 4+ digits entered
    const enteredPin = newPin.join('');
    if (enteredPin.length >= 4 && !newPin.slice(0, 4).includes('')) {
      const hasMoreDigits = newPin.slice(4).some(d => d !== '');
      if (!hasMoreDigits && index === 3) {
        handlePinSubmit(enteredPin.slice(0, 4));
      } else if (enteredPin.length === 6) {
        handlePinSubmit(enteredPin);
      }
    }
  }, [pin, handlePinSubmit]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const enteredPin = pin.join('');
      if (enteredPin.length >= 4) {
        handlePinSubmit(enteredPin);
      }
    }
  }, [pin, handlePinSubmit]);

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="
          relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg
          bg-white/60 hover:bg-white/80 border border-gray-200/60
          backdrop-blur-sm transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
        "
        aria-label="Clock In/Out"
      >
        {/* Punch Clock Icon */}
        <div className="relative w-5 h-5 md:w-6 md:h-6">
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full text-gray-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l3 3" />
            <path d="M7 21l-4 0l0 -4" className="text-orange-500" />
            <path d="M3 21l6 -6" className="text-orange-500" />
          </svg>
        </div>

        <span className="hidden sm:inline text-[10px] md:text-xs font-medium text-gray-600">
          Clock
        </span>
      </button>

      {/* Modal */}
      {isModalOpen && (() => {
        const modalRoot = document.getElementById('pin-modal-root');
        if (!modalRoot) return null;

        const modalContent = (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !isProcessing && setIsModalOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {/* Back button for staff-list and confirm steps when admin */}
                {(step === 'staff-list' || (step === 'confirm' && isAdmin)) && (
                  <button
                    onClick={() => {
                      if (step === 'staff-list') {
                        setStep('admin-choice');
                      } else if (step === 'confirm' && isAdmin) {
                        setTargetStaff(null);
                        setShiftInfo(null);
                        setStep('admin-choice');
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 6v6l3 3" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Time Clock</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isProcessing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* PIN Entry Step */}
              {step === 'pin' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                      <User className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-gray-600">Enter your PIN to clock in/out</p>
                  </div>

                  {/* PIN Input */}
                  <div className="flex justify-center gap-2">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        className={`
                          w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                          transition-all
                          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                          ${digit ? 'bg-orange-50 border-orange-300' : 'bg-gray-50'}
                          ${index >= 4 ? 'opacity-50' : ''}
                        `}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    Enter your 4-6 digit PIN
                  </p>
                </div>
              )}

              {/* Loading Step */}
              {step === 'loading' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              )}

              {/* Admin Choice Step */}
              {step === 'admin-choice' && verifiedStaff && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      {getInitials(verifiedStaff.firstName, verifiedStaff.lastName)}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      Hi, {verifiedStaff.firstName}!
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{verifiedStaff.role}</p>
                  </div>

                  <p className="text-sm text-gray-600 text-center">
                    What would you like to do?
                  </p>

                  <div className="space-y-3">
                    {/* Clock Myself Button */}
                    <button
                      onClick={handleClockMyself}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Clock Myself</p>
                        <p className="text-xs text-gray-500">Punch in or out for your shift</p>
                      </div>
                    </button>

                    {/* Clock Other Staff Button */}
                    <button
                      onClick={handleClockOther}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Clock Other Staff</p>
                        <p className="text-xs text-gray-500">Manage time for another team member</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Staff List Step (Admin) */}
              {step === 'staff-list' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Select a staff member to clock in/out
                  </p>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search staff..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Staff List */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingStaff ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                      </div>
                    ) : filteredStaff.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No staff found</p>
                      </div>
                    ) : (
                      filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => handleSelectStaff(staff)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getInitials(staff.firstName, staff.lastName)}
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-medium text-gray-900">{staff.displayName}</p>
                            <p className="text-xs text-gray-500 capitalize">{staff.role}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation Step */}
              {step === 'confirm' && targetStaff && shiftInfo && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                      {getInitials(targetStaff.firstName, targetStaff.lastName)}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {targetStaff.firstName} {targetStaff.lastName}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{targetStaff.role}</p>
                    {isAdmin && targetStaff.id !== verifiedStaff?.memberId && (
                      <p className="text-xs text-blue-600 mt-1">
                        (Managed by {verifiedStaff?.firstName})
                      </p>
                    )}
                  </div>

                  {/* Current Status */}
                  <div className={`p-4 rounded-xl ${shiftInfo.isClockedIn ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Status:</span>
                      <span className={`text-sm font-semibold ${shiftInfo.isClockedIn ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {shiftInfo.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                      </span>
                    </div>
                    {shiftInfo.isClockedIn && shiftInfo.clockInTime && (
                      <>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">Since:</span>
                          <span className="text-sm font-medium text-gray-700">{formatTime(shiftInfo.clockInTime)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500">Worked:</span>
                          <span className="text-sm font-semibold text-emerald-600">{formatWorkedTime(shiftInfo.totalWorkedMinutes)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleClockAction}
                    disabled={isProcessing}
                    className={`
                      w-full flex items-center justify-center gap-3 py-4 rounded-xl
                      font-semibold text-lg transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${shiftInfo.isClockedIn
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : shiftInfo.isClockedIn ? (
                      <>
                        <LogOut className="w-6 h-6" />
                        Clock Out
                      </>
                    ) : (
                      <>
                        <LogIn className="w-6 h-6" />
                        Clock In
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Success Step */}
              {step === 'success' && targetStaff && shiftInfo && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {shiftInfo.isClockedIn ? 'Clocked Out!' : 'Clocked In!'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {targetStaff.firstName}'s time has been recorded.
                  </p>
                  {shiftInfo.isClockedIn && (
                    <p className="text-sm font-medium text-emerald-600 mt-2">
                      Total: {formatWorkedTime(shiftInfo.totalWorkedMinutes)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'pin' && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {step === 'admin-choice' && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setStep('pin');
                    setPin(['', '', '', '', '', '']);
                    setVerifiedStaff(null);
                  }}
                  className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
                >
                  Switch User
                </button>
              </div>
            )}

            {step === 'confirm' && !isAdmin && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setStep('pin');
                    setPin(['', '', '', '', '', '']);
                    setVerifiedStaff(null);
                    setTargetStaff(null);
                    setShiftInfo(null);
                  }}
                  disabled={isProcessing}
                  className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm disabled:opacity-50"
                >
                  Switch User
                </button>
              </div>
            )}
            </div>
          </div>
        );

        return createPortal(modalContent, modalRoot);
      })()}
    </>
  );
}
