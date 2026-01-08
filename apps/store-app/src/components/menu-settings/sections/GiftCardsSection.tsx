import { useState } from 'react';
import { Gift, Plus, Edit2, Trash2, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import type { GiftCardDenomination, GiftCardSettings } from '@/types/catalog';
import { GiftCardDenominationModal } from '../modals/GiftCardDenominationModal';

interface GiftCardsSectionProps {
  denominations: GiftCardDenomination[];
  settings?: GiftCardSettings;
  onCreateDenomination: (data: Partial<GiftCardDenomination>) => Promise<GiftCardDenomination | null | undefined | void>;
  onUpdateDenomination: (id: string, data: Partial<GiftCardDenomination>) => Promise<GiftCardDenomination | null | undefined | void>;
  onDeleteDenomination: (id: string) => Promise<boolean | null | void>;
  onUpdateSettings: (data: Partial<GiftCardSettings>) => Promise<GiftCardSettings | null | undefined | void>;
}

export function GiftCardsSection({
  denominations,
  settings,
  onCreateDenomination,
  onUpdateDenomination,
  onDeleteDenomination,
  onUpdateSettings,
}: GiftCardsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDenomination, setEditingDenomination] = useState<GiftCardDenomination | undefined>();
  const [showSettings, setShowSettings] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this denomination?')) {
      await onDeleteDenomination(id);
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

  // Default settings if none exist
  const currentSettings = settings || {
    allowCustomAmount: true,
    minAmount: 10,
    maxAmount: 500,
    onlineEnabled: true,
    emailDeliveryEnabled: true,
  };

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
                    allowCustomAmount: !currentSettings.allowCustomAmount,
                  })
                }
                className="text-gray-600"
              >
                {currentSettings.allowCustomAmount ? (
                  <ToggleRight size={28} className="text-orange-500" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>

            {/* Amount Limits */}
            {currentSettings.allowCustomAmount && (
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
                      value={currentSettings.minAmount}
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
                      value={currentSettings.maxAmount}
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
                  onUpdateSettings({ onlineEnabled: !currentSettings.onlineEnabled })
                }
                className="text-gray-600"
              >
                {currentSettings.onlineEnabled ? (
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
                    emailDeliveryEnabled: !currentSettings.emailDeliveryEnabled,
                  })
                }
                className="text-gray-600"
              >
                {currentSettings.emailDeliveryEnabled ? (
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
                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleEdit(denomination)}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(denomination.id)}
                          className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <Gift size={24} className="opacity-60 mb-2" />
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
                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleEdit(denomination)}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(denomination.id)}
                          className="p-1.5 bg-gray-200 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <Gift size={24} className="opacity-40 mb-2" />
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
    </div>
  );
}

export default GiftCardsSection;
