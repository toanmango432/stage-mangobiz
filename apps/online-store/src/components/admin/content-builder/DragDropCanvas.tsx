'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2, 
  Plus,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageSection, SectionType, DragItem } from '@/types/content-builder';
import { SECTION_CONFIGS } from '@/lib/content-builder/section-configs';

interface DragDropCanvasProps {
  sections: PageSection[];
  onSectionsChange: (sections: PageSection[]) => void;
  onSectionSelect: (section: PageSection | null) => void;
  selectedSectionId?: string;
  onAddSection: (type: SectionType) => void;
  onDeleteSection: (id: string) => void;
  onToggleSection: (id: string) => void;
}

interface SortableSectionItemProps {
  section: PageSection;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  section,
  isSelected,
  onSelect,
  onDelete,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = SECTION_CONFIGS[section.type];
  const Icon = config?.icon || 'Layout';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative border rounded-lg bg-white shadow-sm transition-all duration-200',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-primary/10 rounded">
                  <Move className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {config?.name || section.type}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    {config?.description || 'Section'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Badge 
                variant={section.enabled ? "default" : "secondary"}
                className="text-xs"
              >
                {section.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                {section.enabled ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelect}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="text-xs text-gray-500">
            Order: {section.order} • Type: {section.type}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  sections,
  onSectionsChange,
  onSectionSelect,
  selectedSectionId,
  onAddSection,
  onDeleteSection,
  onToggleSection,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(section => section.id === active.id);
      const newIndex = sections.findIndex(section => section.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        // Update order numbers
        const updatedSections = newSections.map((section, index) => ({
          ...section,
          order: index + 1,
        }));
        onSectionsChange(updatedSections);
      }
    }
    
    setActiveId(null);
  }, [sections, onSectionsChange]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over if needed
  }, []);

  const activeSection = activeId ? sections.find(s => s.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Page Sections</h3>
          <p className="text-sm text-gray-500">
            Drag and drop to reorder sections
          </p>
        </div>
        <Button
          onClick={() => onAddSection('hero')}
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Section</span>
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <SortableContext 
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Move className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No sections added yet</p>
                <p className="text-sm">Click "Add Section" to get started</p>
              </div>
            ) : (
              sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    onSelect={() => onSectionSelect(section)}
                    onDelete={() => onDeleteSection(section.id)}
                    onToggle={() => onToggleSection(section.id)}
                  />
                ))
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSection ? (
            <div className="opacity-50">
              <SortableSectionItem
                section={activeSection}
                isSelected={false}
                onSelect={() => {}}
                onDelete={() => {}}
                onToggle={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
