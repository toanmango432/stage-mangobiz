import { useState } from 'react';
import {
  GripVertical,
  Plus,
  X,
  Clock,
  ArrowRight,
  ListOrdered,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuServiceWithEmbeddedVariants, CategoryWithCount } from '@/types/catalog';
import { formatDuration, formatPrice } from '../constants';
import {
  useKeyboardDragDrop,
  DndContext,
  SortableContext,
  closestCenter,
  KeyboardInstructions,
  LiveAnnouncer,
} from '../hooks/useKeyboardDragDrop';

interface BookingSequenceSectionProps {
  services: MenuServiceWithEmbeddedVariants[];
  categories: CategoryWithCount[];
  serviceOrder: string[];
  isEnabled: boolean;
  onUpdateOrder: (newOrder: string[]) => Promise<void> | void;
  onToggleEnabled: (enabled: boolean) => Promise<void> | void;
  /** Error message when service filtering fails */
  filterError?: string | null;
  /** Callback to retry fetching services */
  onRetryFilter?: () => void;
}

/**
 * Sortable service item for keyboard-accessible drag and drop
 */
interface SortableServiceItemProps {
  service: MenuServiceWithEmbeddedVariants;
  index: number;
  totalCount: number;
  getCategoryName: (categoryId: string) => string;
  getCategoryColor: (categoryId: string) => string;
  onRemove: (serviceId: string) => void;
  getKeyboardHandleProps: (itemId: string) => {
    role: string;
    tabIndex: number;
    'aria-label': string;
    'aria-describedby': string;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  };
}

function SortableServiceItem({
  service,
  index,
  totalCount,
  getCategoryName,
  getCategoryColor,
  onRemove,
  getKeyboardHandleProps,
}: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const keyboardHandleProps = getKeyboardHandleProps(service.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
        isDragging ? 'bg-indigo-50 opacity-70 shadow-lg' : ''
      }`}
    >
      {/* Drag Handle - with keyboard accessibility */}
      <div
        {...attributes}
        {...listeners}
        {...keyboardHandleProps}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
      >
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
      {index < totalCount - 1 && (
        <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
      )}

      {/* Remove Button */}
      <button
        onClick={() => onRemove(service.id)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
        aria-label={`Remove ${service.name} from sequence`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function BookingSequenceSection({
  services,
  categories,
  serviceOrder,
  isEnabled,
  onUpdateOrder,
  onToggleEnabled,
  filterError,
  onRetryFilter,
}: BookingSequenceSectionProps) {
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

  // Keyboard-accessible drag and drop
  const {
    sensors,
    handleDragEnd,
    handleDragStart,
    itemIds,
    sortingStrategy,
    announcements,
    getKeyboardHandleProps,
    instructionsId,
    announcement,
  } = useKeyboardDragDrop({
    items: orderedServices,
    getItemId: (service) => service.id,
    onReorder: (newItems) => {
      const newOrder = newItems.map((s) => s.id);
      onUpdateOrder(newOrder);
    },
    getItemLabel: (service) => service.name,
    disabled: !isEnabled,
  });

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

        {/* Error State */}
        {filterError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Failed to load services</p>
                <p className="text-sm text-red-700 mt-1">{filterError}</p>
                {onRetryFilter && (
                  <button
                    onClick={onRetryFilter}
                    className="mt-2 text-sm text-red-700 underline hover:text-red-800 font-medium"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {isEnabled && !filterError && (
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

        {/* Sequence List with keyboard-accessible drag and drop */}
        {isEnabled && !filterError && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements }}
          >
            {/* Accessibility: keyboard instructions and live announcer */}
            <KeyboardInstructions id={instructionsId} />
            <LiveAnnouncer announcement={announcement} />

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

              {/* Ordered Services with sortable context */}
              {orderedServices.length > 0 ? (
                <SortableContext items={itemIds} strategy={sortingStrategy}>
                  <div className="divide-y divide-gray-50">
                    {orderedServices.map((service, index) => (
                      <SortableServiceItem
                        key={service.id}
                        service={service}
                        index={index}
                        totalCount={orderedServices.length}
                        getCategoryName={getCategoryName}
                        getCategoryColor={getCategoryColor}
                        onRemove={handleRemoveService}
                        getKeyboardHandleProps={getKeyboardHandleProps}
                      />
                    ))}
                  </div>
                </SortableContext>
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
                        aria-label={`Add ${service.name} to sequence`}
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
              {unorderedServices.length > 0 && !showAddServices && (
                <div className="px-4 py-3 border-t border-gray-100 bg-amber-50">
                  <p className="text-xs text-amber-700">
                    <strong>{unorderedServices.length}</strong> service{unorderedServices.length !== 1 ? 's' : ''} not in sequence will appear after ordered services.
                  </p>
                </div>
              )}
            </div>
          </DndContext>
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
