import { useState } from 'react';
import { ArrowUp, ArrowDown, X, Settings, Shuffle, User, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react';

interface StaffTurn {
  id: string;
  name: string;
  photo?: string;
  position: number;
  lastServiceTime?: Date;
  serviceCountToday: number;
  specialties: string[];
  status: 'available' | 'busy' | 'on-break';
}

interface TurnQueueProps {
  staff: StaffTurn[];
  mode: 'manual' | 'auto';
  onModeChange: (mode: 'manual' | 'auto') => void;
  onReorder: (staffId: string, newPosition: number) => void;
  onSkip: (staffId: string) => void;
  onRemove: (staffId: string) => void;
  onSettings: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function TurnQueue({
  staff,
  mode,
  onModeChange,
  onReorder,
  onSkip,
  onRemove,
  onSettings,
  isMinimized = false,
  onToggleMinimize
}: TurnQueueProps) {
  const [draggedStaff, setDraggedStaff] = useState<string | null>(null);

  const sortedStaff = [...staff].sort((a, b) => a.position - b.position);
  const nextUpStaff = sortedStaff.find(s => s.status === 'available');

  const handleDragStart = (staffId: string) => {
    if (mode === 'manual') {
      setDraggedStaff(staffId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStaffId: string) => {
    if (draggedStaff && draggedStaff !== targetStaffId && mode === 'manual') {
      const draggedIndex = sortedStaff.findIndex(s => s.id === draggedStaff);
      const targetIndex = sortedStaff.findIndex(s => s.id === targetStaffId);
      onReorder(draggedStaff, targetIndex);
    }
    setDraggedStaff(null);
  };

  const moveUp = (staffId: string) => {
    const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
    if (currentIndex > 0) {
      onReorder(staffId, currentIndex - 1);
    }
  };

  const moveDown = (staffId: string) => {
    const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
    if (currentIndex < sortedStaff.length - 1) {
      onReorder(staffId, currentIndex + 1);
    }
  };

  const getTimeSinceLastService = (lastServiceTime?: Date) => {
    if (!lastServiceTime) return 'No services yet';
    const minutes = Math.floor((Date.now() - lastServiceTime.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isMinimized) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMinimize}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">Turn Queue</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              mode === 'auto' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {mode === 'auto' ? 'Auto' : 'Manual'}
            </span>
            {nextUpStaff && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-500">Next:</span>
                <div className="flex items-center gap-1.5">
                  {nextUpStaff.photo ? (
                    <img src={nextUpStaff.photo} alt={nextUpStaff.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{nextUpStaff.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <h3 className="text-base font-semibold text-gray-900">Turn Queue</h3>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => onModeChange('manual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                mode === 'manual'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => onModeChange('auto')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                mode === 'auto'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        <button
          onClick={onSettings}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Queue List */}
      <div className="p-4">
        <div className="space-y-2">
          {sortedStaff.map((staffMember, index) => {
            const isNextUp = staffMember.id === nextUpStaff?.id;
            const isDragging = draggedStaff === staffMember.id;

            return (
              <div
                key={staffMember.id}
                draggable={mode === 'manual' && staffMember.status === 'available'}
                onDragStart={() => handleDragStart(staffMember.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(staffMember.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${isNextUp 
                    ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-300 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                  ${isDragging ? 'opacity-50' : ''}
                  ${mode === 'manual' && staffMember.status === 'available' ? 'cursor-move' : ''}
                `}
              >
                {/* Position Number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${isNextUp 
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {index + 1}
                </div>

                {/* Staff Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {staffMember.photo ? (
                      <img src={staffMember.photo} alt={staffMember.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{staffMember.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSinceLastService(staffMember.lastServiceTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {staffMember.serviceCountToday} today
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  {staffMember.specialties.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {staffMember.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${staffMember.status === 'available' ? 'bg-green-100 text-green-700' : ''}
                  ${staffMember.status === 'busy' ? 'bg-orange-100 text-orange-700' : ''}
                  ${staffMember.status === 'on-break' ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                  {staffMember.status === 'available' ? 'Available' : ''}
                  {staffMember.status === 'busy' ? 'Busy' : ''}
                  {staffMember.status === 'on-break' ? 'Break' : ''}
                </div>

                {/* Actions */}
                {mode === 'manual' && staffMember.status === 'available' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(staffMember.id)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveDown(staffMember.id)}
                      disabled={index === sortedStaff.length - 1}
                      className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onSkip(staffMember.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Skip to end"
                    >
                      <Shuffle className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onRemove(staffMember.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}

                {mode === 'auto' && isNextUp && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold">
                    <Shuffle className="w-3 h-3" />
                    Next Up
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedStaff.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No staff in turn queue</p>
            <p className="text-xs mt-1">Available staff will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
