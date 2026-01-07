/**
 * Responses Modal Component
 * View survey responses with detail panel
 */

import { useState } from 'react';
import {
  X,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ChevronRight,
} from 'lucide-react';
import type { Survey, SurveyResponse } from '@/types';
import { useSurveyResponses } from '@/hooks/queries';

interface ResponsesModalProps {
  survey: Survey;
  onClose: () => void;
}

export function ResponsesModal({ survey, onClose }: ResponsesModalProps) {
  const { data: responses = [], isLoading: loading } = useSurveyResponses(survey.id);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

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
