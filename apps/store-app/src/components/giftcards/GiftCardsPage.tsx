/**
 * GiftCardsPage - Unified Gift Card Management Hub
 *
 * Consolidates all gift card functionality:
 * - All Cards: Search, filter, manage issued gift cards
 * - Denominations: Setup preset amounts (moved from Catalog)
 * - Settings: Gift card configuration (moved from Catalog)
 * - Sales Report: Analytics and metrics
 * - Liability Report: Outstanding balances
 */

import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Gift,
  CreditCard,
  Settings,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { selectSalonId } from '../../store/slices/authSlice';
import { db } from '../../db/schema';
import type { GiftCardDenomination, GiftCardSettings } from '../../types/catalog';
import { GiftCardDenominationModal } from '../menu-settings/modals/GiftCardDenominationModal';

// Import management components
import GiftCardManagement from './GiftCardManagement';
import GiftCardSalesReport from './GiftCardSalesReport';
import GiftCardLiabilityReport from './GiftCardLiabilityReport';

type GiftCardTab = 'cards' | 'denominations' | 'settings' | 'sales' | 'liability';

interface GiftCardsPageProps {
  onBack?: () => void;
}

export default function GiftCardsPage({ onBack }: GiftCardsPageProps) {
  const [activeTab, setActiveTab] = useState<GiftCardTab>('cards');
  const [isDenomModalOpen, setIsDenomModalOpen] = useState(false);
  const [editingDenomination, setEditingDenomination] = useState<GiftCardDenomination | undefined>();

  const storeId = useSelector(selectSalonId) || '';

  // Tab configuration
  const tabs: { id: GiftCardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'cards', label: 'All Cards', icon: <CreditCard size={18} /> },
    { id: 'denominations', label: 'Denominations', icon: <Gift size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'sales', label: 'Sales Report', icon: <TrendingUp size={18} /> },
    { id: 'liability', label: 'Liability', icon: <AlertTriangle size={18} /> },
  ];

  // Load gift card denominations from IndexedDB
  const giftCardDenominations = useLiveQuery(
    async () => {
      if (!storeId) return [];
      try {
        const items = await db.giftCardDenominations
          .where('storeId')
          .equals(storeId)
          .toArray();
        return items.sort((a, b) => a.displayOrder - b.displayOrder || a.amount - b.amount);
      } catch {
        return [];
      }
    },
    [storeId],
    []
  );

  // Load gift card settings from IndexedDB
  const giftCardSettings = useLiveQuery(
    async () => {
      if (!storeId) return null;
      try {
        const settings = await db.giftCardSettings
          .where('storeId')
          .equals(storeId)
          .first();
        return settings || null;
      } catch {
        return null;
      }
    },
    [storeId],
    null
  );

  // Default settings
  const currentSettings = giftCardSettings || {
    allowCustomAmount: true,
    minAmount: 10,
    maxAmount: 500,
    onlineEnabled: true,
    emailDeliveryEnabled: true,
  };

  // CRUD operations for denominations
  const createDenomination = useCallback(
    async (data: Partial<GiftCardDenomination>) => {
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const maxOrder =
          giftCardDenominations && giftCardDenominations.length > 0
            ? Math.max(...giftCardDenominations.map((d) => d.displayOrder)) + 1
            : 0;
        const tenantId = storeId; // TODO: Get actual tenantId from auth context
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
        const userId = 'system'; // TODO: Get actual userId from auth context

        const denomination: GiftCardDenomination = {
          id,
          storeId,
          tenantId,
          amount: data.amount || 50,
          label: data.label || `$${data.amount || 50} Gift Card`,
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? maxOrder,
          syncStatus: 'pending',
          version: 1,
          vectorClock: { [deviceId]: 1 },
          lastSyncedVersion: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          createdByDevice: deviceId,
          lastModifiedBy: userId,
          lastModifiedByDevice: deviceId,
          isDeleted: false,
        };
        await db.giftCardDenominations.add(denomination);
        toast.success('Denomination created');
        return denomination;
      } catch (error) {
        toast.error('Failed to create denomination');
        return null;
      }
    },
    [storeId, giftCardDenominations]
  );

  const updateDenomination = useCallback(
    async (id: string, data: Partial<GiftCardDenomination>) => {
      try {
        const existing = await db.giftCardDenominations.get(id);
        if (!existing) {
          toast.error('Denomination not found');
          return null;
        }
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
        const userId = 'system'; // TODO: Get actual userId from auth context
        const newVersion = existing.version + 1;

        await db.giftCardDenominations.update(id, {
          ...data,
          version: newVersion,
          vectorClock: { ...existing.vectorClock, [deviceId]: newVersion },
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
          lastModifiedByDevice: deviceId,
          syncStatus: 'pending',
        });
        toast.success('Denomination updated');
        return await db.giftCardDenominations.get(id);
      } catch (error) {
        toast.error('Failed to update denomination');
        return null;
      }
    },
    []
  );

  const deleteDenomination = useCallback(async (id: string) => {
    try {
      await db.giftCardDenominations.delete(id);
      toast.success('Denomination deleted');
      return true;
    } catch (error) {
      toast.error('Failed to delete denomination');
      return false;
    }
  }, []);

  const updateSettings = useCallback(
    async (data: Partial<GiftCardSettings>) => {
      try {
        const now = new Date().toISOString();
        const existing = await db.giftCardSettings
          .where('storeId')
          .equals(storeId)
          .first();
        const tenantId = storeId; // TODO: Get actual tenantId from auth context
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
        const userId = 'system'; // TODO: Get actual userId from auth context

        if (existing) {
          const newVersion = existing.version + 1;
          await db.giftCardSettings.update(existing.id, {
            ...data,
            version: newVersion,
            vectorClock: { ...existing.vectorClock, [deviceId]: newVersion },
            updatedAt: now,
            lastModifiedBy: userId,
            lastModifiedByDevice: deviceId,
            syncStatus: 'pending',
          });
        } else {
          const settings: GiftCardSettings = {
            id: crypto.randomUUID(),
            storeId,
            tenantId,
            allowCustomAmount: data.allowCustomAmount ?? true,
            minAmount: data.minAmount ?? 10,
            maxAmount: data.maxAmount ?? 500,
            onlineEnabled: data.onlineEnabled ?? true,
            emailDeliveryEnabled: data.emailDeliveryEnabled ?? true,
            syncStatus: 'pending',
            version: 1,
            vectorClock: { [deviceId]: 1 },
            lastSyncedVersion: 0,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            createdByDevice: deviceId,
            lastModifiedBy: userId,
            lastModifiedByDevice: deviceId,
            isDeleted: false,
          };
          await db.giftCardSettings.add(settings);
        }
        toast.success('Settings updated');
      } catch (error) {
        toast.error('Failed to update settings');
      }
    },
    [storeId]
  );

  // Denomination handlers
  const handleEditDenomination = (denomination: GiftCardDenomination) => {
    setEditingDenomination(denomination);
    setIsDenomModalOpen(true);
  };

  const handleDeleteDenomination = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this denomination?')) {
      await deleteDenomination(id);
    }
  };

  const handleSaveDenomination = async (data: Partial<GiftCardDenomination>) => {
    if (editingDenomination) {
      await updateDenomination(editingDenomination.id, data);
    } else {
      await createDenomination(data);
    }
    setIsDenomModalOpen(false);
    setEditingDenomination(undefined);
  };

  // Sort denominations
  const sortedDenominations = [...(giftCardDenominations || [])].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.amount - b.amount;
  });
  const activeDenominations = sortedDenominations.filter((d) => d.isActive);
  const inactiveDenominations = sortedDenominations.filter((d) => !d.isActive);

  // Render tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'cards':
        return <GiftCardManagement />;

      case 'denominations':
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Denominations</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Preset gift card amounts shown at checkout
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingDenomination(undefined);
                    setIsDenomModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a5f4a] text-white rounded-lg text-sm font-medium hover:bg-[#154d3c] transition-colors"
                >
                  <Plus size={16} />
                  Add Denomination
                </button>
              </div>

              {/* Denominations Grid */}
              {sortedDenominations.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <Gift size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Denominations Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Create preset gift card amounts that customers can quickly select at checkout.
                  </p>
                  <button
                    onClick={() => {
                      setEditingDenomination(undefined);
                      setIsDenomModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a5f4a] text-white rounded-lg text-sm font-medium hover:bg-[#154d3c] transition-colors"
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
                            className="bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] rounded-xl p-4 text-white relative group"
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleEditDenomination(denomination)}
                                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteDenomination(denomination.id)}
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
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleEditDenomination(denomination)}
                                className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteDenomination(denomination.id)}
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
              {sortedDenominations.length > 0 && sortedDenominations.length < 6 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Quick add common amounts:</p>
                  <div className="flex flex-wrap gap-2">
                    {[25, 50, 75, 100, 150, 200].map((amount) => {
                      const exists = sortedDenominations.some((d) => d.amount === amount);
                      if (exists) return null;
                      return (
                        <button
                          key={amount}
                          onClick={() => createDenomination({ amount, isActive: true })}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-[#1a5f4a] hover:bg-[#1a5f4a]/5 transition-colors"
                        >
                          + ${amount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gift Card Settings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure gift card behavior and limits
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
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
                      updateSettings({
                        allowCustomAmount: !currentSettings.allowCustomAmount,
                      })
                    }
                    className="text-gray-600"
                  >
                    {currentSettings.allowCustomAmount ? (
                      <ToggleRight size={28} className="text-[#1a5f4a]" />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>

                {/* Amount Limits */}
                {currentSettings.allowCustomAmount && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-[#1a5f4a]/30">
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
                            updateSettings({ minAmount: Number(e.target.value) || 10 })
                          }
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]"
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
                            updateSettings({ maxAmount: Number(e.target.value) || 500 })
                          }
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Booking */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Online Purchasing</p>
                    <p className="text-sm text-gray-500">
                      Allow gift card purchases through online booking
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ onlineEnabled: !currentSettings.onlineEnabled })
                    }
                    className="text-gray-600"
                  >
                    {currentSettings.onlineEnabled ? (
                      <ToggleRight size={28} className="text-[#1a5f4a]" />
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
                      updateSettings({
                        emailDeliveryEnabled: !currentSettings.emailDeliveryEnabled,
                      })
                    }
                    className="text-gray-600"
                  >
                    {currentSettings.emailDeliveryEnabled ? (
                      <ToggleRight size={28} className="text-[#1a5f4a]" />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return <GiftCardSalesReport />;

      case 'liability':
        return <GiftCardLiabilityReport />;

      default:
        return null;
    }
  };

  // Show error state if storeId is not available
  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#faf9f7]">
        <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Gift Cards Unavailable</h2>
        <p className="text-gray-500 text-center max-w-md">
          Please log in to a store to access gift card management.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 px-4 py-2 bg-[#1a5f4a] text-white rounded-lg hover:bg-[#154d3c] transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Gift Cards
                </h1>
                <p className="text-sm text-gray-500">Manage gift cards, settings & reports</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {giftCardDenominations?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Denominations</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1a5f4a]/10 text-[#1a5f4a] border border-[#1a5f4a]/20'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>

      {/* Denomination Modal */}
      <GiftCardDenominationModal
        isOpen={isDenomModalOpen}
        onClose={() => {
          setIsDenomModalOpen(false);
          setEditingDenomination(undefined);
        }}
        denomination={editingDenomination}
        onSave={handleSaveDenomination}
      />
    </div>
  );
}
