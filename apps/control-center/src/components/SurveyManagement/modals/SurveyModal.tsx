/**
 * Survey Modal Component
 * Create/Edit survey form with tabs for basic info, questions, targeting, settings
 */

import { useState, useEffect } from 'react';
import {
  X,
  RefreshCcw,
  Send,
  Trash2,
} from 'lucide-react';
import type {
  Survey,
  SurveyType,
  SurveyQuestion,
  QuestionType,
  CreateSurveyInput,
  SurveyTrigger,
} from '@/types';
import {
  SURVEY_TYPE_CONFIG,
  QUESTION_TYPE_CONFIG,
  TRIGGER_CONFIG,
} from '@/types/survey';
import { TYPE_ICONS, QUESTION_ICONS } from '../constants';

interface SurveyModalProps {
  survey: Survey | null;
  onSave: (data: CreateSurveyInput) => void;
  onClose: () => void;
}

export function SurveyModal({ survey, onSave, onClose }: SurveyModalProps) {
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
