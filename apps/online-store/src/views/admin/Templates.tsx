'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Save, 
  Plus,
  GripVertical,
  Settings,
  Trash2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Upload,
  Download,
  Rocket,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchAllTemplates,
  fetchTemplateSections,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  duplicateTemplate,
  updateSection,
  reorderSections,
  addSection,
  removeSection,
  importTemplateFromJSON,
} from "@/lib/api/templates";
import { getCurrentTemplateId } from "@/lib/template";
import type { StorefrontTemplate, TemplateSection } from "@/lib/storage/templateStorage";
import bookingFirstTemplate from "@/lib/seeds/templates/booking-first.json";
import retailFirstTemplate from "@/lib/seeds/templates/retail-first.json";
import membershipForwardTemplate from "@/lib/seeds/templates/membership-forward.json";
import salonShowcaseTemplate from "@/lib/seeds/templates/salon-showcase.json";

// Sortable section item component
function SortableSection({ 
  section, 
  onToggleVisibility, 
  onConfigure, 
  onRemove 
}: { 
  section: TemplateSection;
  onToggleVisibility: (id: string) => void;
  onConfigure: (section: TemplateSection) => void;
  onRemove: (id: string) => void;
}) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{section.kind}</p>
          {!section.isVisible && (
            <Badge variant="outline" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" />
              Hidden
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          Order: {section.order}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleVisibility(section.id)}
          title={section.isVisible ? "Hide section" : "Show section"}
        >
          {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onConfigure(section)}
          title="Configure section"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(section.id)}
          title="Remove section"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

const Templates = () => {
  const [templates, setTemplates] = useState<StorefrontTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StorefrontTemplate | null>(null);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null);

  // Create template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateFlowStyle, setNewTemplateFlowStyle] = useState<"BookingFirst" | "RetailFirst" | "MembershipForward">("BookingFirst");
  const [importTemplateId, setImportTemplateId] = useState<string>("");

  // Section config
  const [sectionProps, setSectionProps] = useState<Record<string, any>>({});

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setIsLoading(true);
    try {
      const allTemplates = await fetchAllTemplates();
      setTemplates(allTemplates);
      setActiveTemplateId(getCurrentTemplateId());

      // Load first template by default
      if (allTemplates.length > 0) {
        await loadTemplate(allTemplates[0].id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTemplate(templateId: string) {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      setSelectedTemplate(template);
      const templateSections = await fetchTemplateSections(templateId);
      setSections(templateSections);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: "Error",
        description: "Failed to load template sections",
        variant: "destructive",
      });
    }
  }

  // Create new template
  async function handleCreateTemplate() {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Import from predefined template if selected
      if (importTemplateId && importTemplateId !== 'blank') {
        const templateData = {
          'booking-first': bookingFirstTemplate,
          'retail-first': retailFirstTemplate,
          'membership-forward': membershipForwardTemplate,
          'salon-showcase': salonShowcaseTemplate,
        }[importTemplateId];

        if (templateData) {
          const { template } = await importTemplateFromJSON({
            ...templateData,
            name: newTemplateName,
            description: newTemplateDescription,
          });

          setTemplates([...templates, template]);
          await loadTemplate(template.id);
          toast({
            title: "Success",
            description: "Template created successfully",
          });
        }
      } else {
        // Create blank template
        const newTemplate = await createTemplate({
          id: `template-${Date.now()}`,
          name: newTemplateName,
          description: newTemplateDescription,
          flowStyle: newTemplateFlowStyle,
          isActive: false,
        });

        setTemplates([...templates, newTemplate]);
        await loadTemplate(newTemplate.id);
        toast({
          title: "Success",
          description: "Blank template created",
        });
      }

      setCreateDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setImportTemplateId("");
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  }

  // Publish template
  async function handlePublishTemplate(templateId: string) {
    try {
      const result = await publishTemplate(templateId);
      if (result.success) {
        setActiveTemplateId(templateId);
        setTemplates(templates.map(t => ({
          ...t,
          isActive: t.id === templateId,
        })));
        toast({
          title: "Success",
          description: "Template published successfully",
        });
      }
    } catch (error) {
      console.error('Failed to publish template:', error);
      toast({
        title: "Error",
        description: "Failed to publish template",
        variant: "destructive",
      });
    }
  }

  // Duplicate template
  async function handleDuplicateTemplate(templateId: string) {
    try {
      const duplicated = await duplicateTemplate(templateId);
      if (duplicated) {
        setTemplates([...templates, duplicated]);
        toast({
          title: "Success",
          description: "Template duplicated successfully",
        });
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  }

  // Delete template
  async function handleDeleteTemplate(templateId: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const result = await deleteTemplate(templateId);
      if (result.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setSections([]);
        }
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete template",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  }

  // Toggle section visibility
  async function handleToggleVisibility(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      await updateSection(sectionId, { isVisible: !section.isVisible });
      setSections(sections.map(s => 
        s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
      ));
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  }

  // Configure section
  function handleConfigureSection(section: TemplateSection) {
    setSelectedSection(section);
    setSectionProps(section.props || {});
    setConfigDialogOpen(true);
  }

  // Save section config
  async function handleSaveSectionConfig() {
    if (!selectedSection) return;

    try {
      await updateSection(selectedSection.id, { props: sectionProps });
      setSections(sections.map(s =>
        s.id === selectedSection.id ? { ...s, props: sectionProps } : s
      ));
      setConfigDialogOpen(false);
      toast({
        title: "Success",
        description: "Section configuration saved",
      });
    } catch (error) {
      console.error('Failed to save section config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  }

  // Remove section
  async function handleRemoveSection(sectionId: string) {
    if (!confirm("Remove this section?")) return;

    try {
      await removeSection(sectionId);
      setSections(sections.filter(s => s.id !== sectionId));
      toast({
        title: "Success",
        description: "Section removed",
      });
    } catch (error) {
      console.error('Failed to remove section:', error);
      toast({
        title: "Error",
        description: "Failed to remove section",
        variant: "destructive",
      });
    }
  }

  // Drag end handler
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedTemplate) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    try {
      await reorderSections(selectedTemplate.id, newSections.map(s => s.id));
    } catch (error) {
      console.error('Failed to reorder sections:', error);
      // Revert on error
      setSections(sections);
    }
  }

  // Add new section
  async function handleAddSection(sectionKind: string) {
    if (!selectedTemplate) return;

    try {
      const newSection = await addSection(selectedTemplate.id, {
        kind: sectionKind as any,
        props: {},
      });
      setSections([...sections, newSection]);
      setAddSectionDialogOpen(false);
      toast({
        title: "Success",
        description: "Section added successfully",
      });
    } catch (error) {
      console.error('Failed to add section:', error);
      toast({
        title: "Error",
        description: "Failed to add section",
        variant: "destructive",
      });
    }
  }

  const availableSectionTypes = [
    "Hero",
    "ServiceGrid",
    "ProductGrid",
    "MembershipRail",
    "PromoBanner",
    "CTA",
    "AnnouncementBar",
    "Testimonials",
    "Stats",
    "FAQ",
    "GiftCardShowcase",
    "AboutSalon",
    "TeamGallery",
    "ReviewsShowcase",
    "WorkGallery",
    "LocationHours",
    "SocialFeed",
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage your storefront templates and sections
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Templates</CardTitle>
            <CardDescription>Select a template to edit</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 p-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-accent'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => loadTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{template.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {template.description}
                          </p>
                        </div>
                        {template.isActive && (
                          <Badge variant="default" className="ml-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishTemplate(template.id);
                          }}
                          disabled={template.isActive}
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(template.id);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          disabled={template.isActive}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedTemplate ? selectedTemplate.name : 'No Template Selected'}
                </CardTitle>
                <CardDescription>
                  {selectedTemplate ? 'Drag sections to reorder' : 'Select a template to edit'}
                </CardDescription>
              </div>
              {selectedTemplate && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAddSectionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <ScrollArea className="h-[600px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sections.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No sections yet</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setAddSectionDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Section
                          </Button>
                        </div>
                      ) : (
                        sections.map((section) => (
                          <SortableSection
                            key={section.id}
                            section={section}
                            onToggleVisibility={handleToggleVisibility}
                            onConfigure={handleConfigureSection}
                            onRemove={handleRemoveSection}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a template from the list to start editing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a blank template or import from a preset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="My Custom Template"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Describe your template..."
              />
            </div>
            <div>
              <Label htmlFor="flow-style">Flow Style</Label>
              <Select value={newTemplateFlowStyle} onValueChange={(v: any) => setNewTemplateFlowStyle(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BookingFirst">Booking First</SelectItem>
                  <SelectItem value="RetailFirst">Retail First</SelectItem>
                  <SelectItem value="MembershipForward">Membership Forward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="import-preset">Import from Preset (Optional)</Label>
              <Select value={importTemplateId} onValueChange={setImportTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Template</SelectItem>
                  <SelectItem value="booking-first">Booking First</SelectItem>
                  <SelectItem value="retail-first">Retail First</SelectItem>
                  <SelectItem value="membership-forward">Membership Forward</SelectItem>
                  <SelectItem value="salon-showcase">Salon Showcase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Section Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Section: {selectedSection?.kind}</DialogTitle>
            <DialogDescription>
              Edit section properties and settings
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 p-1">
              {Object.keys(sectionProps).map((key) => (
                <div key={key}>
                  <Label htmlFor={`prop-${key}`}>{key}</Label>
                  <Input
                    id={`prop-${key}`}
                    value={sectionProps[key] || ''}
                    onChange={(e) => setSectionProps({ ...sectionProps, [key]: e.target.value })}
                  />
                </div>
              ))}
              {Object.keys(sectionProps).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No configurable properties for this section type.
                </p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSectionConfig}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addSectionDialogOpen} onOpenChange={setAddSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>
              Choose a section type to add to your template
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="grid grid-cols-2 gap-2 p-1">
              {availableSectionTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-4"
                  onClick={() => handleAddSection(type)}
                >
                  <div className="text-left">
                    <p className="font-medium">{type}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
