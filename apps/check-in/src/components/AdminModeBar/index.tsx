import { Shield, LogOut, RotateCcw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deactivateAdminMode } from '../../store/slices/adminSlice';
import { resetCheckin } from '../../store/slices/checkinSlice';

export function AdminModeBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAdminModeActive } = useAppSelector((state) => state.admin);

  if (!isAdminModeActive) return null;

  const handleExitAdmin = () => {
    dispatch(deactivateAdminMode());
  };

  const handleReset = () => {
    dispatch(resetCheckin());
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a5f4a] to-[#2d7a5f] shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left - Admin Mode Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-['Plus_Jakarta_Sans'] font-semibold text-white text-sm">
              Staff Mode Active
            </p>
            <p className="font-['Work_Sans'] text-white/70 text-xs">
              Assist client or manage kiosk
            </p>
          </div>
        </div>

        {/* Right - Admin Actions */}
        <div className="flex items-center gap-2">
          {/* Reset Kiosk Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm font-['Work_Sans']"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {/* Settings Button (placeholder for future) */}
          <button
            onClick={() => {
              /* Future: open settings */
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm font-['Work_Sans']"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Exit Admin Mode */}
          <button
            onClick={handleExitAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#1a5f4a] hover:bg-white/90 transition-colors text-sm font-['Plus_Jakarta_Sans'] font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Staff Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminModeBar;
