import { useState, useEffect } from 'react';
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
  Activity,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Hash,
  Smile,
  CircleDot,
  CheckSquare,
  AlignLeft,
  ToggleLeft,
  Grid,
  ListOrdered,
  ChevronRight
} from 'lucide-react';
import type {
  Survey,
  SurveyType,
  SurveyStatus,
  SurveyQuestion,
  QuestionType,
  CreateSurveyInput,
  SurveyResponse,
  SurveyTrigger
} from '../types';
import {
  SURVEY_TYPE_CONFIG,
  QUESTION_TYPE_CONFIG,
  TRIGGER_CONFIG,
  SURVEY_STATUS_CONFIG
} from '../types/survey';
import { surveysDB, surveyResponsesDB } from '../db/database';

// Icons for survey types
const TYPE_ICONS: Record<SurveyType, typeof TrendingUp> = {
  nps: TrendingUp,
  csat: Star,
  ces: Activity,
  custom: ClipboardList,
};

// Icons for question types
const QUESTION_ICONS: Record<QuestionType, typeof Hash> = {
  nps_scale: Hash,
  rating_stars: Star,
  rating_numeric: BarChart3,
  rating_emoji: Smile,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  dropdown: ChevronDown,
  text_short: Minus,
  text_long: AlignLeft,
  yes_no: ToggleLeft,
  matrix: Grid,
  ranking: ListOrdered,
};

export function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SurveyStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [viewingResponses, setViewingResponses] = useState<Survey | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const all = await surveysDB.getAll();
      setSurveys(all);
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  };

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
        await surveysDB.update(editingSurvey.id, data as any);
      } else {
        const session = localStorage.getItem('mango_admin_session');
        const adminId = session ? JSON.parse(session).id : 'unknown';
        await surveysDB.create(data, adminId);
      }
      await loadSurveys();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save survey:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await surveysDB.publish(id);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to publish survey:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await surveysDB.pause(id);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to pause survey:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await surveysDB.resume(id);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to resume survey:', error);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await surveysDB.close(id);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to close survey:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const session = localStorage.getItem('mango_admin_session');
      const adminId = session ? JSON.parse(session).id : 'unknown';
      await surveysDB.duplicate(id, adminId);
      await loadSurveys();
    } catch (error) {
      console.error('Failed to duplicate survey:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await surveysDB.delete(id);
      await loadSurveys();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  };

  const handleExportResponses = async (surveyId: string) => {
    try {
      const { headers, rows } = await surveyResponsesDB.exportBySurvey(surveyId);
      if (rows.length === 0) {
        alert('No responses to export');
        return;
      }

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `survey-responses-${surveyId}.csv`;
      link.click();
    } catch (error) {
      console.error('Failed to export responses:', error);
    }
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
      <div className="grid grid-cols-7 gap-3 mb-8">
        {(['all', 'active', 'scheduled', 'paused', 'draft', 'closed', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-3 rounded-xl border-2 transition-all ${
              filterStatus === status
                ? 'border-emerald-500 bg-emerald-50'
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
              const statusConfig = SURVEY_STATUS_CONFIG[survey.status];
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Survey?</h3>
              <p className="text-gray-600 mb-6">This will also delete all responses.</p>
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

// ==================== SURVEY MODAL ====================

function SurveyModal({
  survey,
  onSave,
  onClose,
}: {
  survey: Survey | null;
  onSave: (data: CreateSurveyInput) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(survey?.name || '');
  const [title, setTitle] = useState(survey?.title || '');
  const [description, setDescription] = useState(survey?.description || '');
  const [type, setType] = useState<SurveyType>(survey?.type || 'nps');
  const [questions, setQuestions] = useState<SurveyQuestion[]>(survey?.questions || []);
  const [trigger, setTrigger] = useState<SurveyTrigger>(survey?.trigger.trigger || 'manual');
  const [targetTiers, setTargetTiers] = useState<string[]>(survey?.targeting.tiers || ['all']);
  const [targetRoles, setTargetRoles] = useState<string[]>(survey?.targeting.roles || ['all']);
  const [thankYouTitle, setThankYouTitle] = useState(survey?.thankYou.title || 'Thank you for your feedback!');
  const [thankYouMessage, setThankYouMessage] = useState(survey?.thankYou.message || 'Your response has been recorded.');

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'targeting' | 'settings'>('basic');

  // Add default question when type changes
  useEffect(() => {
    if (!survey && questions.length === 0) {
      const typeConfig = SURVEY_TYPE_CONFIG[type];
      if (typeConfig.defaultQuestion) {
        setQuestions([{
          id: crypto.randomUUID(),
          order: 0,
          required: true,
          ...typeConfig.defaultQuestion,
        } as SurveyQuestion]);
      }
    }
  }, [type, survey, questions.length]);

  const addQuestion = (questionType: QuestionType) => {
    const newQuestion: SurveyQuestion = {
      id: crypto.randomUUID(),
      type: questionType,
      text: '',
      required: false,
      order: questions.length,
    };

    if (questionType === 'single_choice' || questionType === 'multiple_choice') {
      newQuestion.choiceConfig = {
        options: [
          { id: '1', label: 'Option 1', value: 'option_1' },
          { id: '2', label: 'Option 2', value: 'option_2' },
        ],
      };
    }

    if (questionType === 'rating_stars') {
      newQuestion.ratingConfig = { min: 1, max: 5 };
    }

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || questions.length === 0) return;

    setSaving(true);
    try {
      await onSave({
        name,
        title,
        description: description || undefined,
        type,
        questions: questions.map(({ id, ...q }) => q),
        trigger: { trigger },
        targeting: {
          tiers: targetTiers as any[],
          roles: targetRoles as any[],
        },
        thankYou: {
          title: thankYouTitle,
          message: thankYouMessage,
        },
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
                {survey ? 'Edit Survey' : 'New Survey'}
              </h2>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              {(['basic', 'questions', 'targeting', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-emerald-100 text-emerald-700'
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
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Q4 2024 NPS Survey"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Shown to users"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Brief description shown at start of survey"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Survey Type</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(Object.keys(SURVEY_TYPE_CONFIG) as SurveyType[]).map((t) => {
                      const config = SURVEY_TYPE_CONFIG[t];
                      const Icon = TYPE_ICONS[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                            type === t
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${type === t ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                          <span className="text-xs text-gray-500 text-center">{config.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {/* Existing Questions */}
                {questions.map((q, idx) => {
                  const QIcon = QUESTION_ICONS[q.type];
                  const config = QUESTION_TYPE_CONFIG[q.type];
                  return (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <QIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{config.label}</span>
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                className="rounded text-emerald-600"
                              />
                              Required
                            </label>
                          </div>
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Enter your question"
                          />

                          {/* Choice options */}
                          {q.choiceConfig && (
                            <div className="mt-2 space-y-1">
                              {q.choiceConfig.options.map((opt, optIdx) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">{optIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const newOptions = [...q.choiceConfig!.options];
                                      newOptions[optIdx] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                      updateQuestion(q.id, { choiceConfig: { ...q.choiceConfig!, options: newOptions } });
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                                    placeholder={`Option ${optIdx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = q.choiceConfig!.options.filter((_, i) => i !== optIdx);
                                      updateQuestion(q.id, { choiceConfig: { ...q.choiceConfig!, options: newOptions } });
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOption = { id: crypto.randomUUID(), label: '', value: '' };
                                  updateQuestion(q.id, { choiceConfig: { ...q.choiceConfig!, options: [...q.choiceConfig!.options, newOption] } });
                                }}
                                className="text-xs text-emerald-600 hover:text-emerald-700"
                              >
                                + Add option
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Question */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-3">Add a question:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['single_choice', 'multiple_choice', 'text_short', 'text_long', 'rating_stars', 'yes_no'] as QuestionType[]).map((qt) => {
                      const config = QUESTION_TYPE_CONFIG[qt];
                      const Icon = QUESTION_ICONS[qt];
                      return (
                        <button
                          key={qt}
                          type="button"
                          onClick={() => addQuestion(qt)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Targeting Tab */}
            {activeTab === 'targeting' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TRIGGER_CONFIG) as SurveyTrigger[]).map((t) => {
                      const config = TRIGGER_CONFIG[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTrigger(t)}
                          className={`p-3 rounded-lg border-2 text-left ${
                            trigger === t
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium block">{config.label}</span>
                          <span className="text-xs text-gray-500">{config.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Tiers</label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'free', 'basic', 'professional', 'enterprise'].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => toggleTier(tier)}
                        className={`px-4 py-2 rounded-lg border-2 capitalize ${
                          targetTiers.includes(tier)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {tier === 'all' ? 'All Tiers' : tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'owner', 'manager', 'staff'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-4 py-2 rounded-lg border-2 capitalize ${
                          targetRoles.includes(role)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Thank You Page</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title</label>
                      <input
                        type="text"
                        value={thankYouTitle}
                        onChange={(e) => setThankYouTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Message</label>
                      <textarea
                        value={thankYouMessage}
                        onChange={(e) => setThankYouMessage(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
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
              disabled={saving || !name || !title || questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Saving...' : survey ? 'Update' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== RESPONSES MODAL ====================

function ResponsesModal({
  survey,
  onClose,
}: {
  survey: Survey;
  onClose: () => void;
}) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  useEffect(() => {
    loadResponses();
  }, [survey.id]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await surveyResponsesDB.getBySurvey(survey.id);
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Survey Responses</h2>
              <p className="text-sm text-gray-500">{survey.name} - {responses.length} responses</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Responses List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : responses.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {responses.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedResponse(r)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedResponse?.id === r.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {r.sentiment === 'positive' && <ThumbsUp className="w-4 h-4 text-green-500" />}
                      {r.sentiment === 'negative' && <ThumbsDown className="w-4 h-4 text-red-500" />}
                      {r.sentiment === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm font-medium text-gray-900">
                        {r.npsScore !== undefined && `NPS: ${r.npsScore}`}
                        {r.csatScore !== undefined && `CSAT: ${r.csatScore}/5`}
                        {r.cesScore !== undefined && `CES: ${r.cesScore}/7`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(r.completedAt)}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.durationSeconds}s duration</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No responses yet
              </div>
            )}
          </div>

          {/* Response Detail */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedResponse ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Response Details</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedResponse.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    selectedResponse.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedResponse.sentiment || 'No sentiment'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tenant:</span>
                    <span className="ml-2 font-medium">{selectedResponse.tenantId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedResponse.completedAt)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Answers</h4>
                  <div className="space-y-3">
                    {selectedResponse.answers.map((answer, idx) => {
                      const question = survey.questions.find(q => q.id === answer.questionId);
                      return (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 mb-1">{question?.text || 'Question'}</p>
                          <p className="font-medium">
                            {typeof answer.value === 'object'
                              ? JSON.stringify(answer.value)
                              : String(answer.value ?? answer.text ?? '-')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChevronRight className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Select a response to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
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
