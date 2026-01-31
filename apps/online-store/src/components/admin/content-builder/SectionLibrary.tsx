'use client';

import { useState } from 'react';
import { Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SECTION_CONFIGS, SECTION_CATEGORIES } from '@/lib/content-builder/section-configs';
import type { SectionConfig } from '@/types/content-builder';

interface SectionLibraryProps {
  onAddSection: (sectionType: string) => void;
}

export const SectionLibrary = ({ onAddSection }: SectionLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSections = Object.values(SECTION_CONFIGS).filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sectionsByCategory = SECTION_CATEGORIES;

  return (
    <div className="space-y-4">
      {/* Search and View Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sections by Category */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="commerce">Commerce</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {Object.entries(sectionsByCategory).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-2">
            <div className={`grid gap-3 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredSections
                .filter(section => category.sections.includes(section.id))
                .map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    viewMode={viewMode}
                    onAdd={() => onAddSection(section.id)}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface SectionCardProps {
  section: SectionConfig;
  viewMode: 'grid' | 'list';
  onAdd: () => void;
}

const SectionCard = ({ section, viewMode, onAdd }: SectionCardProps) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${
      viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
    }`}>
      <CardContent className={`p-0 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
        <div className={`${viewMode === 'list' ? 'flex items-center gap-4 flex-1' : 'space-y-3'}`}>
          {/* Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="h-5 w-5 text-primary">
                {/* Icon placeholder - in real app, use actual icon component */}
                <div className="w-full h-full bg-primary/20 rounded" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{section.name}</h3>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {section.category}
            </Badge>
          </div>

          {/* Add Button */}
          <Button
            size="sm"
            onClick={onAdd}
            className={viewMode === 'list' ? 'ml-auto' : 'w-full'}
          >
            Add Section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
