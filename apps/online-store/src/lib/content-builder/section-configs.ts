// Section Configuration Definitions
import type { SectionConfig } from '@/types/content-builder';

export const SECTION_CONFIGS: Record<string, SectionConfig> = {
  hero: {
    id: 'hero',
    type: 'hero',
    name: 'Hero Section',
    description: 'Large banner with headline and call-to-action',
    icon: 'Layout',
    category: 'content',
    schema: {
      properties: {
        headline: {
          type: 'text',
          label: 'Headline',
          default: 'Welcome to our salon',
          placeholder: 'Enter main headline'
        },
        subheadline: {
          type: 'textarea',
          label: 'Subheadline',
          default: 'Experience luxury beauty services',
          placeholder: 'Enter supporting text'
        },
        image: {
          type: 'image',
          label: 'Background Image',
          default: '/src/assets/hero-salon.jpg'
        },
        ctaText: {
          type: 'text',
          label: 'CTA Button Text',
          default: 'Book Now'
        },
        ctaLink: {
          type: 'text',
          label: 'CTA Link',
          default: '/book'
        },
        height: {
          type: 'select',
          label: 'Height',
          default: 'large',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' }
          ]
        }
      }
    },
    defaults: {
      headline: 'Welcome to our salon',
      subheadline: 'Experience luxury beauty services',
      image: '/src/assets/hero-salon.jpg',
      ctaText: 'Book Now',
      ctaLink: '/book',
      height: 'large'
    }
  },

  'services-grid': {
    id: 'services-grid',
    type: 'services-grid',
    name: 'Services Grid',
    description: 'Display services in a grid layout',
    icon: 'Grid',
    category: 'commerce',
    schema: {
      properties: {
        title: {
          type: 'text',
          label: 'Section Title',
          default: 'Our Services'
        },
        description: {
          type: 'textarea',
          label: 'Description',
          default: 'Professional beauty and wellness services'
        },
        columns: {
          type: 'select',
          label: 'Columns',
          default: 3,
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 }
          ]
        },
        limit: {
          type: 'number',
          label: 'Number of Services',
          default: 6,
          min: 1,
          max: 20
        },
        showPrices: {
          type: 'boolean',
          label: 'Show Prices',
          default: true
        }
      }
    },
    defaults: {
      title: 'Our Services',
      description: 'Professional beauty and wellness services',
      columns: 3,
      limit: 6,
      showPrices: true
    }
  },

  'products-grid': {
    id: 'products-grid',
    type: 'products-grid',
    name: 'Products Grid',
    description: 'Display products in a grid layout',
    icon: 'ShoppingBag',
    category: 'commerce',
    schema: {
      properties: {
        title: {
          type: 'text',
          label: 'Section Title',
          default: 'Shop Products'
        },
        description: {
          type: 'textarea',
          label: 'Description',
          default: 'Premium beauty products'
        },
        columns: {
          type: 'select',
          label: 'Columns',
          default: 4,
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 }
          ]
        },
        limit: {
          type: 'number',
          label: 'Number of Products',
          default: 8,
          min: 1,
          max: 20
        }
      }
    },
    defaults: {
      title: 'Shop Products',
      description: 'Premium beauty products',
      columns: 4,
      limit: 8
    }
  },

  testimonials: {
    id: 'testimonials',
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and testimonials',
    icon: 'MessageSquare',
    category: 'social',
    schema: {
      properties: {
        title: {
          type: 'text',
          label: 'Section Title',
          default: 'What Our Clients Say'
        },
        layout: {
          type: 'select',
          label: 'Layout',
          default: 'carousel',
          options: [
            { label: 'Carousel', value: 'carousel' },
            { label: 'Grid', value: 'grid' }
          ]
        },
        limit: {
          type: 'number',
          label: 'Number of Reviews',
          default: 6,
          min: 1,
          max: 12
        },
        showRating: {
          type: 'boolean',
          label: 'Show Star Rating',
          default: true
        }
      }
    },
    defaults: {
      title: 'What Our Clients Say',
      layout: 'carousel',
      limit: 6,
      showRating: true
    }
  },

  gallery: {
    id: 'gallery',
    type: 'gallery',
    name: 'Gallery',
    description: 'Image gallery of work',
    icon: 'Image',
    category: 'content',
    schema: {
      properties: {
        title: {
          type: 'text',
          label: 'Section Title',
          default: 'Our Work'
        },
        columns: {
          type: 'select',
          label: 'Columns',
          default: 4,
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
            { label: '5 Columns', value: 5 }
          ]
        },
        limit: {
          type: 'number',
          label: 'Number of Images',
          default: 12,
          min: 1,
          max: 24
        }
      }
    },
    defaults: {
      title: 'Our Work',
      columns: 4,
      limit: 12
    }
  },

  team: {
    id: 'team',
    type: 'team',
    name: 'Team Members',
    description: 'Showcase your team',
    icon: 'Users',
    category: 'content',
    schema: {
      properties: {
        title: {
          type: 'text',
          label: 'Section Title',
          default: 'Meet Our Team'
        },
        description: {
          type: 'textarea',
          label: 'Description',
          default: 'Our talented professionals'
        },
        layout: {
          type: 'select',
          label: 'Layout',
          default: 'grid',
          options: [
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' }
          ]
        }
      }
    },
    defaults: {
      title: 'Meet Our Team',
      description: 'Our talented professionals',
      layout: 'grid'
    }
  },

  cta: {
    id: 'cta',
    type: 'cta',
    name: 'Call to Action',
    description: 'Prominent call-to-action section',
    icon: 'Megaphone',
    category: 'content',
    schema: {
      properties: {
        headline: {
          type: 'text',
          label: 'Headline',
          default: 'Ready to transform your look?'
        },
        description: {
          type: 'textarea',
          label: 'Description',
          default: 'Book your appointment today and experience the difference'
        },
        buttonText: {
          type: 'text',
          label: 'Button Text',
          default: 'Book Now'
        },
        buttonLink: {
          type: 'text',
          label: 'Button Link',
          default: '/book'
        },
        backgroundColor: {
          type: 'color',
          label: 'Background Color',
          default: '#8b5cf6'
        }
      }
    },
    defaults: {
      headline: 'Ready to transform your look?',
      description: 'Book your appointment today and experience the difference',
      buttonText: 'Book Now',
      buttonLink: '/book',
      backgroundColor: '#8b5cf6'
    }
  }
};

export const SECTION_CATEGORIES = {
  content: {
    label: 'Content',
    sections: ['hero', 'cta', 'gallery', 'team']
  },
  commerce: {
    label: 'Commerce',
    sections: ['services-grid', 'products-grid']
  },
  social: {
    label: 'Social Proof',
    sections: ['testimonials']
  },
  layout: {
    label: 'Layout',
    sections: []
  }
} as const;

