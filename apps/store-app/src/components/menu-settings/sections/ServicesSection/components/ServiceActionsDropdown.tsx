import {
  Edit3,
  Trash2,
  MoreVertical,
  Copy,
  EyeOff,
  Eye,
  Archive,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MenuServiceWithEmbeddedVariants } from '@/types/catalog';

export interface ServiceActionsDropdownProps {
  /** The service to show actions for */
  service: MenuServiceWithEmbeddedVariants;
  /** Called when Edit is clicked */
  onEdit: (service: MenuServiceWithEmbeddedVariants) => void;
  /** Called when Duplicate is clicked */
  onDuplicate: (service: MenuServiceWithEmbeddedVariants) => void;
  /** Called when Activate/Deactivate is clicked */
  onToggleStatus: (serviceId: string) => void;
  /** Called when Archive is clicked */
  onArchive: (service: MenuServiceWithEmbeddedVariants) => void;
  /** Called when Delete is clicked */
  onDelete: (serviceId: string) => void;
  /** Optional custom trigger button size - 'sm' for grid view, 'md' for list view */
  size?: 'sm' | 'md';
}

/**
 * Dropdown menu for service actions (Edit, Duplicate, Toggle Status, Archive, Delete).
 *
 * Used in both grid and list views of ServicesSection to provide consistent actions.
 *
 * @example
 * ```tsx
 * <ServiceActionsDropdown
 *   service={service}
 *   onEdit={(s) => setEditingService(s)}
 *   onDuplicate={(s) => handleDuplicate(s)}
 *   onToggleStatus={(id) => handleToggleStatus(id)}
 *   onArchive={(s) => handleOpenArchiveModal(s)}
 *   onDelete={(id) => handleOpenDeleteDialog(id)}
 * />
 * ```
 */
export function ServiceActionsDropdown({
  service,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onArchive,
  onDelete,
  size = 'sm',
}: ServiceActionsDropdownProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  const buttonPadding = size === 'sm' ? 'p-1.5' : 'p-2';
  const triggerIconSize = size === 'sm' ? 16 : 18;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`${buttonPadding} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg`}
          aria-label={`Actions for ${service.name}`}
        >
          <MoreVertical size={triggerIconSize} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(service)}>
          <Edit3 size={iconSize} className="mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(service)}>
          <Copy size={iconSize} className="mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(service.id)}>
          {service.status === 'active' ? (
            <>
              <EyeOff size={iconSize} className="mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <Eye size={iconSize} className="mr-2" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(service)}>
          <Archive size={iconSize} className="mr-2" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(service.id)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 size={iconSize} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
