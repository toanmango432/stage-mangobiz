/**
 * Section Renderer
 * Maps template sections to existing components with dynamic props
 */

import { Section } from '@/types/template';
import { Footer } from '@/components/Footer';
import { PersonalizedHero } from '@/components/home/PersonalizedHero';
import { AIRecommendations } from '@/components/home/AIRecommendations';
import { TrendingNow } from '@/components/home/TrendingNow';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AboutSalon } from './AboutSalon';
import { TeamGallery } from './TeamGallery';
import { ReviewsShowcase } from './ReviewsShowcase';
import { WorkGallery } from './WorkGallery';
import { LocationHours } from './LocationHours';
import { SocialFeed } from './SocialFeed';
import { MembershipRail } from './MembershipRail';
import { FAQSection } from './FAQSection';
import { StatsSection } from './StatsSection';

interface SectionRendererProps {
  sections: Section[];
}

interface SectionWithProps extends Section {
  props?: Record<string, any>;
}

/**
 * Render a single section based on its kind with dynamic props
 */
function renderSection(section: SectionWithProps) {
  const { kind, props = {} } = section;

  switch (kind) {
    case 'Hero':
      return <PersonalizedHero key={section.id} />;

    case 'ServiceGrid':
      return (
        <section key={section.id} className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {(props.title as string) || 'Our Services'}
            </h2>
            <AIRecommendations type="services" limit={(props.limit as number) || 6} />
          </div>
        </section>
      );

    case 'ProductGrid':
      return (
        <section key={section.id} className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {(props.title as string) || 'Featured Products'}
            </h2>
            <AIRecommendations type="products" limit={(props.limit as number) || 8} />
          </div>
        </section>
      );

    case 'MembershipRail':
      return (
        <MembershipRail
          key={section.id}
          title={(props.title as string)}
          subtitle={(props.subtitle as string)}
          showViewAll={(props.showViewAll as boolean)}
        />
      );

    case 'PromoBanner':
      return (
        <section key={section.id} className="py-6 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center">
            <p className="text-lg font-medium">
              {(props.text as string) || 'Special offer - Limited time only!'}
            </p>
          </div>
        </section>
      );

    case 'CTA':
      return (
        <section key={section.id} className="py-16 px-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">
              {(props.title as string) || 'Ready to Get Started?'}
            </h2>
            {props.text && (
              <p className="text-lg text-muted-foreground mb-6">{props.text as string}</p>
            )}
            <Link href={(props.ctaLink as string) || '/book'}>
              <Button size="lg" className="bg-primary hover:bg-primary-dark">
                {(props.ctaText as string) || 'Book Now'}
              </Button>
            </Link>
          </div>
        </section>
      );

    case 'Footer':
      return <Footer key={section.id} />;

    case 'AnnouncementBar':
      return (
        <div key={section.id} className="bg-accent text-accent-foreground py-2 px-4 text-center text-sm">
          {(props.text as string) || 'Announcement'}
        </div>
      );

    case 'Testimonials':
      return <ReviewsShowcase key={section.id} title={(props.title as string)} />;

    case 'Stats':
      return (
        <StatsSection
          key={section.id}
          title={(props.title as string)}
          stats={props.stats as any}
        />
      );

    case 'FAQ':
      return (
        <FAQSection
          key={section.id}
          title={(props.title as string)}
          subtitle={(props.subtitle as string)}
          showViewAll={(props.showViewAll as boolean)}
          limit={(props.limit as number)}
        />
      );

    case 'GiftCardShowcase':
      return (
        <section key={section.id} className="py-12 px-4 bg-gradient-to-r from-accent/20 to-primary/10">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              {(props.title as string) || 'Give the Gift of Beauty'}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {(props.text as string) || 'Perfect for any occasion'}
            </p>
            <Link href="/gift-cards">
              <Button size="lg" className="bg-primary hover:bg-primary-dark">
                {(props.ctaText as string) || 'Shop Gift Cards'}
              </Button>
            </Link>
          </div>
        </section>
      );

      case 'AboutSalon':
        return (
          <AboutSalon
            key={section.id}
            title={props.title as string}
            story={props.story as string}
            mission={props.mission as string}
            image={props.image as string}
            yearEstablished={props.yearEstablished as string}
          />
        );

    case 'TeamGallery':
      return <TeamGallery key={section.id} title={(props.title as string)} />;

    case 'ReviewsShowcase':
      return <ReviewsShowcase key={section.id} title={(props.title as string)} />;

    case 'WorkGallery':
      return <WorkGallery key={section.id} title={(props.title as string)} />;

    case 'LocationHours':
      return (
        <LocationHours
          key={section.id}
          title={(props.title as string)}
        />
      );

    case 'SocialFeed':
      return (
        <SocialFeed
          key={section.id}
          title={(props.title as string)}
          subtitle={(props.subtitle as string)}
          limit={(props.limit as number)}
        />
      );

    default:
      console.warn('Unknown section kind:', kind);
      return null;
  }
}

/**
 * Main section renderer component
 * Renders all sections in order
 */
export function SectionRenderer({ sections }: SectionRendererProps) {
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedSections.map((section) => renderSection(section))}
    </>
  );
}
