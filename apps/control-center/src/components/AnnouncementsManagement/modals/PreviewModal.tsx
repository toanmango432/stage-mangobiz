/**
 * Preview Modal Component
 * Shows how announcement appears in different channels
 */

import { X, XCircle } from 'lucide-react';
import type { Announcement } from '@/types';
import {
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  PRIORITY_CONFIG,
  TARGET_TIER_LABELS,
  TARGET_ROLE_LABELS,
} from '@/types/announcement';
import { CATEGORY_ICONS, SEVERITY_ICONS } from '../constants';

interface PreviewModalProps {
  announcement: Announcement;
  onClose: () => void;
}

export function PreviewModal({ announcement, onClose }: PreviewModalProps) {
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
