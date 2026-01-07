/**
 * Announcements Management Component
 * Multi-channel notification management for reaching users effectively
 */

import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Send,
  Archive,
  RefreshCcw,
  Search,
  Calendar,
  Eye,
  Copy,
  Pause,
  Play,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  Announcement,
  AnnouncementStatus,
  CreateAnnouncementInput,
} from '@/types';
import {
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  PRIORITY_CONFIG,
  CHANNEL_CONFIG,
  TARGET_TIER_LABELS,
  TARGET_ROLE_LABELS,
} from '@/types/announcement';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  usePublishAnnouncement,
  useUnpublishAnnouncement,
  useArchiveAnnouncement,
} from '@/hooks/queries';
import { CATEGORY_ICONS, SEVERITY_ICONS, CHANNEL_ICONS, STATUS_CONFIG } from './constants';
import { StatsCards, DeleteConfirmation } from './components';
import { AnnouncementModal, PreviewModal } from './modals';

export function AnnouncementsManagement() {
  // React Query hooks
  const { data: announcements = [], isLoading: loading } = useAnnouncements();

  // Mutation hooks
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const publishAnnouncement = usePublishAnnouncement();
  const unpublishAnnouncement = useUnpublishAnnouncement();
  const archiveAnnouncement = useArchiveAnnouncement();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AnnouncementStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Announcement | null>(null);
  const [expandedStats, setExpandedStats] = useState<string | null>(null);

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
        await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id, data });
      } else {
        await createAnnouncement.mutateAsync(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement.mutateAsync(id);
    } catch (error) {
      console.error('Failed to publish announcement:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await unpublishAnnouncement.mutateAsync(id);
    } catch (error) {
      console.error('Failed to pause announcement:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await publishAnnouncement.mutateAsync(id);
    } catch (error) {
      console.error('Failed to resume announcement:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAnnouncement.mutateAsync(id);
    } catch (error) {
      console.error('Failed to archive announcement:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const original = announcements.find(a => a.id === id);
      if (original) {
        await createAnnouncement.mutateAsync({
          ...original,
          content: { ...original.content, title: `${original.content.title} (Copy)` },
        });
      }
    } catch (error) {
      console.error('Failed to duplicate announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement.mutateAsync(id);
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
      <StatsCards
        statusCounts={statusCounts}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

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
        <DeleteConfirmation
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
