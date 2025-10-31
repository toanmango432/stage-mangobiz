import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Clock, DollarSign, Briefcase } from 'lucide-react';
import { Staff, StaffSchedule } from '../../types/staff';
import { StaffStatus } from '../../types/common';

interface AddEditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Partial<Staff>) => void;
  staff?: Staff | null;
  mode: 'add' | 'edit';
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AddEditStaffModal({ isOpen, onClose, onSave, staff, mode }: AddEditStaffModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    status: 'available' as StaffStatus,
    schedule: DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: index >= 1 && index <= 5 // Mon-Fri by default
    })) as StaffSchedule[]
  });

  useEffect(() => {
    if (staff && mode === 'edit') {
      setFormData({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        specialties: staff.specialties,
        status: staff.status,
        schedule: staff.schedule
      });
    }
  }, [staff, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      ...(mode === 'edit' && staff ? { id: staff.id } : {})
    });
    onClose();
  };

  const updateSchedule = (dayIndex: number, field: keyof StaffSchedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, idx) =>
        idx === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'add' ? 'Add New Staff' : 'Edit Staff'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'add' ? 'Add a new team member' : 'Update staff information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-teal-500" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="break">On Break</option>
                  <option value="off">Off Duty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-teal-500" />
              Weekly Schedule
            </h3>
            
            <div className="space-y-3">
              {formData.schedule.map((day, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={day.isAvailable}
                      onChange={(e) => updateSchedule(index, 'isAvailable', e.target.checked)}
                      className="w-5 h-5 text-teal-500 rounded focus:ring-teal-500"
                    />
                    <span className="w-24 text-sm font-medium text-gray-700">
                      {DAYS_OF_WEEK[index]}
                    </span>
                  </div>
                  
                  {day.isAvailable && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all font-medium shadow-lg shadow-teal-500/30"
          >
            {mode === 'add' ? 'Add Staff' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
