'use client';

import { useState, useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropCanvas } from '@/components/admin/content-builder/DragDropCanvas';
import { LivePreview } from '@/components/admin/content-builder/LivePreview';
import { HeroEditor } from '@/components/admin/content-builder/editors/HeroEditor';
import { ServicesEditor } from '@/components/admin/content-builder/editors/ServicesEditor';
import { GalleryEditor } from '@/components/admin/content-builder/editors/GalleryEditor';
import { CTAEditor } from '@/components/admin/content-builder/editors/CTAEditor';
import { TeamEditor } from '@/components/admin/content-builder/editors/TeamEditor';
import { TestimonialsEditor } from '@/components/admin/content-builder/editors/TestimonialsEditor';
import { ProductsEditor } from '@/components/admin/content-builder/editors/ProductsEditor';
import { SECTION_CONFIGS } from '@/lib/content-builder/section-configs';
import type { PageSection, PageTemplate } from '@/types/content-builder';

export default function ContentBuilder() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'editor' | 'preview'>('library');
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved template on mount
  useEffect(() => {
    const saved = localStorage.getItem('content-builder-template');
    if (saved) {
      try {
        const template = JSON.parse(saved);
        setSections(template.sections || []);
      } catch (error) {
        console.error('Failed to load saved template:', error);
      }
    }
  }, []);

  // Save template when sections change
  useEffect(() => {
    if (sections.length > 0) {
      const template: PageTemplate = {
        id: 'current',
        name: 'Current Template',
        description: 'Work in progress',
        sections,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('content-builder-template', JSON.stringify(template));
      setHasChanges(true);
    }
  }, [sections]);

  const handleAddSection = (sectionType: string) => {
    const sectionConfig = SECTION_CONFIGS[sectionType];
    if (!sectionConfig) return;

    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      order: sections.length,
      enabled: true,
      settings: { ...sectionConfig.defaults }
    };

    setSections(prev => [...prev, newSection]);
    setSelectedSection(newSection);
    setActiveTab('editor');
  };

  const handleUpdateSection = (updatedSection: PageSection) => {
    setSections(prev => 
      prev.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
    setSelectedSection(updatedSection);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
      setActiveTab('library');
    }
  };


  const handleSaveTemplate = () => {
    const template: PageTemplate = {
      id: `template-${Date.now()}`,
      name: 'Custom Template',
      description: 'Created with Content Builder',
      sections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage (in real app, save to API)
    const savedTemplates = JSON.parse(localStorage.getItem('saved-templates') || '[]');
    savedTemplates.push(template);
    localStorage.setItem('saved-templates', JSON.stringify(savedTemplates));
    
    setHasChanges(false);
    // Show success message
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Builder</h1>
          <p className="text-muted-foreground mt-1">
            Design your storefront with drag-and-drop sections
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveTemplate} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Sections Management */}
        <div className="space-y-4">
          <DragDropCanvas
            sections={sections}
            onSectionsChange={setSections}
            onSectionSelect={setSelectedSection}
            selectedSectionId={selectedSection?.id}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onToggleSection={(id) => {
              setSections(prev => 
                prev.map(section => 
                  section.id === id ? { ...section, enabled: !section.enabled } : section
                )
              );
            }}
          />
        </div>

        {/* Right Panel - Preview & Editor */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="editor" disabled={!selectedSection}>
                Editor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="h-[calc(100vh-300px)]">
              <LivePreview
                sections={sections}
                selectedSectionId={selectedSection?.id}
                onSectionSelect={setSelectedSection}
              />
            </TabsContent>

            <TabsContent value="editor" className="h-[calc(100vh-300px)] overflow-auto">
              {selectedSection ? (
                <div className="space-y-4">
                  {selectedSection.type === 'hero' && (
                    <HeroEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'services-grid' && (
                    <ServicesEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'gallery' && (
                    <GalleryEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'cta' && (
                    <CTAEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'team' && (
                    <TeamEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'testimonials' && (
                    <TestimonialsEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {selectedSection.type === 'products-grid' && (
                    <ProductsEditor
                      section={selectedSection}
                      onUpdate={(settings) => {
                        const updatedSection = { ...selectedSection, settings };
                        handleUpdateSection(updatedSection);
                      }}
                      onClose={() => setSelectedSection(null)}
                    />
                  )}
                  {!['hero', 'services-grid', 'gallery', 'cta', 'team', 'testimonials', 'products-grid'].includes(selectedSection.type) && (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <p>Editor not available for {selectedSection.type}</p>
                        <p className="text-sm">Coming soon...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <p>Select a section to edit</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
