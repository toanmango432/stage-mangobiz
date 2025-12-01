import React, { useState, useCallback, useMemo } from 'react';
import type { RolePermissions, StaffRole, PermissionLevel } from '../types';
import { permissionCategories, teamSettingsTokens, defaultPermissions } from '../constants';
import { Card, SectionHeader, Toggle, Button } from '../components/SharedComponents';
import { allDefaultRoles } from '../../role-settings/constants';
import type { QuickAccessPermissions } from '../../role-settings/types';

// Type for quick access defaults
type QuickAccessDefaults = Pick<RolePermissions,
  'canAccessAdminPortal' | 'canAccessReports' | 'canModifyPrices' |
  'canProcessRefunds' | 'canDeleteRecords' | 'canManageTeam' |
  'canViewOthersCalendar' | 'canBookForOthers' | 'canEditOthersAppointments'
>;

// Helper function to convert RoleDefinition permissions to QuickAccessDefaults
const convertToQuickAccessDefaults = (perms: QuickAccessPermissions): QuickAccessDefaults => ({
  canAccessAdminPortal: perms.canAccessAdminPortal,
  canAccessReports: perms.canAccessReports,
  canModifyPrices: perms.canModifyPrices,
  canProcessRefunds: perms.canProcessRefunds,
  canDeleteRecords: perms.canDeleteRecords,
  canManageTeam: perms.canManageTeam,
  canViewOthersCalendar: perms.canViewOthersCalendar,
  canBookForOthers: perms.canBookForOthers,
  canEditOthersAppointments: perms.canEditOthersAppointments,
});

// Generate role default permissions dynamically from role-settings
const generateRoleDefaultPermissions = (): Record<string, QuickAccessDefaults> => {
  const permissions: Record<string, QuickAccessDefaults> = {};
  allDefaultRoles.forEach(role => {
    permissions[role.id] = convertToQuickAccessDefaults(role.quickAccessPermissions);
  });
  return permissions;
};

// Generate role labels dynamically from role-settings
const generateRoleLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {};
  allDefaultRoles.forEach(role => {
    labels[role.id] = role.name;
  });
  return labels;
};

// Static exports for backwards compatibility
const roleDefaultPermissions = generateRoleDefaultPermissions();
const dynamicRoleLabels = generateRoleLabels();

interface PermissionsSectionProps {
  permissions: RolePermissions;
  onChange: (permissions: RolePermissions) => void;
}

export const PermissionsSection: React.FC<PermissionsSectionProps> = ({ permissions, onChange }) => {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Reset to role defaults handler
  const handleResetToDefaults = useCallback(() => {
    const defaults = roleDefaultPermissions[permissions.role];
    onChange({
      ...permissions,
      ...defaults,
      permissions: defaultPermissions, // Reset detailed permissions too
    });
    setShowResetConfirm(false);
  }, [permissions, onChange]);

  const updatePermission = (permissionId: string, level: PermissionLevel) => {
    onChange({
      ...permissions,
      permissions: permissions.permissions.map((p) =>
        p.id === permissionId ? { ...p, level } : p
      ),
    });
  };

  // Get current role definition from dynamic roles
  const currentRoleDefinition = useMemo(() => {
    return allDefaultRoles.find(r => r.id === permissions.role);
  }, [permissions.role]);

  // Get role color from either dynamic role or fallback to static tokens
  const getRoleColor = (roleId: string) => {
    const roleDef = allDefaultRoles.find(r => r.id === roleId);
    if (roleDef) {
      return {
        bg: roleDef.color.bg.replace('bg-', ''),
        text: roleDef.color.text.replace('text-', ''),
        border: roleDef.color.border.replace('border-', ''),
        bgClass: roleDef.color.bg,
        textClass: roleDef.color.text,
        borderClass: roleDef.color.border,
      };
    }
    // Fallback to static tokens
    const staticColor = teamSettingsTokens.roleColors[roleId as StaffRole];
    return staticColor ? {
      bg: staticColor.bg,
      text: staticColor.text,
      border: staticColor.border,
      bgClass: `bg-${staticColor.bg}`,
      textClass: `text-${staticColor.text}`,
      borderClass: `border-${staticColor.border}`,
    } : {
      bg: 'cyan-100',
      text: 'cyan-700',
      border: 'cyan-300',
      bgClass: 'bg-cyan-100',
      textClass: 'text-cyan-700',
      borderClass: 'border-cyan-300',
    };
  };

  const roleColor = getRoleColor(permissions.role);

  // Group permissions by category
  const permissionsByCategory = permissionCategories.map((category) => ({
    ...category,
    permissions: permissions.permissions.filter((p) => p.category === category.id),
  }));

  const handlePinSave = () => {
    if (newPin === confirmPin && newPin.length === 4) {
      onChange({ ...permissions, pin: newPin });
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
    }
  };

  const permissionLevelOptions = [
    { value: 'full', label: 'Full Access' },
    { value: 'limited', label: 'Limited' },
    { value: 'view_only', label: 'View Only' },
    { value: 'none', label: 'No Access' },
  ];

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card padding="lg">
        <SectionHeader
          title="Role & Position"
          subtitle="Assign a role to determine base permissions"
          icon={<ShieldIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Role
            </label>
            <select
              value={permissions.role}
              onChange={(e) => onChange({ ...permissions, role: e.target.value as StaffRole })}
              className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {allDefaultRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <div
              className={`w-full p-4 rounded-xl border-2 ${roleColor.bgClass} ${roleColor.borderClass}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${roleColor.borderClass.replace('border-', 'bg-')}`}
                >
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${roleColor.textClass}`}>
                    {currentRoleDefinition?.name || dynamicRoleLabels[permissions.role] || permissions.role}
                  </p>
                  <p className={`text-sm opacity-75 ${roleColor.textClass}`}>
                    {currentRoleDefinition?.description || getRoleDescription(permissions.role)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset to Defaults Button */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Reset to Role Defaults
          </Button>
        </div>
      </Card>

      {/* Quick Access Toggles */}
      <Card padding="lg">
        <SectionHeader
          title="Quick Access Settings"
          subtitle="High-level access controls"
          icon={<KeyIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canAccessAdminPortal}
              onChange={(enabled) => onChange({ ...permissions, canAccessAdminPortal: enabled })}
              label="Admin Portal Access"
              description="Access to admin back office and settings"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canAccessReports}
              onChange={(enabled) => onChange({ ...permissions, canAccessReports: enabled })}
              label="Reports & Analytics"
              description="View business reports and statistics"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canModifyPrices}
              onChange={(enabled) => onChange({ ...permissions, canModifyPrices: enabled })}
              label="Modify Prices"
              description="Change service and product prices"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canProcessRefunds}
              onChange={(enabled) => onChange({ ...permissions, canProcessRefunds: enabled })}
              label="Process Refunds"
              description="Issue refunds to clients"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canDeleteRecords}
              onChange={(enabled) => onChange({ ...permissions, canDeleteRecords: enabled })}
              label="Delete Records"
              description="Permanently delete appointments, clients"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canManageTeam}
              onChange={(enabled) => onChange({ ...permissions, canManageTeam: enabled })}
              label="Manage Team"
              description="Add, edit, and remove team members"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canViewOthersCalendar}
              onChange={(enabled) => onChange({ ...permissions, canViewOthersCalendar: enabled })}
              label="View Others' Calendar"
              description="See other team members' appointments"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canBookForOthers}
              onChange={(enabled) => onChange({ ...permissions, canBookForOthers: enabled })}
              label="Book for Others"
              description="Create appointments for other team members"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={permissions.canEditOthersAppointments}
              onChange={(enabled) => onChange({ ...permissions, canEditOthersAppointments: enabled })}
              label="Edit Others' Appointments"
              description="Modify appointments assigned to others"
            />
          </div>
        </div>
      </Card>

      {/* PIN Security */}
      <Card padding="lg">
        <SectionHeader
          title="Security PIN"
          subtitle="Require PIN for sensitive actions"
          icon={<LockIcon className="w-5 h-5" />}
        />

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <Toggle
            enabled={permissions.pinRequired}
            onChange={(enabled) => onChange({ ...permissions, pinRequired: enabled })}
            label="Require PIN"
            description="PIN will be required for checkout, refunds, and sensitive actions"
          />
        </div>

        {permissions.pinRequired && (
          <div className="p-4 border border-gray-200 rounded-xl">
            {permissions.pin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">PIN is set</p>
                    <p className="text-sm text-gray-500">PIN: ****</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPinSetup(true)}>
                  Change PIN
                </Button>
              </div>
            ) : showPinSetup ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New PIN
                    </label>
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4 digits"
                      maxLength={4}
                      className="w-full px-4 py-2 text-center text-xl tracking-widest border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4 digits"
                      maxLength={4}
                      className="w-full px-4 py-2 text-center text-xl tracking-widest border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                {newPin && confirmPin && newPin !== confirmPin && (
                  <p className="text-sm text-red-500">PINs do not match</p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowPinSetup(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePinSave}
                    disabled={newPin.length !== 4 || newPin !== confirmPin}
                  >
                    Save PIN
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">No PIN set</p>
                    <p className="text-sm text-gray-500">Set a 4-digit PIN for security</p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowPinSetup(true)}>
                  Set PIN
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Detailed Permissions */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader
            title="Detailed Permissions"
            subtitle="Fine-tune access for each feature"
            icon={<GridIcon className="w-5 h-5" />}
          />
        </div>

        <div className="divide-y divide-gray-100">
          {permissionsByCategory.map((category) => (
            <div key={category.id} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  {getCategoryIcon(category.id)}
                </div>
                <h4 className="font-semibold text-gray-900">{category.name}</h4>
              </div>

              <div className="space-y-3 ml-11">
                {category.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{permission.name}</p>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                    <div className="w-36">
                      <select
                        value={permission.level}
                        onChange={(e) =>
                          updatePermission(permission.id, e.target.value as PermissionLevel)
                        }
                        className={`
                          w-full px-3 py-1.5 text-xs font-medium rounded-lg border
                          focus:outline-none focus:ring-2 focus:ring-cyan-500
                          ${getPermissionLevelStyle(permission.level)}
                        `}
                      >
                        {permissionLevelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reset to Role Defaults?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will reset all permissions to the default settings for the <strong>{currentRoleDefinition?.name || dynamicRoleLabels[permissions.role] || permissions.role}</strong> role.
              Any custom permissions you've configured will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleResetToDefaults}>
                Reset Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Functions
const getRoleDescription = (role: StaffRole): string => {
  const descriptions: Record<StaffRole, string> = {
    owner: 'Full access to all features',
    manager: 'Manage staff and daily operations',
    senior_stylist: 'Experienced provider with extra permissions',
    stylist: 'Standard service provider',
    junior_stylist: 'Entry-level provider',
    apprentice: 'Training position with limited access',
    receptionist: 'Front desk and scheduling',
    assistant: 'Support role with basic access',
    nail_technician: 'Nail services specialist',
    esthetician: 'Skincare specialist',
    massage_therapist: 'Massage and body work specialist',
    barber: 'Barber and grooming specialist',
    colorist: 'Hair color specialist',
    makeup_artist: 'Makeup and beauty specialist',
  };
  return descriptions[role] || 'Team member';
};

const getPermissionLevelStyle = (level: PermissionLevel): string => {
  const styles: Record<PermissionLevel, string> = {
    full: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    limited: 'bg-amber-50 border-amber-200 text-amber-700',
    view_only: 'bg-blue-50 border-blue-200 text-blue-700',
    none: 'bg-gray-50 border-gray-200 text-gray-500',
  };
  return styles[level];
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    appointments: <CalendarIcon className="w-4 h-4" />,
    clients: <UsersIcon className="w-4 h-4" />,
    sales: <CreditCardIcon className="w-4 h-4" />,
    reports: <ChartIcon className="w-4 h-4" />,
    team: <TeamIcon className="w-4 h-4" />,
    settings: <CogIcon className="w-4 h-4" />,
    inventory: <BoxIcon className="w-4 h-4" />,
  };
  return icons[category] || <GridIcon className="w-4 h-4" />;
};

// Icons
const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TeamIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default PermissionsSection;
