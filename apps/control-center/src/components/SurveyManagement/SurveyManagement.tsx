/**
 * Survey Management Component
 * Collect feedback from users with customizable surveys
 */

import { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Send,
  Pause,
  Play,
  Archive,
  RefreshCcw,
  Search,
  Eye,
  Copy,
  Download,
  TrendingUp,
  Star,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';
import type {
  Survey,
  SurveyStatus,
  CreateSurveyInput,
} from '@/types';
import {
  SURVEY_TYPE_CONFIG,
  TRIGGER_CONFIG,
} from '@/types/survey';
import {
  useSurveys,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  usePublishSurvey,
  usePauseSurvey,
  useCloseSurvey,
} from '@/hooks/queries';
import { TYPE_ICONS, QUESTION_ICONS, STATUS_CONFIG } from './constants';
import { StatsCards, DeleteConfirmation } from './components';
import { SurveyModal, ResponsesModal } from './modals';

export function SurveyManagement() {
  // React Query hooks
  const { data: surveys = [], isLoading: loading } = useSurveys();

  // Mutation hooks
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();
  const deleteSurvey = useDeleteSurvey();
  const publishSurvey = usePublishSurvey();
  const pauseSurvey = usePauseSurvey();
  const closeSurvey = useCloseSurvey();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SurveyStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [viewingResponses, setViewingResponses] = useState<Survey | null>(null);

  const filteredSurveys = surveys.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        s.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleOpenModal = (survey?: Survey) => {
    setEditingSurvey(survey || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSurvey(null);
  };

  const handleSave = async (data: CreateSurveyInput) => {
    try {
      if (editingSurvey) {
        await updateSurvey.mutateAsync({ id: editingSurvey.id, data: data as any });
      } else {
        await createSurvey.mutateAsync(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save survey:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishSurvey.mutateAsync(id);
    } catch (error) {
      console.error('Failed to publish survey:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseSurvey.mutateAsync(id);
    } catch (error) {
      console.error('Failed to pause survey:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await publishSurvey.mutateAsync(id);
    } catch (error) {
      console.error('Failed to resume survey:', error);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeSurvey.mutateAsync(id);
    } catch (error) {
      console.error('Failed to close survey:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const original = surveys.find(s => s.id === id);
      if (original) {
        await createSurvey.mutateAsync({
          ...original,
          name: `${original.name} (Copy)`,
          title: `${original.title} (Copy)`,
        });
      }
    } catch (error) {
      console.error('Failed to duplicate survey:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSurvey.mutateAsync(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  };

  const handleExportResponses = async (surveyId: string) => {
    // TODO: Implement export via React Query
    console.log('Export responses for survey:', surveyId);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusCounts = {
    all: surveys.length,
    draft: surveys.filter(s => s.status === 'draft').length,
    scheduled: surveys.filter(s => s.status === 'scheduled').length,
    active: surveys.filter(s => s.status === 'active').length,
    paused: surveys.filter(s => s.status === 'paused').length,
    closed: surveys.filter(s => s.status === 'closed').length,
    archived: surveys.filter(s => s.status === 'archived').length,
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
          <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600 mt-1">Collect feedback from your users with customizable surveys</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Survey
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
              placeholder="Search surveys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Surveys List */}
        <div className="divide-y divide-gray-200">
          {filteredSurveys.length > 0 ? (
            filteredSurveys.map((survey) => {
              const TypeIcon = TYPE_ICONS[survey.type];
              const typeConfig = SURVEY_TYPE_CONFIG[survey.type];
              const statusConfig = STATUS_CONFIG[survey.status];
              const isExpanded = expandedSurvey === survey.id;

              return (
                <div key={survey.id} className="hover:bg-gray-50">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className="p-3 rounded-xl bg-emerald-100">
                        <TypeIcon className="w-6 h-6 text-emerald-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{survey.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            {typeConfig.label}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                            {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-2">{survey.title}</p>

                        {/* Stats & Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(survey.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {survey.stats.totalResponses} responses
                          </span>
                          {survey.type === 'nps' && survey.stats.npsDistribution && (
                            <span className={`flex items-center gap-1 font-medium ${
                              survey.stats.npsDistribution.score >= 50 ? 'text-green-600' :
                              survey.stats.npsDistribution.score >= 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              <TrendingUp className="w-3 h-3" />
                              NPS: {survey.stats.npsDistribution.score}
                            </span>
                          )}
                          {survey.type === 'csat' && survey.stats.csatDistribution && (
                            <span className="flex items-center gap-1 font-medium text-yellow-600">
                              <Star className="w-3 h-3" />
                              CSAT: {survey.stats.csatDistribution.avgScore}/5
                            </span>
                          )}
                          <span className="text-gray-400">
                            Trigger: {TRIGGER_CONFIG[survey.trigger.trigger].label}
                          </span>

                          {/* Expand Button */}
                          <button
                            onClick={() => setExpandedSurvey(isExpanded ? null : survey.id)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <BarChart3 className="w-3 h-3" />
                            Details
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingResponses(survey)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Responses"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportResponses(survey.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(survey)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(survey.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(survey.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Publish"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {survey.status === 'active' && (
                          <button
                            onClick={() => handlePause(survey.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {survey.status === 'paused' && (
                          <button
                            onClick={() => handleResume(survey.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Resume"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {(survey.status === 'active' || survey.status === 'paused') && (
                          <button
                            onClick={() => handleClose(survey.id)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Close"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(survey.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-gray-50 rounded-lg p-4 ml-16">
                        <div className="grid grid-cols-3 gap-6">
                          {/* Questions */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Questions</h4>
                            <div className="space-y-2">
                              {survey.questions.map((q, idx) => {
                                const QIcon = QUESTION_ICONS[q.type];
                                return (
                                  <div key={q.id} className="flex items-start gap-2 text-sm">
                                    <QIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-600">{idx + 1}. {q.text}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Stats */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Total Responses:</span>
                                <span className="font-medium">{survey.stats.totalResponses}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Avg. Duration:</span>
                                <span className="font-medium">{Math.round(survey.stats.avgDurationSeconds)}s</span>
                              </div>
                              {survey.stats.sentimentBreakdown && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <ThumbsUp className="w-3 h-3 text-green-500" /> Positive:
                                    </span>
                                    <span className="font-medium text-green-600">{survey.stats.sentimentBreakdown.positive}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <Minus className="w-3 h-3 text-gray-500" /> Neutral:
                                    </span>
                                    <span className="font-medium text-gray-600">{survey.stats.sentimentBreakdown.neutral}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <ThumbsDown className="w-3 h-3 text-red-500" /> Negative:
                                    </span>
                                    <span className="font-medium text-red-600">{survey.stats.sentimentBreakdown.negative}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Targeting */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Targeting</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">Tiers:</span>
                                <span className="ml-2 font-medium">{survey.targeting.tiers.join(', ')}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Roles:</span>
                                <span className="ml-2 font-medium">{survey.targeting.roles.join(', ')}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Trigger:</span>
                                <span className="ml-2 font-medium">{TRIGGER_CONFIG[survey.trigger.trigger].label}</span>
                              </div>
                            </div>
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
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No surveys found</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-emerald-600 hover:text-emerald-700"
              >
                Create your first survey
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <SurveyModal
          survey={editingSurvey}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {/* Responses Modal */}
      {viewingResponses && (
        <ResponsesModal
          survey={viewingResponses}
          onClose={() => setViewingResponses(null)}
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
