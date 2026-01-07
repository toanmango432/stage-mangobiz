/**
 * Announcement Modal Component
 * Create/Edit announcement form with tabs
 */

import { useState, useEffect } from 'react';
import { X, Send, RefreshCcw } from 'lucide-react';
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementSeverity,
  AnnouncementPriority,
  CreateAnnouncementInput,
  DeliveryChannel,
  AnnouncementCTA,
} from '@/types';
import {
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  PRIORITY_CONFIG,
  CHANNEL_CONFIG,
  TARGET_TIER_LABELS,
  TARGET_ROLE_LABELS,
} from '@/types/announcement';
import { CATEGORY_ICONS, SEVERITY_ICONS, CHANNEL_ICONS } from '../constants';

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onSave: (data: CreateAnnouncementInput) => void;
  onClose: () => void;
}

type Tab = 'content' | 'delivery' | 'targeting' | 'behavior';

export function AnnouncementModal({ announcement, onSave, onClose }: AnnouncementModalProps) {
  // Content
  const [title, setTitle] = useState(announcement?.content.title || '');
  const [body, setBody] = useState(announcement?.content.body || '');
  const [summary, setSummary] = useState(announcement?.content.summary || '');

  // Classification
  const [category, setCategory] = useState<AnnouncementCategory>(announcement?.category || 'general');
  const [severity, setSeverity] = useState<AnnouncementSeverity>(announcement?.severity || 'info');
  const [priority, setPriority] = useState<AnnouncementPriority>(announcement?.priority || 'normal');

  // Channels
  const [channels, setChannels] = useState<DeliveryChannel[]>(
    announcement?.channels || CATEGORY_CONFIG['general'].defaultChannels
  );

  // Targeting
  const [targetTiers, setTargetTiers] = useState<string[]>(announcement?.targeting.tiers || ['all']);
  const [targetRoles, setTargetRoles] = useState<string[]>(announcement?.targeting.roles || ['all']);

  // Behavior
  const [dismissible, setDismissible] = useState(announcement?.behavior.dismissible ?? true);
  const [requireAck, setRequireAck] = useState(announcement?.behavior.requireAcknowledgment ?? false);
  const [showOnce, setShowOnce] = useState(announcement?.behavior.showOnce ?? false);
  const [startsAt, setStartsAt] = useState(
    announcement?.behavior.startsAt ? new Date(announcement.behavior.startsAt).toISOString().slice(0, 16) : ''
  );
  const [expiresAt, setExpiresAt] = useState(
    announcement?.behavior.expiresAt ? new Date(announcement.behavior.expiresAt).toISOString().slice(0, 16) : ''
  );

  // CTAs
  const [ctas, setCtas] = useState<AnnouncementCTA[]>(announcement?.content.ctas || []);

  // Meta
  const [tags, setTags] = useState(announcement?.tags?.join(', ') || '');
  const [internalNotes, setInternalNotes] = useState(announcement?.internalNotes || '');

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('content');

  // Auto-update severity when category changes
  useEffect(() => {
    if (!announcement) {
      const config = CATEGORY_CONFIG[category];
      setSeverity(config.defaultSeverity);
      setChannels(config.defaultChannels);
    }
  }, [category, announcement]);

  const toggleChannel = (ch: DeliveryChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const toggleTier = (tier: string) => {
    if (tier === 'all') {
      setTargetTiers(['all']);
    } else {
      const newTiers = targetTiers.includes(tier)
        ? targetTiers.filter(t => t !== tier)
        : [...targetTiers.filter(t => t !== 'all'), tier];
      setTargetTiers(newTiers.length ? newTiers : ['all']);
    }
  };

  const toggleRole = (role: string) => {
    if (role === 'all') {
      setTargetRoles(['all']);
    } else {
      const newRoles = targetRoles.includes(role)
        ? targetRoles.filter(r => r !== role)
        : [...targetRoles.filter(r => r !== 'all'), role];
      setTargetRoles(newRoles.length ? newRoles : ['all']);
    }
  };

  const addCta = () => {
    if (ctas.length < 2) {
      setCtas([...ctas, { label: '', style: 'primary', trackClicks: true }]);
    }
  };

  const updateCta = (index: number, updates: Partial<AnnouncementCTA>) => {
    setCtas(ctas.map((cta, i) => i === index ? { ...cta, ...updates } : cta));
  };

  const removeCta = (index: number) => {
    setCtas(ctas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || channels.length === 0) return;

    setSaving(true);
    try {
      await onSave({
        content: {
          title,
          body,
          summary: summary || undefined,
          ctas: ctas.filter(c => c.label),
        },
        category,
        severity,
        priority,
        channels,
        targeting: {
          tiers: targetTiers as any[],
          roles: targetRoles as any[],
        },
        behavior: {
          dismissible,
          requireAcknowledgment: requireAck,
          showOnce,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        internalNotes: internalNotes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {announcement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              {(['content', 'delivery', 'targeting', 'behavior'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'content' && (
              <ContentTab
                title={title}
                setTitle={setTitle}
                body={body}
                setBody={setBody}
                summary={summary}
                setSummary={setSummary}
                ctas={ctas}
                addCta={addCta}
                updateCta={updateCta}
                removeCta={removeCta}
                tags={tags}
                setTags={setTags}
                internalNotes={internalNotes}
                setInternalNotes={setInternalNotes}
              />
            )}

            {activeTab === 'delivery' && (
              <DeliveryTab
                category={category}
                setCategory={setCategory}
                severity={severity}
                setSeverity={setSeverity}
                priority={priority}
                setPriority={setPriority}
                channels={channels}
                toggleChannel={toggleChannel}
              />
            )}

            {activeTab === 'targeting' && (
              <TargetingTab
                targetTiers={targetTiers}
                toggleTier={toggleTier}
                targetRoles={targetRoles}
                toggleRole={toggleRole}
              />
            )}

            {activeTab === 'behavior' && (
              <BehaviorTab
                startsAt={startsAt}
                setStartsAt={setStartsAt}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                dismissible={dismissible}
                setDismissible={setDismissible}
                requireAck={requireAck}
                setRequireAck={setRequireAck}
                showOnce={showOnce}
                setShowOnce={setShowOnce}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title || !body || channels.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Saving...' : announcement ? 'Update' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function ContentTab({
  title, setTitle, body, setBody, summary, setSummary,
  ctas, addCta, updateCta, removeCta, tags, setTags, internalNotes, setInternalNotes,
}: {
  title: string; setTitle: (v: string) => void;
  body: string; setBody: (v: string) => void;
  summary: string; setSummary: (v: string) => void;
  ctas: AnnouncementCTA[];
  addCta: () => void;
  updateCta: (i: number, updates: Partial<AnnouncementCTA>) => void;
  removeCta: (i: number) => void;
  tags: string; setTags: (v: string) => void;
  internalNotes: string; setInternalNotes: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Announcement title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Full announcement message (supports markdown)"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summary (for toasts)</label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Short version for toast notifications"
        />
      </div>

      {/* CTAs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Call-to-Action Buttons</label>
          {ctas.length < 2 && (
            <button type="button" onClick={addCta} className="text-sm text-purple-600 hover:text-purple-700">
              + Add CTA
            </button>
          )}
        </div>
        {ctas.map((cta, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              value={cta.label}
              onChange={(e) => updateCta(idx, { label: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Button label"
            />
            <input
              type="text"
              value={cta.url || ''}
              onChange={(e) => updateCta(idx, { url: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="URL (optional)"
            />
            <select
              value={cta.style}
              onChange={(e) => updateCta(idx, { style: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="link">Link</option>
            </select>
            <button
              type="button"
              onClick={() => removeCta(idx)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Comma-separated tags for organization"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Admin-only notes (not shown to users)"
        />
      </div>
    </div>
  );
}

function DeliveryTab({
  category, setCategory, severity, setSeverity, priority, setPriority, channels, toggleChannel,
}: {
  category: AnnouncementCategory; setCategory: (v: AnnouncementCategory) => void;
  severity: AnnouncementSeverity; setSeverity: (v: AnnouncementSeverity) => void;
  priority: AnnouncementPriority; setPriority: (v: AnnouncementPriority) => void;
  channels: DeliveryChannel[]; toggleChannel: (ch: DeliveryChannel) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(CATEGORY_CONFIG) as AnnouncementCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                  category === cat ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${category === cat ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="text-xs">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Severity / Style</label>
        <div className="flex gap-2">
          {(Object.keys(SEVERITY_CONFIG) as AnnouncementSeverity[]).map((sev) => {
            const config = SEVERITY_CONFIG[sev];
            const Icon = SEVERITY_ICONS[sev];
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={`flex-1 p-2 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  severity === sev ? `${config.bgColor} ${config.borderColor}` : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${severity === sev ? config.iconColor : 'text-gray-400'}`} />
                <span className={`text-sm ${severity === sev ? config.color : 'text-gray-600'}`}>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-2">
          {(Object.keys(PRIORITY_CONFIG) as AnnouncementPriority[]).map((pri) => {
            const config = PRIORITY_CONFIG[pri];
            return (
              <button
                key={pri}
                type="button"
                onClick={() => setPriority(pri)}
                className={`flex-1 p-2 rounded-lg border-2 text-center ${
                  priority === pri ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{config.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels *</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(CHANNEL_CONFIG) as DeliveryChannel[]).map((ch) => {
            const config = CHANNEL_CONFIG[ch];
            const Icon = CHANNEL_ICONS[ch];
            const isSelected = channels.includes(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                  isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <span className="text-sm font-medium block">{config.label}</span>
                  <span className="text-xs text-gray-500">{config.description}</span>
                </div>
              </button>
            );
          })}
        </div>
        {channels.length === 0 && (
          <p className="text-red-500 text-sm mt-1">Select at least one channel</p>
        )}
      </div>
    </div>
  );
}

function TargetingTab({
  targetTiers, toggleTier, targetRoles, toggleRole,
}: {
  targetTiers: string[]; toggleTier: (tier: string) => void;
  targetRoles: string[]; toggleRole: (role: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">License Tiers</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TARGET_TIER_LABELS).map(([tier, label]) => (
            <button
              key={tier}
              type="button"
              onClick={() => toggleTier(tier)}
              className={`px-4 py-2 rounded-lg border-2 ${
                targetTiers.includes(tier)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">User Roles</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TARGET_ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-4 py-2 rounded-lg border-2 ${
                targetRoles.includes(role)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Targeting Summary:</strong> This announcement will be shown to{' '}
          <strong>{targetRoles.includes('all') ? 'all roles' : targetRoles.map(r => TARGET_ROLE_LABELS[r]).join(', ')}</strong>
          {' '}in{' '}
          <strong>{targetTiers.includes('all') ? 'all license tiers' : targetTiers.map(t => TARGET_TIER_LABELS[t]).join(', ')}</strong>.
        </p>
      </div>
    </div>
  );
}

function BehaviorTab({
  startsAt, setStartsAt, expiresAt, setExpiresAt,
  dismissible, setDismissible, requireAck, setRequireAck, showOnce, setShowOnce,
}: {
  startsAt: string; setStartsAt: (v: string) => void;
  expiresAt: string; setExpiresAt: (v: string) => void;
  dismissible: boolean; setDismissible: (v: boolean) => void;
  requireAck: boolean; setRequireAck: (v: boolean) => void;
  showOnce: boolean; setShowOnce: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date (optional)</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiry Date (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(e) => setDismissible(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <span className="text-sm text-gray-700 font-medium">Allow dismissing</span>
              <p className="text-xs text-gray-500">Users can close the announcement</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requireAck}
              onChange={(e) => setRequireAck(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <span className="text-sm text-gray-700 font-medium">Require acknowledgment</span>
              <p className="text-xs text-gray-500">Users must click "I understand" to dismiss</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnce}
              onChange={(e) => setShowOnce(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <div>
              <span className="text-sm text-gray-700 font-medium">Show only once</span>
              <p className="text-xs text-gray-500">Don't show again after user dismisses</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
