import { useState, useEffect, useMemo } from 'react';
import { X, Plus, ChevronDown, ChevronUp, User, Clock, DollarSign, Trash2, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import type { Client, Service, Staff } from '../../types';
import type { LocalAppointment } from '../../types/appointment';
import { clientsDB, servicesDB } from '../../db/database';
import toast from 'react-hot-toast';
import { ModalContainer, ModalHeader } from '../common/ModalContainer';
import { ConfirmDialog } from '../common/ConfirmDialog';

// Guest with services assigned
interface GroupMember {
  id: string;
  clientId?: string; // If linked to actual client
  name: string;
  phone: string;
  email?: string;
  isExpanded: boolean; // For accordion behavior
  services: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    duration: number; // minutes
    price: number;
    staffId: string;
    staffName: string;
  }>;
}

interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  onSave?: (bookings: LocalAppointment[]) => void;
}

export function GroupBookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onSave
}: GroupBookingModalProps) {
  const storeId = useSelector((state: RootState) => state.user.activeSalonId);
  const allStaff = useSelector((state: RootState) => state.staff.staffList);

  // Group members state
  const [members, setMembers] = useState<GroupMember[]>([]);

  // Date & Time
  const [date, setDate] = useState<string>(
    selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>(
    selectedTime ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : '09:00'
  );

  // UI state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState<string | null>(null); // memberId
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Client[]>([]);

  // New member form (for walk-ins)
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Confirmation dialog state
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState(false);
  const [incompleteMembers, setIncompleteMembers] = useState<string[]>([]);

  // Load services and recent clients
  useEffect(() => {
    if (isOpen && storeId) {
      loadServices();
      loadRecentClients();
    }
  }, [isOpen, storeId]);

  const loadServices = async () => {
    if (!storeId) return;
    const services = await servicesDB.getAll(storeId);
    setAllServices(services.filter(s => s.isActive !== false));
  };

  const loadRecentClients = async () => {
    if (!storeId) return;
    const clients = await clientsDB.getAll(storeId);
    // Sort by last visit if that data exists, or just take first 5
    setRecentClients(clients.slice(0, 5));
  };

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (!clientSearch.trim() || !storeId) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const results = await clientsDB.search(storeId, clientSearch);
      setSearchResults(results);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientSearch, storeId]);

  // Group by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    allServices.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [allServices]);

  // Calculate totals
  const groupSummary = useMemo(() => {
    const totalServices = members.reduce((sum, m) => sum + m.services.length, 0);
    const totalCost = members.reduce((sum, m) =>
      sum + m.services.reduce((s, svc) => s + svc.price, 0), 0
    );
    const totalDuration = members.reduce((sum, m) =>
      sum + m.services.reduce((s, svc) => s + svc.duration, 0), 0
    );

    return {
      totalMembers: members.length,
      totalServices,
      totalCost,
      totalDuration,
      formattedDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`
    };
  }, [members]);

  // Handlers
  const handleAddMemberFromClient = (client: Client) => {
    // Check if already added
    if (members.some(m => m.clientId === client.id)) {
      toast.error(`${client.name} is already in this group`);
      return;
    }

    const newMember: GroupMember = {
      id: `member-${Date.now()}-${Math.random()}`,
      clientId: client.id,
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      isExpanded: true,
      services: []
    };

    setMembers([...members, newMember]);
    setShowAddMemberModal(false);
    setClientSearch('');
  };

  const handleAddWalkInMember = () => {
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      toast.error('Please enter name and phone number');
      return;
    }

    const newMember: GroupMember = {
      id: `member-${Date.now()}-${Math.random()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      email: newMemberEmail.trim() || undefined,
      isExpanded: true,
      services: []
    };

    setMembers([...members, newMember]);
    setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (memberId: string) => {
    if (members.length === 1) {
      toast.error('Group booking must have at least one member');
      return;
    }
    setMembers(members.filter(m => m.id !== memberId));
  };

  const handleToggleExpanded = (memberId: string) => {
    setMembers(members.map(m =>
      m.id === memberId ? { ...m, isExpanded: !m.isExpanded } : m
    ));
  };

  const handleAddServiceToMember = (memberId: string, service: Service, staff: Staff) => {
    setMembers(members.map(member => {
      if (member.id === memberId) {
        return {
          ...member,
          services: [...member.services, {
            serviceId: service.id,
            serviceName: service.name,
            category: service.category,
            duration: service.duration,
            price: service.price,
            staffId: staff.id,
            staffName: staff.name
          }]
        };
      }
      return member;
    }));
    setShowServicePicker(null);
  };

  const handleRemoveService = (memberId: string, serviceIndex: number) => {
    setMembers(members.map(member => {
      if (member.id === memberId) {
        return {
          ...member,
          services: member.services.filter((_, idx) => idx !== serviceIndex)
        };
      }
      return member;
    }));
  };

  const handleBookGroupClick = () => {
    // Validation
    if (members.length === 0) {
      toast.error('Please add at least one group member');
      return;
    }

    const membersWithoutServices = members.filter(m => m.services.length === 0);
    if (membersWithoutServices.length > 0) {
      const names = membersWithoutServices.map(m => m.name);
      setIncompleteMembers(names);
      setShowIncompleteConfirm(true);
      return;
    }

    handleBookGroup();
  };

  const handleBookGroup = async () => {

    try {
      // Create appointments for each member
      const appointments = members.map(member => {
        // Calculate total duration for this member
        const totalDuration = member.services.reduce((sum, svc) => sum + svc.duration, 0);
        const totalPrice = member.services.reduce((sum, svc) => sum + svc.price, 0);

        // Calculate end time based on start time and total duration
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const scheduledStartTime = new Date(date);
        scheduledStartTime.setHours(startHour, startMinute, 0, 0);

        const scheduledEndTime = new Date(scheduledStartTime);
        scheduledEndTime.setMinutes(scheduledEndTime.getMinutes() + totalDuration);

        return {
          clientId: member.clientId || `walk-in-${Date.now()}-${Math.random()}`,
          clientName: member.name,
          clientPhone: member.phone,
          clientEmail: member.email,
          partySize: members.length,
          namedClients: members.map(m => ({
            id: m.clientId || `walk-in-${m.phone}`,
            name: m.name,
            phone: m.phone
          })),
          staffId: member.services[0]?.staffId || 'any-available',
          staffRequested: true,
          scheduledStartTime,
          scheduledEndTime,
          services: member.services.map(svc => ({
            id: svc.serviceId,
            serviceName: svc.serviceName,
            category: svc.category,
            duration: svc.duration,
            price: svc.price,
            staffId: svc.staffId,
            staffName: svc.staffName
          })),
          duration: totalDuration,
          totalPrice,
          notes: `Group booking for ${members.length} people`,
          source: 'admin-portal',
          status: 'scheduled',
          isGroupBooking: true,
          groupId: `group-${Date.now()}` // Unique group identifier
        };
      });

      // Save all appointments
      if (onSave) {
        await onSave(appointments as any);
      }

      // Success
      toast.success(`Group booking created successfully for ${appointments.length} member${appointments.length > 1 ? 's' : ''}`);

      onClose();
    } catch (error) {
      console.error('Error saving group booking:', error);
      toast.error(`Failed to save group booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      position="center"
      noPadding
      className="h-[90vh]"
      aria-label="Group booking modal"
    >
      {/* Header */}
      <ModalHeader
        title="Group Booking"
        subtitle="Book appointments for multiple people"
        onClose={onClose}
        className="px-6 py-4"
      />

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Members */}
        <div className="w-3/5 flex flex-col border-r border-gray-200">
            {/* Date & Time */}
            <div className="px-6 py-4 bg-surface-secondary border-b border-gray-200/50/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="book-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="book-input"
                  />
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Group Members ({members.length})
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="btn-primary btn-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Added</h3>
                  <p className="text-sm text-gray-500 mb-4">Add members to start building your group booking</p>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Member
                  </button>
                </div>
              ) : (
                members.map((member, index) => (
                  <div
                    key={member.id}
                    className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white hover:border-brand-300 transition-colors"
                  >
                    {/* Member Header */}
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{member.name}</h4>
                            {index === 0 && (
                              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                                Main
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{member.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleExpanded(member.id)}
                          className="btn-icon"
                          aria-label={member.isExpanded ? "Collapse" : "Expand"}
                        >
                          {member.isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="btn-icon hover:bg-red-50"
                          aria-label="Remove member"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Member Services (Expanded) */}
                    {member.isExpanded && (
                      <div className="p-4 space-y-3">
                        {member.services.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-2">No services added yet</p>
                        ) : (
                          <div className="space-y-2">
                            {member.services.map((service, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 text-sm">{service.serviceName}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">{service.staffName}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-500">{service.duration} min</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs font-semibold text-brand-600">${service.price}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveService(member.id, idx)}
                                  className="btn-icon p-1.5 hover:bg-red-100"
                                  aria-label="Remove service"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => setShowServicePicker(member.id)}
                          className="btn-secondary w-full text-brand-600 bg-brand-50 border-brand-200 hover:bg-brand-100 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Service
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="w-2/5 flex flex-col bg-surface-secondary">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Group Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="text-lg font-bold text-gray-900">{groupSummary.totalMembers}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200/50">
                  <span className="text-sm text-gray-600">Total Services</span>
                  <span className="text-lg font-bold text-gray-900">{groupSummary.totalServices}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200/50">
                  <span className="text-sm text-gray-600">Total Duration</span>
                  <span className="text-lg font-bold text-gray-900">{groupSummary.formattedDuration}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-t-2 border-gray-300">
                  <span className="text-base font-semibold text-gray-900">Total Cost</span>
                  <span className="text-2xl font-bold text-brand-600">${groupSummary.totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Breakdown */}
              {members.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Cost Breakdown
                  </h4>
                  <div className="space-y-2">
                    {members.map(member => {
                      const memberTotal = member.services.reduce((sum, s) => sum + s.price, 0);
                      return (
                        <div key={member.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{member.name}</span>
                          <span className="font-semibold text-gray-900">${memberTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleBookGroupClick}
                disabled={members.length === 0 || groupSummary.totalServices === 0}
                className="btn-primary w-full py-3 text-base font-bold shadow-lg"
              >
                Book Group Appointment
              </button>
            </div>
          </div>
        </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
              <h3 className="text-lg font-bold text-gray-900">Add Group Member</h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setClientSearch('');
                  setNewMemberName('');
                  setNewMemberPhone('');
                  setNewMemberEmail('');
                }}
                className="btn-icon"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Search existing clients */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Existing Clients
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="book-input pl-10"
                    autoFocus
                  />
                </div>

                {/* Search Results */}
                {clientSearch && (
                  <div className="mt-3 space-y-2">
                    {isSearching ? (
                      <p className="text-sm text-gray-500 text-center py-4">Searching...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(client => (
                        <button
                          key={client.id}
                          onClick={() => handleAddMemberFromClient(client)}
                          className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.phone}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No clients found</p>
                    )}
                  </div>
                )}

                {/* Recent Clients */}
                {!clientSearch && recentClients.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Clients</p>
                    {recentClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => handleAddMemberFromClient(client)}
                        className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or add new member</span>
                </div>
              </div>

              {/* Add Walk-in */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="book-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="book-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="book-input"
                  />
                </div>
                <button
                  onClick={handleAddWalkInMember}
                  disabled={!newMemberName.trim() || !newMemberPhone.trim()}
                  className="btn-primary w-full"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Picker Modal */}
      {showServicePicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
              <h3 className="text-lg font-bold text-gray-900">
                Add Service for {members.find(m => m.id === showServicePicker)?.name}
              </h3>
              <button
                onClick={() => setShowServicePicker(null)}
                className="btn-icon"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {services.map(service => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-md transition-all">
                        <h5 className="font-semibold text-gray-900 mb-2">{service.name}</h5>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{service.price}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 mb-1">Select Staff:</p>
                          {allStaff?.map((staff: Staff) => (
                            <button
                              key={staff.id}
                              onClick={() => handleAddServiceToMember(showServicePicker, service, staff)}
                              className="w-full px-3 py-2 text-xs text-left bg-gray-50 hover:bg-brand-50 hover:border-brand-500 border border-gray-200 rounded transition-colors"
                            >
                              {staff.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Members Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showIncompleteConfirm}
        onClose={() => setShowIncompleteConfirm(false)}
        onConfirm={() => {
          setShowIncompleteConfirm(false);
          handleBookGroup();
        }}
        title="Incomplete Group Members"
        message={`The following members don't have services assigned: ${incompleteMembers.join(', ')}\n\nDo you want to continue anyway?`}
        confirmText="Continue Booking"
        cancelText="Go Back"
        variant="warning"
      />
    </ModalContainer>
  );
}
