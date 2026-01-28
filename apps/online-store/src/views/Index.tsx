'use client';


import { useTemplate } from '@/hooks/useTemplate';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PromotionBannerContainer } from '@/components/promotions/PromotionBannerContainer';
import { PromotionsStripContainer } from '@/components/promotions/PromotionsStripContainer';

const Index = () => {
  const { template, sections, isLoading, error } = useTemplate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    console.error('Template error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to Mango Salon</h1>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!template || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to Mango Salon</h1>
          <p className="text-muted-foreground">No active template found. Please configure your storefront.</p>
        </div>
      </div>
    );
  }

  // Sort sections by order and filter visible ones
  const visibleSections = sections
    .filter(section => section.isVisible)
    .sort((a, b) => a.order - b.order);

  // Split sections: hero first, then promotions, then rest
  const heroSection = visibleSections.length > 0 ? [visibleSections[0]] : [];
  const restSections = visibleSections.slice(1);

  return (
    <>
      <div className="min-h-screen pb-20 md:pb-8">
        {/* Hero Section */}
        {heroSection.length > 0 && (
          <SectionRenderer sections={heroSection} />
        )}
        
        {/* Promotions Banner - ATF after hero */}
        <PromotionBannerContainer />

        {/* Rest of Sections */}
        {restSections.length > 0 && (
          <SectionRenderer sections={restSections} />
        )}

        {/* Promotions Strip - Mid-page */}
        <PromotionsStripContainer />
      </div>
    </>
  );
};

export default Index;
