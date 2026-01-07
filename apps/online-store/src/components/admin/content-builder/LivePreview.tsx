import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageSection } from '@/types/content-builder';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

interface LivePreviewProps {
  sections: PageSection[];
  selectedSectionId?: string;
  onSectionSelect: (section: PageSection | null) => void;
  className?: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  sections,
  selectedSectionId,
  onSectionSelect,
  className,
}) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return 'w-80';
      case 'tablet': return 'w-96';
      case 'desktop': return 'w-full';
      default: return 'w-full';
    }
  };

  const getViewportHeight = () => {
    switch (viewport) {
      case 'mobile': return 'h-[600px]';
      case 'tablet': return 'h-[700px]';
      case 'desktop': return 'h-[800px]';
      default: return 'h-[800px]';
    }
  };

  const renderSection = (section: PageSection) => {
    const isSelected = selectedSectionId === section.id;
    
    if (!section.enabled) {
      return (
        <div
          key={section.id}
          className={cn(
            'p-8 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50',
            isSelected && 'ring-2 ring-primary ring-offset-2'
          )}
          onClick={() => onSectionSelect(section)}
        >
          <div className="text-gray-400">
            <Eye className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Section disabled</p>
            <p className="text-xs">{section.type}</p>
          </div>
        </div>
      );
    }

    switch (section.type) {
      case 'hero':
        return (
          <div
            key={section.id}
            className={cn(
              'relative overflow-hidden rounded-lg',
              section.settings.height === 'small' ? 'h-64' : 
              section.settings.height === 'medium' ? 'h-96' : 'h-[500px]',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${section.settings.image || '/src/assets/hero-salon.jpg'})`
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-8">
              <h1 className="text-4xl font-bold mb-4">
                {section.settings.headline || 'Welcome to our salon'}
              </h1>
              <p className="text-xl mb-8 max-w-2xl">
                {section.settings.subheadline || 'Experience luxury beauty services'}
              </p>
              <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                {section.settings.ctaText || 'Book Now'}
              </button>
            </div>
          </div>
        );

      case 'services-grid':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {section.settings.title || 'Our Services'}
              </h2>
              <p className="text-gray-600">
                {section.settings.description || 'Professional beauty and wellness services'}
              </p>
            </div>
            <div className={`grid gap-6 grid-cols-${section.settings.columns || 3}`}>
              {Array.from({ length: section.settings.limit || 6 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">💅</span>
                  </div>
                  <h3 className="font-semibold mb-2">Service {i + 1}</h3>
                  <p className="text-sm text-gray-600 mb-2">Professional service</p>
                  {section.settings.showPrices && (
                    <p className="text-primary font-semibold">$50+</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">
                {section.settings.title || 'Our Work'}
              </h2>
            </div>
            <div className={`grid gap-4 grid-cols-${section.settings.columns || 4}`}>
              {Array.from({ length: section.settings.limit || 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Image {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8 text-center text-white rounded-lg',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            style={{ backgroundColor: section.settings.backgroundColor || '#8b5cf6' }}
            onClick={() => onSectionSelect(section)}
          >
            <h2 className="text-3xl font-bold mb-4">
              {section.settings.headline || 'Ready to transform your look?'}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {section.settings.description || 'Book your appointment today and experience the difference'}
            </p>
            <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {section.settings.buttonText || 'Book Now'}
            </button>
          </div>
        );

      case 'team':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {section.settings.title || 'Meet Our Team'}
              </h2>
              <p className="text-gray-600">
                {section.settings.description || 'Our talented professionals'}
              </p>
            </div>
            <div className={section.settings.layout === 'list' ? 'space-y-4' : 'grid gap-6 grid-cols-3'}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={section.settings.layout === 'list' ? 'flex items-center gap-4 border rounded-lg p-4' : 'text-center'}>
                  <div className={section.settings.layout === 'list' ? 'w-16 h-16 bg-gray-200 rounded-full' : 'w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4'} />
                  <div>
                    <h3 className="font-semibold">Team Member {i + 1}</h3>
                    <p className="text-sm text-gray-600">Specialist</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">
                {section.settings.title || 'What Our Clients Say'}
              </h2>
            </div>
            <div className={section.settings.layout === 'carousel' ? 'flex gap-4 overflow-x-auto' : 'grid gap-6 grid-cols-2'}>
              {Array.from({ length: Math.min(section.settings.limit || 6, 4) }).map((_, i) => (
                <div key={i} className="border rounded-lg p-6 min-w-[300px]">
                  {section.settings.showRating && (
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 mb-4 italic">
                    "Amazing service! Highly recommend to everyone looking for quality."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <p className="font-semibold">Client {i + 1}</p>
                      <p className="text-sm text-gray-500">Verified Customer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'products-grid':
        return (
          <div
            key={section.id}
            className={cn(
              'p-8',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {section.settings.title || 'Shop Products'}
              </h2>
              <p className="text-gray-600">
                {section.settings.description || 'Premium beauty products'}
              </p>
            </div>
            <div className={`grid gap-6 grid-cols-${section.settings.columns || 4}`}>
              {Array.from({ length: section.settings.limit || 8 }).map((_, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Product {i + 1}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Product Name</h3>
                    <p className="text-sm text-gray-600 mb-2">Premium quality</p>
                    <p className="text-primary font-semibold">$29.99</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div
            key={section.id}
            className={cn(
              'p-8 border rounded-lg bg-gray-50 text-center',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSectionSelect(section)}
          >
            <p className="text-gray-500">Preview not available for {section.type}</p>
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Live Preview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Button
                  variant={viewport === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('tablet')}
                  className="h-8 w-8 p-0"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div
              className={cn(
                'border rounded-lg bg-white shadow-lg overflow-auto',
                getViewportWidth(),
                getViewportHeight(),
                isFullscreen && 'fixed inset-4 z-50 w-auto h-auto'
              )}
            >
              <div className="min-h-full">
                {sections.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No sections to preview</p>
                      <p className="text-sm">Add sections to see them here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {sections
                      .sort((a, b) => a.order - b.order)
                      .map(renderSection)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};