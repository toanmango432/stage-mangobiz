/**
 * Ticket Color Coding Preview
 * Side-by-side comparison of current vs proposed ticket color coding
 * Uses actual grid-normal designs from ticket card components
 */

import { Clock, CheckCircle, Timer, Activity, CreditCard, User, UserPlus, Check } from 'lucide-react';

export function TicketColorPreview() {
  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket Color Coding System</h1>
        <p className="text-gray-600 mb-8">Compare current tickets (left) with proposed color-coded design (right) - Grid Normal View</p>

        {/* WAITING QUEUE TICKETS */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Timer size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">1. Waiting Queue Tickets</h2>
            <span className="text-sm text-violet-600 bg-violet-50 px-2 py-1 rounded">Violet Theme</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current - ACTUAL DESIGN */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design (Actual)</p>
              </div>
              <div className="p-4">
                {/* ACTUAL paper ticket design with all elements */}
                <div className="relative overflow-visible min-w-[280px]" style={{
                  background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
                  border: '1px dashed #D8D8D8',
                  borderRadius: '10px',
                  boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12)'
                }}>
                  {/* Perforation dots at top */}
                  <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-4" style={{ opacity: 0.108 }}>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
                    ))}
                  </div>

                  {/* Dog-ear corner */}
                  <div className="absolute top-0 right-0 w-7 h-7" style={{
                    background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.06)',
                    borderRadius: '0 10px 0 0'
                  }} />

                  {/* Ticket number tab on LEFT */}
                  <div className="absolute left-0 top-5 w-14 h-11 flex items-center justify-center text-2xl font-black text-[#1a1614]" style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
                    borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
                    borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
                    boxShadow: '3px 0 8px rgba(139, 92, 46, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1)',
                    transform: 'translateX(-4px)',
                    letterSpacing: '-0.02em'
                  }}>
                    12
                  </div>

                  {/* Content area */}
                  <div className="pl-14 pr-4 pt-5 pb-4">
                    {/* Name row */}
                    <div className="mb-1">
                      <h3 className="text-xl font-bold text-[#1a1614] tracking-tight">Sarah Johnson</h3>
                      <p className="text-xs text-[#8b7968] font-medium">Returning client</p>
                    </div>

                    {/* Service */}
                    <div className="text-base text-[#1a1614] font-semibold mb-3">Manicure + Pedicure</div>

                    {/* Divider */}
                    <div className="border-t border-[#e8dcc8]/50 mb-3" />

                    {/* Time info */}
                    <div className="flex items-center justify-between text-sm text-[#5a4d44] font-medium mb-3">
                      <span>Waited 5m</span>
                      <span>In at 10:30 AM</span>
                    </div>

                    {/* Assign button container */}
                    <div className="px-3 py-3 rounded-lg" style={{
                      background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                      boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08)',
                      border: '1px solid rgba(212, 184, 150, 0.15)'
                    }}>
                      <button className="w-full h-11 flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-600 rounded-lg font-bold">
                        <UserPlus size={20} strokeWidth={2.5} />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>

                  {/* Paper texture overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")',
                    backgroundSize: '200px 200px',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ Generic neutral colors - no status theming</p>
              </div>
            </div>

            {/* Proposed - SOFT INK STAMP (Option B) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Option B: Soft Ink Stamp 📮</p>
              </div>
              <div className="p-4">
                {/* Soft ink stamp: Solid subtle edge + Faded stamp badge */}
                <div className="relative overflow-visible min-w-[280px]" style={{
                  background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
                  border: '1px dashed #D8D8D8',
                  borderLeft: '3px solid rgba(139, 92, 246, 0.18)',
                  borderRadius: '10px',
                  boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12)'
                }}>
                  {/* Perforation dots at top - SAME */}
                  <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-4" style={{ opacity: 0.108 }}>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
                    ))}
                  </div>

                  {/* Dog-ear corner - SAME */}
                  <div className="absolute top-0 right-0 w-7 h-7" style={{
                    background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.06)',
                    borderRadius: '0 10px 0 0'
                  }} />

                  {/* Ticket number badge - FADED INK STAMP style with BLACK text */}
                  <div className="absolute left-0 top-5 w-14 h-11 flex items-center justify-center text-2xl font-black" style={{
                    color: '#1a1614',
                    background: 'rgba(139, 92, 246, 0.06)',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderTop: '2px solid rgba(139, 92, 246, 0.28)',
                    borderRight: '2px solid rgba(139, 92, 246, 0.28)',
                    borderBottom: '2px solid rgba(139, 92, 246, 0.28)',
                    boxShadow: '3px 0 6px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    transform: 'translateX(-4px)',
                    letterSpacing: '-0.02em'
                  }}>
                    12
                  </div>

                  {/* Content area - ALL SAME */}
                  <div className="pl-14 pr-4 pt-5 pb-4">
                    {/* Name row */}
                    <div className="mb-1">
                      <h3 className="text-xl font-bold text-[#1a1614] tracking-tight">Sarah Johnson</h3>
                      <p className="text-xs text-[#8b7968] font-medium">Returning client</p>
                    </div>

                    {/* Service */}
                    <div className="text-base text-[#1a1614] font-semibold mb-3">Manicure + Pedicure</div>

                    {/* Divider */}
                    <div className="border-t border-[#e8dcc8]/50 mb-3" />

                    {/* Time info */}
                    <div className="flex items-center justify-between text-sm text-[#5a4d44] font-medium mb-3">
                      <span>Waited 5m</span>
                      <span>In at 10:30 AM</span>
                    </div>

                    {/* Assign button container */}
                    <div className="px-3 py-3 rounded-lg" style={{
                      background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                      boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08)',
                      border: '1px solid rgba(212, 184, 150, 0.15)'
                    }}>
                      <button className="w-full h-11 flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-600 rounded-lg font-bold">
                        <UserPlus size={20} strokeWidth={2.5} />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>

                  {/* Paper texture overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")',
                    backgroundSize: '200px 200px',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
              <div className="bg-violet-50/30 px-4 py-2">
                <p className="text-xs text-violet-700">✨ Solid edge (18% opacity) + Stamp badge (BLACK text, 6% bg, stamp-like 8px radius)</p>
              </div>
            </div>
          </div>
        </div>

        {/* IN SERVICE TICKETS */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">2. In Service Tickets</h2>
            <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Emerald Theme</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current - ACTUAL DESIGN */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design (Actual)</p>
              </div>
              <div className="p-4">
                {/* ACTUAL paper ticket design - same as Waiting Queue */}
                <div className="relative overflow-visible min-w-[280px]" style={{
                  background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
                  border: '1px dashed #D8D8D8',
                  borderRadius: '10px',
                  boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12)'
                }}>
                  {/* Perforation dots at top */}
                  <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-4" style={{ opacity: 0.108 }}>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
                    ))}
                  </div>

                  {/* Dog-ear corner */}
                  <div className="absolute top-0 right-0 w-7 h-7" style={{
                    background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.06)',
                    borderRadius: '0 10px 0 0'
                  }} />

                  {/* Ticket number tab on LEFT */}
                  <div className="absolute left-0 top-5 w-14 h-11 flex items-center justify-center text-2xl font-black text-[#1a1614]" style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
                    borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
                    borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
                    boxShadow: '3px 0 8px rgba(139, 92, 46, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1)',
                    transform: 'translateX(-4px)',
                    letterSpacing: '-0.02em'
                  }}>
                    2
                  </div>

                  {/* Content area */}
                  <div className="pl-14 pr-4 pt-5 pb-4">
                    {/* Name row */}
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-[#1a1614] tracking-tight">Mike Chen</h3>
                      <p className="text-xs text-[#8b7968] font-medium">Returning client</p>
                    </div>

                    {/* Service */}
                    <div className="text-base text-[#1a1614] font-semibold mb-3">Manicure</div>

                    {/* Divider */}
                    <div className="border-t border-[#e8dcc8]/50 mb-3" />

                    {/* Progress info */}
                    <div className="flex items-center justify-between text-sm text-[#5a4d44] font-medium mb-2">
                      <span>15m left</span>
                      <span className="text-base font-bold" style={{ color: '#7E5F93' }}>75%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden mb-4" style={{ borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}>
                      <div className="h-full transition-all duration-300" style={{
                        width: '75%',
                        background: 'linear-gradient(to right, #9B7EAE, #7E5F93)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                        borderRadius: '5px'
                      }} />
                    </div>

                    {/* Staff + Done button container */}
                    <div className="px-3 py-3 rounded-lg flex items-center justify-between gap-3" style={{
                      background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                      boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08)',
                      border: '1px solid rgba(212, 184, 150, 0.15)'
                    }}>
                      <div className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg" style={{
                        background: '#6B7280',
                        boxShadow: '0 2.1px 4.2px rgba(0, 0, 0, 0.126)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
                      }}>
                        TECH 1
                      </div>
                      <button className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 rounded-full">
                        <Check size={24} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Paper texture overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")',
                    backgroundSize: '200px 200px',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ Generic neutral colors - purple progress bar doesn't match header</p>
              </div>
            </div>

            {/* Proposed - SOFT INK STAMP (Option B) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Option B: Soft Ink Stamp 📮</p>
              </div>
              <div className="p-4">
                {/* Soft ink stamp: Solid subtle edge + Faded stamp badge */}
                <div className="relative overflow-visible min-w-[280px]" style={{
                  background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
                  border: '1px dashed #D8D8D8',
                  borderLeft: '3px solid rgba(16, 185, 129, 0.18)',
                  borderRadius: '10px',
                  boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12)'
                }}>
                  {/* Perforation dots - SAME */}
                  <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-4" style={{ opacity: 0.108 }}>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
                    ))}
                  </div>

                  {/* Dog-ear corner - SAME */}
                  <div className="absolute top-0 right-0 w-7 h-7" style={{
                    background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.06)',
                    borderRadius: '0 10px 0 0'
                  }} />

                  {/* Ticket number badge - FADED INK STAMP style with BLACK text */}
                  <div className="absolute left-0 top-5 w-14 h-11 flex items-center justify-center text-2xl font-black" style={{
                    color: '#1a1614',
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderTop: '2px solid rgba(16, 185, 129, 0.28)',
                    borderRight: '2px solid rgba(16, 185, 129, 0.28)',
                    borderBottom: '2px solid rgba(16, 185, 129, 0.28)',
                    boxShadow: '3px 0 6px rgba(16, 185, 129, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    transform: 'translateX(-4px)',
                    letterSpacing: '-0.02em'
                  }}>
                    2
                  </div>

                  {/* Content area - ALL SAME */}
                  <div className="pl-14 pr-4 pt-5 pb-4">
                    {/* Name row */}
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-[#1a1614] tracking-tight">Mike Chen</h3>
                      <p className="text-xs text-[#8b7968] font-medium">Returning client</p>
                    </div>

                    {/* Service */}
                    <div className="text-base text-[#1a1614] font-semibold mb-3">Manicure</div>

                    {/* Divider */}
                    <div className="border-t border-[#e8dcc8]/50 mb-3" />

                    {/* Progress info */}
                    <div className="flex items-center justify-between text-sm text-[#5a4d44] font-medium mb-2">
                      <span>15m left</span>
                      <span className="text-base font-bold" style={{ color: '#7E5F93' }}>75%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden mb-4" style={{ borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}>
                      <div className="h-full transition-all duration-300" style={{
                        width: '75%',
                        background: 'linear-gradient(to right, #9B7EAE, #7E5F93)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                        borderRadius: '5px'
                      }} />
                    </div>

                    {/* Staff + Done button container */}
                    <div className="px-3 py-3 rounded-lg flex items-center justify-between gap-3" style={{
                      background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                      boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08)',
                      border: '1px solid rgba(212, 184, 150, 0.15)'
                    }}>
                      <div className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg" style={{
                        background: '#6B7280',
                        boxShadow: '0 2.1px 4.2px rgba(0, 0, 0, 0.126)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
                      }}>
                        TECH 1
                      </div>
                      <button className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 rounded-full">
                        <Check size={24} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Paper texture overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")',
                    backgroundSize: '200px 200px',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
              <div className="bg-emerald-50/30 px-4 py-2">
                <p className="text-xs text-emerald-700">✨ Solid edge (18% opacity) + Stamp badge (BLACK text, 6% bg, stamp-like 8px radius)</p>
              </div>
            </div>
          </div>
        </div>

        {/* PENDING PAYMENT TICKETS */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <CreditCard size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">3. Pending Payment Tickets</h2>
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">Amber Theme</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current - ACTUAL DESIGN */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Current Design (Actual)</p>
              </div>
              <div className="p-4">
                {/* Real paper ticket design with notches */}
                <div className="relative px-2">
                  <div
                    className="relative overflow-visible"
                    style={{
                      background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
                      border: '2px solid #e8dcc8',
                      borderRadius: '12px',
                      boxShadow: '-2px 0 6px rgba(0,0,0,0.08), 2px 0 6px rgba(0,0,0,0.08), 0 4px 10px -2px rgba(0,0,0,0.15)',
                      padding: '20px 16px'
                    }}
                  >
                    {/* Left notch */}
                    <div style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#f9fafb',
                      borderRadius: '50%',
                      border: '2px solid #e8dcc8',
                      borderLeft: 'none'
                    }}></div>

                    {/* Right notch */}
                    <div style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#f9fafb',
                      borderRadius: '50%',
                      border: '2px solid #e8dcc8',
                      borderRight: 'none'
                    }}></div>

                    {/* UNPAID watermark */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-15deg)',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#dc2626',
                      opacity: 0.08,
                      letterSpacing: '4px',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}>
                      UNPAID
                    </div>

                    {/* Paper texture overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,92,46,0.02) 2px, rgba(139,92,46,0.02) 4px)',
                      pointerEvents: 'none',
                      borderRadius: '12px'
                    }}></div>

                    {/* Content */}
                    <div className="relative space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            #15
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">Emma Wilson</h3>
                            <p className="text-xs text-gray-600 mt-0.5">Manicure + Pedicure</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">$85.00</div>
                        </div>
                      </div>

                      <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle size={16} />
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-xs text-gray-600">⚠️ Generic neutral colors - blue button doesn't match payment urgency</p>
              </div>
            </div>

            {/* Proposed - SOFT INK STAMP (Option B) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <p className="text-xs font-semibold text-green-700 uppercase">Option B: Soft Ink Stamp 📮</p>
              </div>
              <div className="p-4">
                {/* Soft ink stamp: Solid subtle edge + Faded stamp badge */}
                <div className="relative px-2">
                  <div
                    className="relative overflow-visible"
                    style={{
                      background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
                      border: '2px solid #e8dcc8',
                      borderLeft: '4px solid rgba(245, 158, 11, 0.20)',
                      borderRadius: '12px',
                      boxShadow: '-2px 0 6px rgba(0,0,0,0.08), 2px 0 6px rgba(0,0,0,0.08), 0 4px 10px -2px rgba(0,0,0,0.15)',
                      padding: '20px 16px'
                    }}
                  >
                    {/* Left notch - SAME */}
                    <div style={{
                      position: 'absolute',
                      left: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#f9fafb',
                      borderRadius: '50%',
                      border: '2px solid #e8dcc8',
                      borderLeft: 'none'
                    }}></div>

                    {/* Right notch - SAME */}
                    <div style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      background: '#f9fafb',
                      borderRadius: '50%',
                      border: '2px solid #e8dcc8',
                      borderRight: 'none'
                    }}></div>

                    {/* UNPAID watermark - SAME */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-15deg)',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#dc2626',
                      opacity: 0.08,
                      letterSpacing: '4px',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}>
                      UNPAID
                    </div>

                    {/* Paper texture overlay - SAME */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,92,46,0.02) 2px, rgba(139,92,46,0.02) 4px)',
                      pointerEvents: 'none',
                      borderRadius: '12px'
                    }}></div>

                    {/* Content */}
                    <div className="relative space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Ticket number badge - FADED INK STAMP style with BLACK text */}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{
                            color: '#1a1614',
                            background: 'rgba(245, 158, 11, 0.06)',
                            border: '2px solid rgba(245, 158, 11, 0.30)',
                            borderRadius: '7px',
                            boxShadow: '0 3px 6px rgba(245, 158, 11, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                          }}>
                            #15
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">Emma Wilson</h3>
                            <p className="text-xs text-gray-600 mt-0.5">Manicure + Pedicure</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">$85.00</div>
                        </div>
                      </div>

                      {/* Button - SAME */}
                      <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle size={16} />
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50/30 px-4 py-2">
                <p className="text-xs text-amber-700">✨ Solid edge (20% opacity) + Stamp badge (BLACK text, 6% bg, stamp-like 7px radius)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📮 Option B: Soft Ink Stamp System</h3>

          <div className="bg-white rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">🎯 Faded Postal Stamp Aesthetic</h4>
            <p className="text-sm text-blue-700 mb-4">
              Like vintage postal stamps with faded ink - clean, crisp edges with subtle color that feels authentic and timeless:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-blue-900">1️⃣ Solid Subtle Left Edge</div>
                <ul className="space-y-1 text-blue-700 list-disc list-inside ml-2">
                  <li><strong>18-20% opacity</strong> solid colored border</li>
                  <li>Clean, crisp line (no gradient)</li>
                  <li>Instant visual lane scanning</li>
                  <li>Professional, understated</li>
                  <li>No watercolor wash - pure simplicity</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-blue-900">2️⃣ Stamp Badge</div>
                <ul className="space-y-1 text-blue-700 list-disc list-inside ml-2">
                  <li><strong>Black text (#1a1614)</strong> - crisp & readable</li>
                  <li><strong>6% opacity background</strong> (barely there)</li>
                  <li>Stamp-like rounded corners (7-8px)</li>
                  <li>Visible colored border (28-30% opacity)</li>
                  <li>Feels like a postal mark on paper</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border-l-4 border-violet-500">
              <h4 className="font-semibold text-violet-700 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-violet-500"></div>
                Waiting Queue - Violet
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-violet-600">📍</span>
                  <span>Border: <code className="bg-violet-50 px-1 rounded">3px rgba(139,92,246,0.18)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-violet-600">📮</span>
                  <span>Text: <code className="bg-violet-50 px-1 rounded">#1a1614 (black)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-violet-600">🏷️</span>
                  <span>Badge: <code className="bg-violet-50 px-1 rounded">rgba(139,92,246,0.06)</code></span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500">
              <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                In Service - Emerald
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">📍</span>
                  <span>Border: <code className="bg-emerald-50 px-1 rounded">3px rgba(16,185,129,0.18)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">📮</span>
                  <span>Text: <code className="bg-emerald-50 px-1 rounded">#1a1614 (black)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">🏷️</span>
                  <span>Badge: <code className="bg-emerald-50 px-1 rounded">rgba(16,185,129,0.06)</code></span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
              <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                Pending Payment - Amber
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">📍</span>
                  <span>Border: <code className="bg-amber-50 px-1 rounded">4px rgba(245,158,11,0.20)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">📮</span>
                  <span>Text: <code className="bg-amber-50 px-1 rounded">#1a1614 (black)</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">🏷️</span>
                  <span>Badge: <code className="bg-amber-50 px-1 rounded">rgba(245,158,11,0.06)</code></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">Files to Update:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-xs">
                <div className="font-medium text-violet-700 mb-2">📄 WaitListTicketCardRefactored.tsx</div>
                <ul className="space-y-1 text-gray-700 list-disc list-inside ml-2">
                  <li>Border: <code className="text-xs">3px rgba(139,92,246,0.18)</code></li>
                  <li>Text: <code className="text-xs">#1a1614 (black)</code></li>
                  <li>Badge bg: <code className="text-xs">rgba(139,92,246,0.06)</code></li>
                </ul>
              </div>
              <div className="text-xs">
                <div className="font-medium text-emerald-700 mb-2">📄 ServiceTicketCardRefactored.tsx</div>
                <ul className="space-y-1 text-gray-700 list-disc list-inside ml-2">
                  <li>Border: <code className="text-xs">3px rgba(16,185,129,0.18)</code></li>
                  <li>Text: <code className="text-xs">#1a1614 (black)</code></li>
                  <li>Badge bg: <code className="text-xs">rgba(16,185,129,0.06)</code></li>
                </ul>
              </div>
              <div className="text-xs">
                <div className="font-medium text-amber-700 mb-2">📄 PendingTicketCard.tsx</div>
                <ul className="space-y-1 text-gray-700 list-disc list-inside ml-2">
                  <li>Border: <code className="text-xs">4px rgba(245,158,11,0.20)</code></li>
                  <li>Text: <code className="text-xs">#1a1614 (black)</code></li>
                  <li>Badge bg: <code className="text-xs">rgba(245,158,11,0.06)</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-100 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Design Rationale - Soft Ink Stamp:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>✓ <strong>Classic simplicity:</strong> Clean lines and solid colors feel timeless and professional</p>
              <p>✓ <strong>High readability:</strong> Black text ensures ticket numbers are crisp and instantly readable</p>
              <p>✓ <strong>Minimal footprint:</strong> 6% background barely there - paper stays pure</p>
              <p>✓ <strong>Stamp-like corners:</strong> 7-8px radius feels hand-stamped, not digital</p>
              <p>✓ <strong>Instant recognition:</strong> Crisp colored left border creates clear visual lanes</p>
              <p>✓ <strong>Scalable:</strong> Works perfectly across all view modes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
