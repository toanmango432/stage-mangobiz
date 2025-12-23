import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Staff } from '../../types/staff';
import { AddEditStaffModal } from './AddEditStaffModal';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Badge } from '../ui';

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

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'available': return 'secondary';
      case 'busy': return 'destructive';
      case 'break': return 'outline';
      case 'off': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-600">{staff.length} team members</p>
            </div>
          </div>
          <Button
            onClick={handleAddClick}
            variant="default"
            className="shadow-lg shadow-brand-500/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Staff
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input {...({} as any)}
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              fullWidth
            />
          </div>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
                <SelectItem value="off">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-brand-300 hover:shadow-lg transition-all space-y-4"
            >
              {/* Avatar and Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {staffMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staffMember.name}</h3>
                    <Badge variant={getStatusVariant(staffMember.status)}>
                      {staffMember.status}
                    </Badge>
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
                <Button
                  onClick={() => handleEditClick(staffMember)}
                  variant="secondary"
                  size="sm"
                  className="flex-1 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${staffMember.name}?`)) {
                      onDeleteStaff(staffMember.id);
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200 shadow-none"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
              <Button
                onClick={handleAddClick}
                variant="default"
                className="shadow-lg shadow-brand-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Staff Member
              </Button>
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
    </div >
  );
}
