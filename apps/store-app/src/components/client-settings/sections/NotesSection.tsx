import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EnhancedClient, ClientNote, ClientTag } from '../types';
import { defaultTags } from '../constants';
import { Card, Button, Textarea, EmptyState, PlusIcon } from '../components/SharedComponents';

interface NotesSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ client, onChange }) => {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<ClientNote['type']>('general');
  const [isPrivate, setIsPrivate] = useState(false);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: ClientNote = {
      id: uuidv4(),
      date: new Date().toISOString(),
      content: newNote.trim(),
      type: noteType,
      isPrivate,
      createdBy: 'current-user', // Would come from auth
      createdByName: 'Staff Member', // Would come from auth
    };

    onChange({
      notes: [note, ...(client.notes || [])],
    });

    setNewNote('');
    setNoteType('general');
    setIsPrivate(false);
  };

  const deleteNote = (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    onChange({
      notes: client.notes?.filter((n) => n.id !== noteId),
    });
  };

  const addTag = (tag: ClientTag) => {
    const currentTags = client.tags || [];
    if (currentTags.find((t) => t.id === tag.id)) return;
    onChange({
      tags: [...currentTags, tag],
    });
  };

  const removeTag = (tagId: string) => {
    onChange({
      tags: client.tags?.filter((t) => t.id !== tagId),
    });
  };

  const getNoteTypeColor = (type: ClientNote['type']) => {
    switch (type) {
      case 'important':
        return 'bg-red-100 text-red-700';
      case 'service':
        return 'bg-blue-100 text-blue-700';
      case 'preference':
        return 'bg-purple-100 text-purple-700';
      case 'medical':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Available tags to add (excluding already added ones)
  const availableTags = defaultTags.filter(
    (tag) => !client.tags?.find((t) => t.id === tag.id)
  );

  return (
    <div className="space-y-6">
      {/* Tags Section */}
      <Card title="Client Tags" description="Use tags to categorize and segment clients">
        {/* Current Tags */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Tags</h4>
          {client.tags && client.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="hover:bg-black/10 rounded-full p-0.5"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tags applied</p>
          )}
        </div>

        {/* Add Tags */}
        {availableTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add Tags</h4>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                    border-2 border-dashed transition-colors hover:border-solid"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Add New Note */}
      <Card title="Add Note">
        <div className="space-y-4">
          <Textarea
            label=""
            value={newNote}
            onChange={setNewNote}
            placeholder="Write a note about this client..."
            rows={3}
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Type:</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as ClientNote['type'])}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="general">General</option>
                <option value="service">Service Note</option>
                <option value="preference">Preference</option>
                <option value="medical">Medical</option>
                <option value="important">Important</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-600">Private note (staff only)</span>
            </label>

            <Button
              variant="primary"
              onClick={addNote}
              disabled={!newNote.trim()}
              className="ml-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Add Note
            </Button>
          </div>
        </div>
      </Card>

      {/* Notes List */}
      <Card title="Notes History">
        {client.notes && client.notes.length > 0 ? (
          <div className="space-y-4">
            {client.notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.type === 'important'
                    ? 'bg-red-50 border-red-200'
                    : note.type === 'medical'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getNoteTypeColor(note.type)}`}>
                        {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                      </span>
                      {note.isPrivate && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900">{note.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(note.date)}</span>
                      {note.createdByName && <span>By: {note.createdByName}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<NoteIcon className="w-8 h-8 text-gray-400" />}
            title="No notes yet"
            description="Add notes to keep track of important client information"
          />
        )}
      </Card>
    </div>
  );
};

// Icons
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default NotesSection;
