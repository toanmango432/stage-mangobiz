/**
 * SwitchUserModal Utilities
 *
 * Helper functions for the switch user modal.
 */

/**
 * Get initials from a member's name.
 * Accepts any object with firstName and lastName properties.
 */
export function getInitials(member: { firstName?: string | null; lastName?: string | null }): string {
  const first = member.firstName?.[0] || '';
  const last = member.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Staff',
    receptionist: 'Receptionist',
    junior: 'Junior',
  };
  return labels[role] || role;
}

/**
 * Get Tailwind CSS classes for role badge colors.
 */
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    staff: 'bg-green-100 text-green-700',
    receptionist: 'bg-orange-100 text-orange-700',
    junior: 'bg-gray-100 text-gray-600',
  };
  return colors[role] || 'bg-gray-100 text-gray-600';
}
