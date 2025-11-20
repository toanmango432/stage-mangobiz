/**
 * Header Color Coding Preview
 * Side-by-side comparison of current vs proposed header designs
 */

import { Clock, Users, Activity, CreditCard, Star, TrendingUp, Timer } from 'lucide-react';

export function HeaderColorPreview() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Front Desk Header Color Coding</h1>
        <p className="text-gray-600 mb-8">Compare current headers (left) with proposed subtle color theming (right)</p>

        {/* COMING APPOINTMENTS */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Coming Appointments</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design</p>
              </div>
              <div className="bg-white/50 border-b border-slate-200/50 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <h2 className="text-[13px] font-medium text-slate-600">Coming</h2>
                  <span className="bg-sky-50/70 text-sky-600 text-[11px] font-medium px-1.5 py-0.5 rounded-md">
                    10
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-red-200/30 bg-red-50/50 text-red-600">
                    <span>Late</span><span>2</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Proposed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Proposed Design ✓</p>
              </div>
              <div className="bg-white/50 border-b border-slate-200/50 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Clock size={14} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[13px] font-medium text-slate-600">Coming</h2>
                  <span className="bg-sky-50/70 text-sky-600 text-[11px] font-medium px-1.5 py-0.5 rounded-md">
                    10
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-red-200/30 bg-red-50/50 text-red-600">
                    <span>Late</span><span>2</span>
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">✓ Updated with subtle pastel icon background</p>
              </div>
            </div>
          </div>
        </div>

        {/* WAITING QUEUE */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Waiting Queue</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design</p>
              </div>
              <div className="bg-white/70 border-b border-slate-200/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Timer size={18} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 leading-tight">Waiting Queue</h2>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        35
                      </span>
                    </div>
                    <span className="text-2xs text-slate-500">Avg 15m</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ Uses dark slate - no status color</p>
              </div>
            </div>

            {/* Proposed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Proposed Design ✨</p>
              </div>
              <div className="bg-white/70 border-b border-violet-100 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                    <Timer size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900 leading-tight">Waiting Queue</h2>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        35
                      </span>
                    </div>
                    <span className="text-2xs text-violet-600">Avg 15m</span>
                  </div>
                </div>
              </div>
              <div className="bg-violet-50/30 px-4 py-2">
                <p className="text-xs text-violet-700">✨ Violet theme - instantly recognizable as waiting status</p>
              </div>
            </div>
          </div>
        </div>

        {/* IN SERVICE */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. In Service</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design</p>
              </div>
              <div className="bg-white/70 border-b border-slate-200/60 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Activity size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 leading-tight">In Service</h2>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        38
                      </span>
                    </div>
                    <span className="text-2xs text-slate-500">Avg 38m</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ Uses dark slate - identical to Waiting Queue!</p>
              </div>
            </div>

            {/* Proposed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Proposed Design ✨</p>
              </div>
              <div className="bg-white/70 border-b border-green-100 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Activity size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900 leading-tight">In Service</h2>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        38
                      </span>
                    </div>
                    <span className="text-2xs text-emerald-600">Avg 38m</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50/30 px-4 py-2">
                <p className="text-xs text-emerald-700">✨ Green theme - active service in progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* PENDING PAYMENT */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Pending Payment</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design</p>
              </div>
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Pending Payment</h1>
                  <p className="text-sm text-gray-500">23 tickets awaiting payment</p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ No icon, no color theming - looks plain</p>
              </div>
            </div>

            {/* Proposed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Proposed Design ✨</p>
              </div>
              <div className="bg-white/70 border-b border-amber-100 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <CreditCard size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900 leading-tight">Pending Payment</h2>
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        23
                      </span>
                    </div>
                    <span className="text-2xs text-amber-600">Total $2,340</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50/30 px-4 py-2">
                <p className="text-xs text-amber-700">✨ Amber theme - attention needed for payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Summary of Changes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 mb-2">Color Palette:</p>
              <ul className="space-y-1 text-blue-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-sky-500"></div>
                  <span>Coming - Sky Blue (#0EA5E9)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-violet-500"></div>
                  <span>Waiting - Violet (#8B5CF6)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>
                  <span>In Service - Green (#10B981)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  <span>Pending - Amber (#F59E0B)</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-2">Key Improvements:</p>
              <ul className="space-y-1 text-blue-700 list-disc list-inside">
                <li>44px icons (h-11) - optimal for scanning</li>
                <li>Subtle pastel icon backgrounds (not bold solid colors)</li>
                <li>text-xl (20px) titles - enhanced readability</li>
                <li>Clean count numbers inline with title</li>
                <li>Subtle avg metrics under titles</li>
                <li>Modern, Apple-like aesthetic with balanced proportions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
