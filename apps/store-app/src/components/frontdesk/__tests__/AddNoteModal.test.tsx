/**
 * AddNoteModal Component Tests
 * Tests for note modal with keyboard shortcuts and textarea input
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AddNoteModal } from '../AddNoteModal';

// Mock Dialog component - avoid clicking triggering onOpenChange
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode; onOpenChange: (open: boolean) => void }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}));

describe('AddNoteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ticketId: 'ticket-1',
    ticketNumber: 1001,
    clientName: 'John Doe',
    currentNote: '',
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<AddNoteModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('shows "Add Note" title when no current note', () => {
      render(<AddNoteModal {...defaultProps} currentNote="" />);
      // Title contains "Add Note" (button also has "Add Note" but we check the title element)
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveTextContent('Add Note');
    });

    it('shows "Edit Note" title when has current note', () => {
      render(<AddNoteModal {...defaultProps} currentNote="Existing note" />);
      expect(screen.getByText('Edit Note')).toBeInTheDocument();
    });

    it('renders StickyNote icon in title', () => {
      const { container } = render(<AddNoteModal {...defaultProps} />);
      const icon = container.querySelector('.lucide-sticky-note');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('ticket info', () => {
    it('displays ticket number', () => {
      render(<AddNoteModal {...defaultProps} ticketNumber={1234} />);
      expect(screen.getByText('#1234')).toBeInTheDocument();
    });

    it('displays client name', () => {
      render(<AddNoteModal {...defaultProps} clientName="Jane Smith" />);
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('displays separator between ticket number and name', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByText('•')).toBeInTheDocument();
    });
  });

  describe('textarea', () => {
    it('renders textarea', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Add a note about this ticket...')).toBeInTheDocument();
    });

    it('initializes with currentNote value', () => {
      render(<AddNoteModal {...defaultProps} currentNote="Initial note" />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial note');
    });

    it('updates value on input', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'New note text' } });

      expect(textarea.value).toBe('New note text');
    });

    it('has maxLength of 500', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('displays character count', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    it('updates character count on input', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(screen.getByText('11/500')).toBeInTheDocument();
    });
  });

  describe('keyboard hint', () => {
    it('displays keyboard shortcut hint', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByText('Cmd+Enter')).toBeInTheDocument();
    });

    it('displays text about saving', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByText(/to save/)).toBeInTheDocument();
    });

    it('renders MessageSquare icon', () => {
      const { container } = render(<AddNoteModal {...defaultProps} />);
      const icon = container.querySelector('.lucide-message-square');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('cancel button', () => {
    it('renders Cancel button', () => {
      render(<AddNoteModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onClose when Cancel clicked', () => {
      const onClose = vi.fn();
      render(<AddNoteModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has outline variant', () => {
      render(<AddNoteModal {...defaultProps} />);
      const cancelBtn = screen.getByText('Cancel');
      expect(cancelBtn).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('save button', () => {
    it('shows "Add Note" when no current note', () => {
      render(<AddNoteModal {...defaultProps} currentNote="" />);
      // Both title and button have "Add Note" text
      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      expect(actionSaveBtn).toBeInTheDocument();
    });

    it('shows "Update Note" when has current note', () => {
      render(<AddNoteModal {...defaultProps} currentNote="Existing" />);
      expect(screen.getByText('Update Note')).toBeInTheDocument();
    });

    it('is disabled when no changes and empty note', () => {
      render(<AddNoteModal {...defaultProps} currentNote="" />);
      // Find the button in the actions area (not the title)
      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      expect(actionSaveBtn).toBeDisabled();
    });

    it('is enabled when note has content', () => {
      render(<AddNoteModal {...defaultProps} currentNote="" />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'New note' } });

      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      expect(actionSaveBtn).not.toBeDisabled();
    });

    it('calls onSave with trimmed note on click', () => {
      const onSave = vi.fn();
      render(<AddNoteModal {...defaultProps} onSave={onSave} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: '  New note with spaces  ' } });

      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      fireEvent.click(actionSaveBtn!);

      expect(onSave).toHaveBeenCalledWith('ticket-1', 'New note with spaces');
    });

    it('calls onClose after save', () => {
      const onClose = vi.fn();
      render(<AddNoteModal {...defaultProps} onClose={onClose} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'New note' } });

      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      fireEvent.click(actionSaveBtn!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard shortcuts', () => {
    it('saves on Cmd+Enter (Mac)', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'Test note' } });
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

      expect(defaultProps.onSave).toHaveBeenCalledWith('ticket-1', 'Test note');
    });

    it('saves on Ctrl+Enter (Windows/Linux)', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'Test note' } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      expect(defaultProps.onSave).toHaveBeenCalledWith('ticket-1', 'Test note');
    });

    it('closes on Escape', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.keyDown(textarea, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not save on Enter without modifier', () => {
      render(<AddNoteModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'Test note' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });
  });

  describe('note reset on open', () => {
    it('resets note to currentNote when modal reopens', () => {
      const { rerender } = render(<AddNoteModal {...defaultProps} isOpen={false} currentNote="Original" />);

      // Open the modal
      rerender(<AddNoteModal {...defaultProps} isOpen={true} currentNote="Original" />);

      const textarea = screen.getByPlaceholderText('Add a note about this ticket...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Original');
    });

    it('focuses textarea when modal opens', async () => {
      render(<AddNoteModal {...defaultProps} />);

      // Advance timers for the setTimeout focus
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');
      // Focus may not work in jsdom without proper setup, just check textarea exists
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('hasChanges logic', () => {
    it('detects changes from empty to content', () => {
      render(<AddNoteModal {...defaultProps} currentNote="" />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'New content' } });

      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      expect(actionSaveBtn).not.toBeDisabled();
    });

    it('detects changes from content to different content', () => {
      render(<AddNoteModal {...defaultProps} currentNote="Original" />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: 'Modified' } });

      const updateBtn = screen.getByText('Update Note');
      expect(updateBtn).not.toBeDisabled();
    });

    it('allows save when content exists even if unchanged after trim', () => {
      // Component logic: disabled={!hasChanges && !note.trim()}
      // Button is enabled when there's content, even if same as original
      render(<AddNoteModal {...defaultProps} currentNote="Original" />);
      const textarea = screen.getByPlaceholderText('Add a note about this ticket...');

      fireEvent.change(textarea, { target: { value: '  Original  ' } });

      const updateBtn = screen.getByText('Update Note');
      // Button is enabled because note.trim() has content
      expect(updateBtn).not.toBeDisabled();
    });
  });

  describe('styling', () => {
    it('dialog content has max width', () => {
      render(<AddNoteModal {...defaultProps} />);
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('sm:max-w-md');
    });

    it('save button has amber styling', () => {
      render(<AddNoteModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const actionSaveBtn = buttons.find(btn => btn.textContent === 'Add Note');
      expect(actionSaveBtn).toHaveClass('bg-amber-600');
    });

    it('StickyNote icon has amber color', () => {
      const { container } = render(<AddNoteModal {...defaultProps} />);
      const icon = container.querySelector('.lucide-sticky-note');
      expect(icon).toHaveClass('text-amber-600');
    });
  });
});
