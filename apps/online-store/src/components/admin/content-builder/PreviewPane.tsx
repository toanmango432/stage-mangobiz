'use client';

import { useState } from 'react';
import { Smartphone, Tablet, Monitor, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SECTION_CONFIGS } from '@/lib/content-builder/section-configs';
import type { PageSection } from '@/types/content-builder';

interface PreviewPaneProps {
  sections: PageSection[];
  selectedSection?: PageSection;
  onSelectSection: (section: PageSection) => void;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export const PreviewPane = ({ sections, selectedSection, onSelectSection }: PreviewPaneProps) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [showDisabled, setShowDisabled] = useState(false);

  const viewportSizes = {
    mobile: 'w-80',
    tablet: 'w-96',
    desktop: 'w-full'
  };

  const filteredSections = sections.filter(section => 
    showDisabled || section.enabled
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={showDisabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDisabled(!showDisabled)}
            >
              {showDisabled ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showDisabled ? 'Hide' : 'Show'} Disabled
            </Button>
          </div>
        </div>

        {/* Viewport Controls */}
        <Tabs value={viewport} onValueChange={(value) => setViewport(value as ViewportSize)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="tablet" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              Tablet
            </TabsTrigger>
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[600px] overflow-auto">
          <div className={`mx-auto bg-white shadow-lg ${viewportSizes[viewport]}`}>
            {/* Preview Content */}
            <div className="min-h-screen">
              {filteredSections.length === 0 ? (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <p>No sections added yet</p>
                    <p className="text-sm">Add sections from the library to see them here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredSections.map((section, index) => (
                    <SectionPreview
                      key={section.id}
                      section={section}
                      isSelected={selectedSection?.id === section.id}
                      onClick={() => onSelectSection(section)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SectionPreviewProps {
  section: PageSection;
  isSelected: boolean;
  onClick: () => void;
}

const SectionPreview = ({ section, isSelected, onClick }: SectionPreviewProps) => {
  const sectionConfig = SECTION_CONFIGS[section.type];
  if (!sectionConfig) return null;

  return (
    <div
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-300'
      } ${!section.enabled ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      {/* Section Header */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {sectionConfig.name}
          </Badge>
          {!section.enabled && (
            <Badge variant="destructive" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="p-4">
        <SectionRenderer section={section} />
      </div>
    </div>
  );
};

const SectionRenderer = ({ section }: { section: PageSection }) => {
  const { type, settings } = section;

  switch (type) {
    case 'hero':
      return (
        <div 
          className="relative h-64 bg-cover bg-center rounded-lg flex items-center justify-center text-white"
          style={{ 
            backgroundImage: `url(${settings.image || '/placeholder.svg'})`,
            backgroundColor: settings.backgroundColor || '#8b5cf6'
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{settings.headline || 'Welcome'}</h1>
            <p className="text-lg mb-4">{settings.subheadline || 'Your subtitle here'}</p>
            <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-medium">
              {settings.ctaText || 'Learn More'}
            </button>
          </div>
        </div>
      );

    case 'services-grid':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{settings.title || 'Our Services'}</h2>
            <p className="text-gray-600">{settings.description || 'Professional services'}</p>
          </div>
          <div className={`grid gap-4 ${
            settings.columns === 2 ? 'grid-cols-2' : 
            settings.columns === 3 ? 'grid-cols-3' : 
            'grid-cols-4'
          }`}>
            {Array.from({ length: settings.limit || 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg mx-auto mb-2"></div>
                <h3 className="font-medium">Service {i + 1}</h3>
                {settings.showPrices && (
                  <p className="text-sm text-gray-600">$50+</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'products-grid':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{settings.title || 'Shop Products'}</h2>
            <p className="text-gray-600">{settings.description || 'Premium products'}</p>
          </div>
          <div className={`grid gap-4 ${
            settings.columns === 2 ? 'grid-cols-2' : 
            settings.columns === 3 ? 'grid-cols-3' : 
            'grid-cols-4'
          }`}>
            {Array.from({ length: settings.limit || 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-2"></div>
                <h3 className="font-medium">Product {i + 1}</h3>
                <p className="text-sm text-gray-600">$25.00</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">{settings.title || 'What Our Clients Say'}</h2>
          <div className={`${settings.layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
            {Array.from({ length: settings.limit || 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  {settings.showRating && (
                    <div className="flex text-yellow-400">
                      {'★'.repeat(5)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">"Great service and amazing results!"</p>
                <p className="text-xs text-gray-500 mt-2">- Client {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">{settings.title || 'Our Work'}</h2>
          <div className={`grid gap-2 ${
            settings.columns === 2 ? 'grid-cols-2' : 
            settings.columns === 3 ? 'grid-cols-3' : 
            settings.columns === 4 ? 'grid-cols-4' : 
            'grid-cols-5'
          }`}>
            {Array.from({ length: settings.limit || 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      );

    case 'team':
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{settings.title || 'Meet Our Team'}</h2>
            <p className="text-gray-600">{settings.description || 'Our talented professionals'}</p>
          </div>
          <div className={`${settings.layout === 'list' ? 'space-y-4' : 'grid grid-cols-3 gap-4'}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${settings.layout === 'list' ? 'flex items-center gap-4' : 'text-center'}`}>
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
                <div>
                  <h3 className="font-medium">Team Member {i + 1}</h3>
                  <p className="text-sm text-gray-600">Specialist</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div 
          className="p-8 rounded-lg text-center text-white"
          style={{ backgroundColor: settings.backgroundColor || '#8b5cf6' }}
        >
          <h2 className="text-3xl font-bold mb-2">{settings.headline || 'Ready to get started?'}</h2>
          <p className="text-lg mb-6">{settings.description || 'Take action now'}</p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium">
            {settings.buttonText || 'Get Started'}
          </button>
        </div>
      );

    default:
      return (
        <div className="p-8 bg-gray-100 rounded-lg text-center text-gray-500">
          <p>Section preview not available</p>
        </div>
      );
  }
};
