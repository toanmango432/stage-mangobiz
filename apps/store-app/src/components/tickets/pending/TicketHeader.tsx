import { MoreVertical, Edit2, Printer, Mail, Trash2 } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { PremiumColors } from '@/constants/premiumDesignTokens';

interface TicketHeaderProps {
  ticketId: string;
  isMenuOpen: boolean;
  onOpenMenu: (id: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

/**
 * TicketHeader Component
 *
 * Displays ticket ID badge and dropdown menu for actions.
 * Includes edit, print, email, and void options.
 */
export function TicketHeader({
  ticketId,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
  dropdownRef,
}: TicketHeaderProps) {
  return (
    <div
      className="flex justify-between items-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 border-b border-dashed"
      style={{ borderColor: PremiumColors.borders.light }}
    >
      {/* Ticket ID Badge */}
      <div className="flex items-center gap-2">
        <div
          className="text-2xs sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md border"
          style={{
            background: '#EEF2FF',
            color: '#4338CA',
            borderColor: '#C7D2FE',
          }}
        >
          #{ticketId}
        </div>
      </div>

      {/* Dropdown Menu */}
      <div className="relative">
        <Tippy content="More options">
          <button
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
            onClick={(e) => onOpenMenu(ticketId, e)}
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={14} />
          </button>
        </Tippy>

        {isMenuOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1"
            role="menu"
          >
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMenu();
                // Edit receipt - not yet implemented
              }}
            >
              <Edit2 size={14} className="mr-2 text-blue-500" />
              Edit Receipt
            </button>

            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMenu();
                // Print receipt - not yet implemented
              }}
            >
              <Printer size={14} className="mr-2 text-gray-500" />
              Print Receipt
            </button>

            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMenu();
                // Email receipt - not yet implemented
              }}
            >
              <Mail size={14} className="mr-2 text-gray-500" />
              Email Receipt
            </button>

            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 flex items-center transition-colors"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMenu();
                // Void receipt - not yet implemented
              }}
            >
              <Trash2 size={14} className="mr-2 text-red-500" />
              Void Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
