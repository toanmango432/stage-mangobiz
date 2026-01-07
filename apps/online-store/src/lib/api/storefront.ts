// Mock Storefront API for page content management

export interface StorefrontPage {
  id: string;
  path: string;
  sections: StorefrontSection[];
  metadata: {
    title: string;
    description: string;
    aiEnabled: boolean;
  };
}

export interface StorefrontSection {
  id: string;
  type: 'hero' | 'services' | 'products' | 'recommendations' | 'testimonials';
  order: number;
  visible: boolean;
  config: Record<string, any>;
}

const mockPages: Record<string, StorefrontPage> = {
  '/': {
    id: 'homepage',
    path: '/',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        order: 1,
        visible: true,
        config: {
          aiPersonalization: true,
        },
      },
      {
        id: 'ai_recommendations',
        type: 'recommendations',
        order: 2,
        visible: true,
        config: {
          limit: 6,
        },
      },
      {
        id: 'services',
        type: 'services',
        order: 3,
        visible: true,
        config: {},
      },
    ],
    metadata: {
      title: 'Mango Nail & Beauty Salon',
      description: 'Premium nail care and beauty services',
      aiEnabled: true,
    },
  },
};

export async function fetchPageContent(path: string): Promise<StorefrontPage | null> {
  await simulateDelay(200);
  return mockPages[path] || null;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
