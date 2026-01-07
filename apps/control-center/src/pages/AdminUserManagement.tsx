import { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  Power,
  Search,
  Shield,
  ShieldCheck,
  HeadphonesIcon,
  RefreshCcw,
  X,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { AdminUser, AdminRole, ADMIN_ROLE_PERMISSIONS } from '@/types';
import { adminUsersDB } from '@/db/supabaseDatabase';

interface AdminUserFormData {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}

const ROLE_CONFIG: Record<AdminRole, { label: string; icon: typeof Shield; color: string; bgColor: string }> = {
  super_admin: {
    label: 'Super Admin',
    icon: ShieldCheck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  support: {
    label: 'Support',
    icon: HeadphonesIcon,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
};

export function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AdminUserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'support',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Get current user ID from session
  const getCurrentUserId = (): string | null => {
    const session = localStorage.getItem('mango_admin_session');
    if (session) {
      try {
        return JSON.parse(session).id;
      } catch {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await adminUsersDB.getAll();
      // Sort by role priority, then by name
      const rolePriority: Record<AdminRole, number> = { super_admin: 1, admin: 2, support: 3 };
      allUsers.sort((a, b) => {
        const priorityDiff = rolePriority[a.role] - rolePriority[b.role];
        if (priorityDiff !== 0) return priorityDiff;
        return a.name.localeCompare(b.name);
      });
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleOpenModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'support',
      });
    }
    setFormError(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormError(null);
    setShowPassword(false);
  };

  const handleSave = async () => {
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    // Check for duplicate email
    const existingUser = await adminUsersDB.getByEmail(formData.email);
    if (existingUser && (!editingUser || existingUser.id !== editingUser.id)) {
      setFormError('An admin with this email already exists');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await adminUsersDB.update(editingUser.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        await adminUsersDB.create({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        });
      }
      await loadUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save admin user:', error);
      setFormError('Failed to save user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (user.id === currentUserId) {
      return; // Can't deactivate yourself
    }
    try {
      await adminUsersDB.update(user.id, { isActive: !user.isActive });
      await loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      return; // Can't delete yourself
    }
    try {
      await adminUsersDB.delete(userId);
      await loadUsers();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete admin user:', error);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-600 mt-1">Manage Control Center access and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Power className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Regular Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role];
                const RoleIcon = roleConfig.icon;
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleConfig.bgColor}`}>
                          <span className={`text-lg font-semibold ${roleConfig.color}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">You</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${roleConfig.bgColor} ${roleConfig.color} hover:opacity-80 transition-opacity`}
                      >
                        <RoleIcon className="w-4 h-4" />
                        {roleConfig.label}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.isActive
                                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No admin users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Panel */}
      {showPermissions && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Role Permissions: {ROLE_CONFIG[users.find(u => u.id === showPermissions)?.role || 'support'].label}
            </h3>
            <button
              onClick={() => setShowPermissions(null)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ADMIN_ROLE_PERMISSIONS[users.find(u => u.id === showPermissions)?.role || 'support'].map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-700">{permission.replace(':', ' › ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Edit Admin User' : 'Add New Admin'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                    placeholder={editingUser ? '••••••••' : 'Enter password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(ROLE_CONFIG) as AdminRole[]).map((role) => {
                    const config = ROLE_CONFIG[role];
                    const RoleIcon = config.icon;
                    const isSelected = formData.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `${config.bgColor} border-current ${config.color}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RoleIcon className={`w-6 h-6 ${isSelected ? config.color : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? config.color : 'text-gray-600'}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Admin User?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The user will lose all access to the Control Center.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
