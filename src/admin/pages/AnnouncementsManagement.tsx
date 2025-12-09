import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Send,
  Archive,
  RefreshCcw,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Search,
  Calendar,
  Eye,
  Copy,
  Pause,
  Play,
  Mail,
  Bell,
  LayoutDashboard,
  LogIn,
  Maximize2,
  LayoutPanelTop,
  Sparkles,
  ShieldAlert,
  Gift,
  Lightbulb,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementSeverity,
  AnnouncementPriority,
  AnnouncementStatus,
  CreateAnnouncementInput,
  DeliveryChannel,
  AnnouncementCTA
} from '../types';
import {
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  PRIORITY_CONFIG,
  CHANNEL_CONFIG,
  TARGET_TIER_LABELS,
  TARGET_ROLE_LABELS
} from '../types/announcement';
import { announcementsDB } from '../db/supabaseDatabase';

// Category Icons
const CATEGORY_ICONS: Record<AnnouncementCategory, typeof Sparkles> = {
  feature_update: Sparkles,
  maintenance: Wrench,
  security: ShieldAlert,
  promotion: Gift,
  tip: Lightbulb,
  policy: FileText,
  urgent: AlertTriangle,
  general: Megaphone,
};

// Severity Icons
const SEVERITY_ICONS: Record<AnnouncementSeverity, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  neutral: Info,
};

// Channel Icons
const CHANNEL_ICONS: Record<DeliveryChannel, typeof Bell> = {
  in_app_banner: LayoutPanelTop,
  in_app_modal: Maximize2,
  in_app_toast: Bell,
  dashboard_widget: LayoutDashboard,
  login_screen: LogIn,
  email: Mail,
};

const STATUS_CONFIG: Record<AnnouncementStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  expired: { label: 'Expired', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  archived: { label: 'Archived', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};

export function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AnnouncementStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Announcement | null>(null);
  const [expandedStats, setExpandedStats] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      await announcementsDB.updateExpiredStatus();
      await announcementsDB.activateScheduled();
      const all = await announcementsDB.getAll();
      setAnnouncements(all);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.content.title.toLowerCase().includes(query) ||
        a.content.body.toLowerCase().includes(query) ||
        a.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleOpenModal = (announcement?: Announcement) => {
    setEditingAnnouncement(announcement || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
  };

  const handleSave = async (data: CreateAnnouncementInput) => {
    try {
      if (editingAnnouncement) {
        await announcementsDB.update(editingAnnouncement.id, data);
      } else {
        const session = localStorage.getItem('mango_admin_session');
        const adminId = session ? JSON.parse(session).id : 'unknown';
        await announcementsDB.create(data, adminId);
      }
      await loadAnnouncements();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await announcementsDB.publish(id);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to publish announcement:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await announcementsDB.pause(id);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to pause announcement:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await announcementsDB.resume(id);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to resume announcement:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await announcementsDB.archive(id);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to archive announcement:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const session = localStorage.getItem('mango_admin_session');
      const adminId = session ? JSON.parse(session).id : 'unknown';
      await announcementsDB.duplicate(id, adminId);
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to duplicate announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await announcementsDB.delete(id);
      await loadAnnouncements();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusCounts = {
    all: announcements.length,
    draft: announcements.filter(a => a.status === 'draft').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    active: announcements.filter(a => a.status === 'active').length,
    paused: announcements.filter(a => a.status === 'paused').length,
    expired: announcements.filter(a => a.status === 'expired').length,
    archived: announcements.filter(a => a.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Multi-channel notifications to reach your users effectively</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {(['all', 'active', 'scheduled', 'paused', 'draft', 'expired', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-3 rounded-xl border-2 transition-all ${
              filterStatus === status
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-xl font-bold text-gray-900">{statusCounts[status]}</p>
            <p className="text-xs text-gray-600 capitalize">{status === 'all' ? 'Total' : status}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Announcements List */}
        <div className="divide-y divide-gray-200">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => {
              const CategoryIcon = CATEGORY_ICONS[announcement.category];
              const categoryConfig = CATEGORY_CONFIG[announcement.category];
              const severityConfig = SEVERITY_CONFIG[announcement.severity];
              const statusConfig = STATUS_CONFIG[announcement.status];
              const isExpanded = expandedStats === announcement.id;

              return (
                <div key={announcement.id} className="hover:bg-gray-50">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div className={`p-3 rounded-xl ${severityConfig.bgColor}`}>
                        <CategoryIcon className={`w-6 h-6 ${severityConfig.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{announcement.content.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityConfig.bgColor} ${severityConfig.color}`}>
                            {severityConfig.label}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            {categoryConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            announcement.priority === 'critical' ? 'bg-red-100 text-red-600' :
                            announcement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                            announcement.priority === 'normal' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {PRIORITY_CONFIG[announcement.priority].label} Priority
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{announcement.content.body}</p>

                        {/* Channels & Targeting */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(announcement.createdAt)}
                          </span>

                          {/* Channels */}
                          <span className="flex items-center gap-1">
                            Channels:
                            {announcement.channels.map((ch) => {
                              const ChannelIcon = CHANNEL_ICONS[ch];
                              return (
                                <span key={ch} title={CHANNEL_CONFIG[ch].label}>
                                  <ChannelIcon className="w-3 h-3" />
                                </span>
                              );
                            })}
                          </span>

                          {/* Targeting */}
                          <span>
                            Tiers: {announcement.targeting.tiers.map(t => TARGET_TIER_LABELS[t]).join(', ')}
                          </span>
                          <span>
                            Roles: {announcement.targeting.roles.map(r => TARGET_ROLE_LABELS[r]).join(', ')}
                          </span>

                          {/* Stats Button */}
                          <button
                            onClick={() => setExpandedStats(isExpanded ? null : announcement.id)}
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                          >
                            <BarChart3 className="w-3 h-3" />
                            Stats
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowPreview(announcement)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(announcement)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(announcement.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {announcement.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(announcement.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Publish"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {announcement.status === 'active' && (
                          <button
                            onClick={() => handlePause(announcement.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {announcement.status === 'paused' && (
                          <button
                            onClick={() => handleResume(announcement.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Resume"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {(announcement.status === 'active' || announcement.status === 'paused') && (
                          <button
                            onClick={() => handleArchive(announcement.id)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(announcement.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stats */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-gray-50 rounded-lg p-4 ml-16">
                        <h4 className="font-medium text-gray-900 mb-3">Performance Statistics</h4>
                        <div className="grid grid-cols-6 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{announcement.stats.totalViews}</p>
                            <p className="text-xs text-gray-500">Total Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{announcement.stats.uniqueViews}</p>
                            <p className="text-xs text-gray-500">Unique Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{announcement.stats.dismissals}</p>
                            <p className="text-xs text-gray-500">Dismissals</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{announcement.stats.acknowledgments}</p>
                            <p className="text-xs text-gray-500">Acknowledgments</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {Object.values(announcement.stats.ctaClicks).reduce((a, b) => a + b, 0)}
                            </p>
                            <p className="text-xs text-gray-500">CTA Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{announcement.stats.emailsSent}</p>
                            <p className="text-xs text-gray-500">Emails Sent</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No announcements found</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-purple-600 hover:text-purple-700"
              >
                Create your first announcement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          announcement={showPreview}
          onClose={() => setShowPreview(null)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Announcement?</h3>
              <p className="text-gray-600 mb-6">This will also delete all tracking data.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MODAL COMPONENTS ====================

function AnnouncementModal({
  announcement,
  onSave,
  onClose,
}: {
  announcement: Announcement | null;
  onSave: (data: CreateAnnouncementInput) => void;
  onClose: () => void;
}) {
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
  const [activeTab, setActiveTab] = useState<'content' | 'delivery' | 'targeting' | 'behavior'>('content');

  // Auto-update severity when category changes
  useEffect(() => {
    if (!announcement) {
      const config = CATEGORY_CONFIG[category];
      setSeverity(config.defaultSeverity);
      setChannels(config.defaultChannels);
    }
  }, [category, announcement]);

  const toggleChannel = (ch: DeliveryChannel) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
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
            {/* Content Tab */}
            {activeTab === 'content' && (
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
                      <button
                        type="button"
                        onClick={addCta}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
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

                {/* Tags */}
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

                {/* Internal Notes */}
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
            )}

            {/* Delivery Tab */}
            {activeTab === 'delivery' && (
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
                            category === cat
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
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
                            severity === sev
                              ? `${config.bgColor} ${config.borderColor}`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${severity === sev ? config.iconColor : 'text-gray-400'}`} />
                          <span className={`text-sm ${severity === sev ? config.color : 'text-gray-600'}`}>
                            {config.label}
                          </span>
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
                            priority === pri
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
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
                            isSelected
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
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
            )}

            {/* Targeting Tab */}
            {activeTab === 'targeting' && (
              <div className="space-y-6">
                {/* Tiers */}
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

                {/* Roles */}
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
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
              <div className="space-y-6">
                {/* Scheduling */}
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

                {/* Display Options */}
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

function PreviewModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  const severityConfig = SEVERITY_CONFIG[announcement.severity];
  const SeverityIcon = SEVERITY_ICONS[announcement.severity];
  const CategoryIcon = CATEGORY_ICONS[announcement.category];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Announcement Preview</h2>
          <p className="text-sm text-gray-500 mt-1">Preview how this announcement appears in different channels</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner Preview */}
          {announcement.channels.includes('in_app_banner') && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">In-App Banner</h4>
              <div className={`p-4 rounded-xl border ${severityConfig.bgColor} ${severityConfig.borderColor}`}>
                <div className="flex items-start gap-3">
                  <SeverityIcon className={`w-5 h-5 ${severityConfig.iconColor} mt-0.5`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${severityConfig.color}`}>{announcement.content.title}</h4>
                    <p className={`text-sm mt-1 ${severityConfig.color} opacity-90`}>{announcement.content.body}</p>
                    {announcement.content.ctas && announcement.content.ctas.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {announcement.content.ctas.map((cta, idx) => (
                          <button
                            key={idx}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              cta.style === 'primary'
                                ? `${severityConfig.color} border ${severityConfig.borderColor}`
                                : 'text-gray-600 hover:underline'
                            }`}
                          >
                            {cta.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {announcement.behavior.dismissible && (
                    <button className={`${severityConfig.iconColor} opacity-60 hover:opacity-100`}>
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Preview */}
          {announcement.channels.includes('in_app_modal') && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Modal Popup</h4>
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${severityConfig.bgColor}`}>
                    <CategoryIcon className={`w-6 h-6 ${severityConfig.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{announcement.content.title}</h3>
                    <p className="text-gray-600 mt-2">{announcement.content.body}</p>
                    <div className="flex gap-3 mt-4">
                      {announcement.content.ctas?.map((cta, idx) => (
                        <button
                          key={idx}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            cta.style === 'primary'
                              ? 'bg-purple-600 text-white'
                              : cta.style === 'secondary'
                              ? 'bg-gray-100 text-gray-700'
                              : 'text-purple-600 hover:underline'
                          }`}
                        >
                          {cta.label}
                        </button>
                      ))}
                      {announcement.behavior.requireAcknowledgment && (
                        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white">
                          I Understand
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Preview */}
          {announcement.channels.includes('in_app_toast') && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Toast Notification</h4>
              <div className="flex justify-end">
                <div className={`p-4 rounded-xl border ${severityConfig.bgColor} ${severityConfig.borderColor} shadow-lg max-w-sm`}>
                  <div className="flex items-start gap-3">
                    <SeverityIcon className={`w-5 h-5 ${severityConfig.iconColor}`} />
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${severityConfig.color}`}>{announcement.content.title}</h4>
                      <p className={`text-xs mt-1 ${severityConfig.color} opacity-90`}>
                        {announcement.content.summary || announcement.content.body.slice(0, 80) + '...'}
                      </p>
                    </div>
                    <button className={`${severityConfig.iconColor} opacity-60`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{CATEGORY_CONFIG[announcement.category].label}</span>
              </div>
              <div>
                <span className="text-gray-500">Severity:</span>
                <span className="ml-2 font-medium">{severityConfig.label}</span>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>
                <span className="ml-2 font-medium">{PRIORITY_CONFIG[announcement.priority].label}</span>
              </div>
              <div>
                <span className="text-gray-500">Channels:</span>
                <span className="ml-2 font-medium">{announcement.channels.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Tiers:</span>
                <span className="ml-2 font-medium">
                  {announcement.targeting.tiers.map(t => TARGET_TIER_LABELS[t]).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Roles:</span>
                <span className="ml-2 font-medium">
                  {announcement.targeting.roles.map(r => TARGET_ROLE_LABELS[r]).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
