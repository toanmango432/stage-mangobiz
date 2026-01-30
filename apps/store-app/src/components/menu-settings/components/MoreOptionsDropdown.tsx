import { useState } from 'react';
import {
  MoreVertical,
  Upload,
  Download,
  Edit,
  Printer,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

export interface MoreOptionsDropdownProps {
  /** Called when Import from JSON is clicked */
  onImportJson?: () => void;
  /** Called when Import from CSV is clicked */
  onImportCsv?: () => void;
  /** Called when Export to JSON is clicked */
  onExportJson?: () => void;
  /** Called when Export to CSV is clicked */
  onExportCsv?: () => void;
  /** Called when Bulk Edit Mode is toggled */
  onToggleBulkEdit?: () => void;
  /** Whether bulk edit mode is active */
  isBulkEditActive?: boolean;
  /** Called when Print Menu is clicked */
  onPrintMenu?: () => void;
}

/**
 * Dropdown menu for additional catalog options.
 *
 * Provides access to:
 * - Import catalog (from JSON/CSV)
 * - Export catalog (to JSON/CSV)
 * - Bulk edit mode toggle
 * - Print menu
 *
 * @example
 * ```tsx
 * <MoreOptionsDropdown
 *   onImportJson={() => handleImportJson()}
 *   onExportJson={() => handleExportJson()}
 *   onToggleBulkEdit={() => setIsBulkEdit(!isBulkEdit)}
 *   isBulkEditActive={isBulkEdit}
 *   onPrintMenu={() => window.print()}
 * />
 * ```
 */
export function MoreOptionsDropdown({
  onImportJson,
  onImportCsv,
  onExportJson,
  onExportCsv,
  onToggleBulkEdit,
  isBulkEditActive = false,
  onPrintMenu,
}: MoreOptionsDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* Import submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Upload size={16} className="mr-2" />
            Import catalog
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleAction(onImportJson)}
              disabled={!onImportJson}
            >
              <FileJson size={16} className="mr-2" />
              From JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction(onImportCsv)}
              disabled={!onImportCsv}
            >
              <FileSpreadsheet size={16} className="mr-2" />
              From CSV
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Export submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download size={16} className="mr-2" />
            Export catalog
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleAction(onExportJson)}
              disabled={!onExportJson}
            >
              <FileJson size={16} className="mr-2" />
              To JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction(onExportCsv)}
              disabled={!onExportCsv}
            >
              <FileSpreadsheet size={16} className="mr-2" />
              To CSV
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Bulk edit toggle */}
        <DropdownMenuItem
          onClick={() => handleAction(onToggleBulkEdit)}
          disabled={!onToggleBulkEdit}
        >
          <Edit size={16} className="mr-2" />
          {isBulkEditActive ? 'Exit bulk edit' : 'Bulk edit mode'}
        </DropdownMenuItem>

        {/* Print menu */}
        <DropdownMenuItem
          onClick={() => handleAction(onPrintMenu)}
          disabled={!onPrintMenu}
        >
          <Printer size={16} className="mr-2" />
          Print menu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
