import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Staff } from '../../types/staff';
import { AddEditStaffModal } from './AddEditStaffModal';

interface StaffManagementPageProps {
  staff: Staff[];
  onAddStaff: (staff: Partial<Staff>) => void;
  onEditStaff: (staff: Partial<Staff>) => void;
  onDeleteStaff: (staffId: string) => void;
}

export function StaffManagementPage({ staff, onAddStaff, onEditStaff, onDeleteStaff }: StaffManagementPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleAddClick = () => {
    setModalMode('add');
    setSelectedStaff(null);
    setShowModal(true);
  };

  const handleEditClick = (staffMember: Staff) => {
    setModalMode('edit');
    setSelectedStaff(staffMember);
    setShowModal(true);
  };

  const handleSave = (staffData: Partial<Staff>) => {
    if (modalMode === 'add') {
      onAddStaff(staffData);
    } else {
      onEditStaff(staffData);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-amber-100 text-amber-700';
      case 'break': return 'bg-blue-100 text-blue-700';
      case 'off': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-600">{staff.length} team members</p>
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Staff</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="break">On Break</option>
              <option value="off">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="bg-white rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all p-5 space-y-4"
            >
              {/* Avatar and Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {staffMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staffMember.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staffMember.status)}`}>
                      {staffMember.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📧</span>
                  <span className="truncate">{staffMember.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">📱</span>
                  <span>{staffMember.phone}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{staffMember.servicesCountToday}</div>
                  <div className="text-xs text-gray-500">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">${staffMember.revenueToday}</div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">${staffMember.tipsToday}</div>
                  <div className="text-xs text-gray-500">Tips</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEditClick(staffMember)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${staffMember.name}?`)) {
                      onDeleteStaff(staffMember.id);
                    }
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first team member'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={handleAddClick}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Staff Member</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AddEditStaffModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        staff={selectedStaff}
        mode={modalMode}
      />
    </div>
  );
}
