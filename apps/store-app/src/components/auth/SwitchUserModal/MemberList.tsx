/**
 * MemberList Component
 *
 * Displays the list of staff members for user switching.
 * Shows current user indicator and staff selection list.
 */

import { User, Lock, Loader2, AlertCircle, WifiOff, Clock } from 'lucide-react';
import { getInitials, getRoleLabel, getRoleColor } from './utils';
import type { MemberListProps } from './types';

export function MemberList({
  members,
  currentMember,
  fetchingMembers,
  error,
  isOnline,
  loginContext,
  onMemberSelect,
  onLogoutCurrentMember,
  onRetry,
}: MemberListProps) {
  return (
    <div className="space-y-4">
      {/* Current User Indicator */}
      {currentMember && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(currentMember)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {currentMember.firstName} {currentMember.lastName}
              </p>
              <p className="text-xs text-blue-600">Currently signed in</p>
            </div>
          </div>
          <button
            onClick={onLogoutCurrentMember}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Staff List */}
      <div>
        <p className="text-sm text-gray-500 mb-3">
          Select a staff member to switch to:
        </p>

        {fetchingMembers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-500">Loading staff...</span>
          </div>
        ) : error && error.includes('Failed to load') ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-2" />
            <p className="text-gray-500">{error}</p>
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No staff members found</p>
            <p className="text-xs text-gray-400 mt-1">
              Add staff in Team Settings
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {members.map((member) => {
              const isCurrentUser = currentMember?.memberId === member.memberId;
              const isLocked = member.lockoutInfo?.isLocked;
              const needsPinButHasNone =
                (loginContext === 'store' || !isOnline) && !member.hasPinSetup;
              const hasGraceWarning =
                loginContext === 'store' &&
                member.graceInfo &&
                member.graceInfo.daysRemaining <= 2 &&
                member.graceInfo.isValid;

              return (
                <button
                  key={member.memberId}
                  onClick={() => !isCurrentUser && onMemberSelect(member)}
                  disabled={isCurrentUser}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isCurrentUser
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                      : isLocked
                        ? 'bg-red-50 border-red-200 cursor-pointer'
                        : needsPinButHasNone
                          ? 'bg-amber-50 border-amber-200 cursor-pointer'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                    }
                  `}
                >
                  {/* Avatar */}
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(member)}
                    </div>
                  )}

                  {/* Name & Role */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-blue-600">Current</span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] text-red-600 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Locked ({member.lockoutInfo?.remainingMinutes}m)
                        </span>
                      )}
                      {needsPinButHasNone && !isOnline && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                          <WifiOff className="w-2.5 h-2.5" />
                          No PIN
                        </span>
                      )}
                      {hasGraceWarning && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {member.graceInfo?.daysRemaining}d left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!isCurrentUser && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberList;
