import { useState } from 'react';
import { Gift, Plus, Edit2, Trash2, Settings, ToggleLeft, ToggleRight, CheckCircle2, XCircle } from 'lucide-react';
import type { GiftCardDenomination, GiftCardSettings } from '@/types/catalog';
import { GiftCardDenominationModal } from '../modals/GiftCardDenominationModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GiftCardSkeleton } from '../components/skeletons';

interface GiftCardsSectionProps {
  denominations: GiftCardDenomination[];
  settings?: GiftCardSettings | null;
  isLoading?: boolean;
  onCreateDenomination: (data: Partial<GiftCardDenomination>) => Promise<GiftCardDenomination | null | undefined | void>;
  onUpdateDenomination: (id: string, data: Partial<GiftCardDenomination>) => Promise<GiftCardDenomination | null | undefined | void>;
  onDeleteDenomination: (id: string) => Promise<boolean | null | void>;
  onUpdateSettings: (data: Partial<GiftCardSettings>) => Promise<GiftCardSettings | null | undefined | void>;
}

export function GiftCardsSection({
  denominations,
  settings,
  isLoading = false,
  onCreateDenomination,
  onUpdateDenomination,
  onDeleteDenomination,
  onUpdateSettings,
}: GiftCardsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDenomination, setEditingDenomination] = useState<GiftCardDenomination | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [denominationToDelete, setDenominationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sort denominations by displayOrder then amount
  const sortedDenominations = [...denominations].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.amount - b.amount;
  });

  const activeDenominations = sortedDenominations.filter((d) => d.isActive);
  const inactiveDenominations = sortedDenominations.filter((d) => !d.isActive);

  const handleEdit = (denomination: GiftCardDenomination) => {
    setEditingDenomination(denomination);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDenominationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!denominationToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteDenomination(denominationToDelete);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDenominationToDelete(null);
    }
  };

  const handleSave = async (data: Partial<GiftCardDenomination>) => {
    if (editingDenomination) {
      await onUpdateDenomination(editingDenomination.id, data);
    } else {
      await onCreateDenomination(data);
    }
    setIsModalOpen(false);
    setEditingDenomination(undefined);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDenomination(undefined);
  };

  // Settings are loaded from useCatalog hook
  // When settings is null/undefined and not loading, first settings update will create with defaults
  const hasSettings = settings !== null && settings !== undefined;

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gift Cards</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage gift card denominations and settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
              <div className="w-36 h-9 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Denominations Skeleton Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GiftCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gift Cards</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage gift card denominations and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSettings
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              onClick={() => {
                setEditingDenomination(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} />
              Add Denomination
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-gray-900 mb-4">Gift Card Settings</h3>

            {!hasSettings && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  Settings will be created when you make your first change below.
                </p>
              </div>
            )}

            {/* Allow Custom Amount */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Allow Custom Amounts</p>
                <p className="text-sm text-gray-500">
                  Let customers enter any amount (within limits)
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    allowCustomAmount: !(settings?.allowCustomAmount ?? true),
                  })
                }
                className="text-gray-600"
              >
                {(settings?.allowCustomAmount ?? true) ? (
                  <ToggleRight size={28} className="text-orange-500" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>

            {/* Amount Limits */}
            {(settings?.allowCustomAmount ?? true) && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-orange-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={settings?.minAmount ?? 10}
                      onChange={(e) =>
                        onUpdateSettings({ minAmount: Number(e.target.value) || 10 })
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={settings?.maxAmount ?? 500}
                      onChange={(e) =>
                        onUpdateSettings({ maxAmount: Number(e.target.value) || 500 })
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Online Booking */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Online Purchasing</p>
                <p className="text-sm text-gray-500">
                  Allow gift card purchases through online booking
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ onlineEnabled: !(settings?.onlineEnabled ?? true) })
                }
                className="text-gray-600"
              >
                {(settings?.onlineEnabled ?? true) ? (
                  <ToggleRight size={28} className="text-orange-500" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>

            {/* Email Delivery */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Delivery</p>
                <p className="text-sm text-gray-500">
                  Send gift cards via email to recipients
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    emailDeliveryEnabled: !(settings?.emailDeliveryEnabled ?? true),
                  })
                }
                className="text-gray-600"
              >
                {(settings?.emailDeliveryEnabled ?? true) ? (
                  <ToggleRight size={28} className="text-orange-500" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Denominations Grid */}
        {denominations.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <Gift size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Denominations Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create preset gift card amounts that customers can quickly select at checkout.
            </p>
            <button
              onClick={() => {
                setEditingDenomination(undefined);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} />
              Add Your First Denomination
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Denominations */}
            {activeDenominations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Active ({activeDenominations.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {activeDenominations.map((denomination) => (
                    <div
                      key={denomination.id}
                      className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-4 text-white relative group"
                    >
                      {/* Active Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 size={12} className="text-white" />
                        <span className="text-xs font-medium text-white">Active</span>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleEdit(denomination)}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          aria-label={`Edit ${denomination.label || 'Gift Card'} $${denomination.amount}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(denomination.id)}
                          className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg transition-colors"
                          aria-label={`Delete ${denomination.label || 'Gift Card'} $${denomination.amount}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <Gift size={24} className="opacity-60 mb-2 mt-6" />
                      <p className="text-2xl font-bold">${denomination.amount}</p>
                      <p className="text-sm opacity-80 mt-1">
                        {denomination.label || 'Gift Card'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Denominations */}
            {inactiveDenominations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Inactive ({inactiveDenominations.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {inactiveDenominations.map((denomination) => (
                    <div
                      key={denomination.id}
                      className="bg-gray-100 rounded-xl p-4 text-gray-400 relative group"
                    >
                      {/* Inactive Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-gray-200 rounded-full px-2 py-0.5">
                        <XCircle size={12} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">Inactive</span>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleEdit(denomination)}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                          aria-label={`Edit ${denomination.label || 'Gift Card'} $${denomination.amount}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(denomination.id)}
                          className="p-1.5 bg-gray-200 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                          aria-label={`Delete ${denomination.label || 'Gift Card'} $${denomination.amount}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <Gift size={24} className="opacity-40 mb-2 mt-6" />
                      <p className="text-2xl font-bold">${denomination.amount}</p>
                      <p className="text-sm opacity-60 mt-1">
                        {denomination.label || 'Gift Card'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Add Suggestions */}
        {denominations.length > 0 && denominations.length < 6 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Quick add common amounts:</p>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100, 150, 200].map((amount) => {
                const exists = denominations.some((d) => d.amount === amount);
                if (exists) return null;
                return (
                  <button
                    key={amount}
                    onClick={() => onCreateDenomination({ amount, isActive: true })}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    + ${amount}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <GiftCardDenominationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        denomination={editingDenomination}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Denomination"
        description="Are you sure you want to delete this gift card denomination? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        icon={<Trash2 size={20} className="text-red-500" />}
      />
    </div>
  );
}

export default GiftCardsSection;
