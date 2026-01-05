import { useState } from 'react';
import {
  GripVertical,
  Plus,
  X,
  Clock,
  ArrowRight,
  ListOrdered,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MenuServiceWithEmbeddedVariants, CategoryWithCount } from '@/types/catalog';
import { formatDuration, formatPrice } from '../constants';

interface BookingSequenceSectionProps {
  services: MenuServiceWithEmbeddedVariants[];
  categories: CategoryWithCount[];
  serviceOrder: string[];
  isEnabled: boolean;
  onUpdateOrder: (newOrder: string[]) => Promise<void> | void;
  onToggleEnabled: (enabled: boolean) => Promise<void> | void;
}

export function BookingSequenceSection({
  services,
  categories,
  serviceOrder,
  isEnabled,
  onUpdateOrder,
  onToggleEnabled,
}: BookingSequenceSectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddServices, setShowAddServices] = useState(false);

  // Get ordered services
  const orderedServices = serviceOrder
    .map(id => services.find(s => s.id === id))
    .filter((s): s is MenuServiceWithEmbeddedVariants => s !== undefined);

  // Get unordered services (not in the sequence)
  const unorderedServices = services.filter(
    s => !serviceOrder.includes(s.id) && s.status === 'active'
  );

  // Get category name for a service
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  // Get category color for a service
  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#6B7280';
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...serviceOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);

    setDraggedIndex(index);
    onUpdateOrder(newOrder);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Add service to sequence
  const handleAddService = (serviceId: string) => {
    const newOrder = [...serviceOrder, serviceId];
    onUpdateOrder(newOrder);
  };

  // Remove service from sequence
  const handleRemoveService = (serviceId: string) => {
    const newOrder = serviceOrder.filter(id => id !== serviceId);
    onUpdateOrder(newOrder);
  };

  // Move service up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...serviceOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onUpdateOrder(newOrder);
  };

  // Move service down
  const handleMoveDown = (index: number) => {
    if (index === serviceOrder.length - 1) return;
    const newOrder = [...serviceOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onUpdateOrder(newOrder);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Booking Sequence</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Define the order services should be performed during appointments
            </p>
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ListOrdered size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Enable Booking Sequence</p>
                <p className="text-sm text-gray-500">
                  Services will be ordered automatically when clients book multiple services
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggleEnabled(!isEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isEnabled ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  isEnabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Info Box */}
        {isEnabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">How it works</p>
                <p className="text-sm text-blue-700 mt-1">
                  When a client books multiple services, they will be automatically arranged in the order defined below.
                  For example: Cut → Color → Highlights → Blowdry
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sequence List */}
        {isEnabled && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* List Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Service Order ({orderedServices.length} services)
                </span>
                <button
                  onClick={() => setShowAddServices(!showAddServices)}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus size={16} />
                  Add Service
                </button>
              </div>
            </div>

            {/* Ordered Services */}
            {orderedServices.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {orderedServices.map((service, index) => (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`px-4 py-3 flex items-center gap-3 cursor-move hover:bg-gray-50 transition-colors ${
                      draggedIndex === index ? 'bg-indigo-50 opacity-70' : ''
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className="text-gray-400 hover:text-gray-600">
                      <GripVertical size={18} />
                    </div>

                    {/* Order Number */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                    </div>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: `${getCategoryColor(service.categoryId)}15`,
                            color: getCategoryColor(service.categoryId),
                          }}
                        >
                          {getCategoryName(service.categoryId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(service.duration)}
                        </span>
                        <span>{formatPrice(service.price)}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    {index < orderedServices.length - 1 && (
                      <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
                    )}

                    {/* Move Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === orderedServices.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove from sequence"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ListOrdered size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">No services in sequence yet</p>
                <p className="text-xs text-gray-400">
                  Add services to define the order they should be performed
                </p>
              </div>
            )}

            {/* Add Services Panel */}
            {showAddServices && unorderedServices.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Available Services
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {unorderedServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleAddService(service.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white transition-colors text-left"
                    >
                      <Plus size={16} className="text-indigo-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{service.name}</span>
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${getCategoryColor(service.categoryId)}15`,
                              color: getCategoryColor(service.categoryId),
                            }}
                          >
                            {getCategoryName(service.categoryId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{formatDuration(service.duration)}</span>
                          <span>{formatPrice(service.price)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unordered Services Info */}
            {isEnabled && unorderedServices.length > 0 && !showAddServices && (
              <div className="px-4 py-3 border-t border-gray-100 bg-amber-50">
                <p className="text-xs text-amber-700">
                  <strong>{unorderedServices.length}</strong> service{unorderedServices.length !== 1 ? 's' : ''} not in sequence will appear after ordered services.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disabled State */}
        {!isEnabled && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListOrdered size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Sequence Disabled</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Enable booking sequence to automatically arrange services in the correct order when clients book multiple services.
            </p>
            <button
              onClick={() => onToggleEnabled(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium"
            >
              Enable Sequence
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
