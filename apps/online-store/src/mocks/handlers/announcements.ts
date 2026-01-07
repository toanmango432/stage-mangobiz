import { http, HttpResponse } from 'msw';
import { AnnouncementsResponseSchema } from '@/types/api/schemas';

// In-memory data storage
let announcementsData: any[] = [];

// Load seed data
async function loadAnnouncementsData() {
  try {
    // Check if we're in a test environment
    const isTestEnv = typeof window === 'undefined' || process.env.NODE_ENV === 'test';
    
    if (isTestEnv) {
      // Use mock data for tests with valid UUIDs
      announcementsData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          publicId: '550e8400-e29b-41d4-a716-446655440004',
          title: 'Test Announcement',
          content: 'A test announcement',
          type: 'normal',
          priority: 5,
          isActive: true,
          startsAt: '2025-01-01T00:00:00Z',
          endsAt: '2025-12-31T23:59:59Z',
          displaySettings: {
            showInHero: false,
            showInBanner: true,
            dismissible: true,
          },
          targetAudience: 'all',
        }
      ];
    } else {
      // Load from seed files in browser
      const announcements = await fetch('/seed/announcements.json').then(r => r.json());
      announcementsData = announcements;
    }
  } catch (error) {
    console.error('Failed to load announcements data:', error);
  }
}

// Load data on module initialization
loadAnnouncementsData();

// Helper function to add latency and simulate errors
async function simulateLatency() {
  const latency = 100 + Math.random() * 200; // 100-300ms
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate random 500 errors if MOCK_TURBULENCE is enabled
  if (__MOCK_TURBULENCE__ && Math.random() < 0.01) {
    throw new Error('Simulated server error');
  }
}

// Check if announcement is active
function isAnnouncementActive(announcement: any): boolean {
  const now = new Date();
  const startsAt = new Date(announcement.startsAt);
  const endsAt = announcement.endsAt ? new Date(announcement.endsAt) : null;
  
  return announcement.isActive && 
         startsAt <= now && 
         (!endsAt || endsAt >= now);
}

// Get active announcements sorted by priority
function getActiveAnnouncements() {
  return announcementsData
    .filter(isAnnouncementActive)
    .sort((a, b) => b.priority - a.priority);
}

// Generate unique ID
function generateId(): string {
  return `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const announcementHandlers = [
  // GET /api/v1/store/announcements
  http.get('/api/v1/store/announcements', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const active = url.searchParams.get('active') === 'true';
    const type = url.searchParams.get('type') || undefined;
    const targetAudience = url.searchParams.get('targetAudience') || undefined;
    
    let filteredAnnouncements = announcementsData;
    
    if (active) {
      filteredAnnouncements = getActiveAnnouncements();
    }
    
    if (type) {
      filteredAnnouncements = filteredAnnouncements.filter(a => a.type === type);
    }
    
    if (targetAudience) {
      filteredAnnouncements = filteredAnnouncements.filter(a => 
        a.targetAudience === targetAudience || a.targetAudience === 'all'
      );
    }

    const result = { data: filteredAnnouncements };
    const validatedResult = AnnouncementsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // POST /api/v1/store/announcements
  http.post('/api/v1/store/announcements', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    
    if (!body.title || !body.content) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'title and content are required' } },
        { status: 400 }
      );
    }

    const announcement = {
      id: generateId(),
      publicId: generateId(),
      title: body.title,
      content: body.content,
      type: body.type || 'normal',
      priority: body.priority || 5,
      isActive: body.isActive !== false,
      startsAt: body.startsAt || new Date().toISOString(),
      endsAt: body.endsAt || null,
      displaySettings: {
        showInHero: body.displaySettings?.showInHero || false,
        showInBanner: body.displaySettings?.showInBanner || true,
        showInModal: body.displaySettings?.showInModal || false,
        dismissible: body.displaySettings?.dismissible !== false,
      },
      targetAudience: body.targetAudience || 'all',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    announcementsData.push(announcement);

    return HttpResponse.json(announcement);
  }),

  // PUT /api/v1/store/announcements/:id
  http.put('/api/v1/store/announcements/:id', async ({ params, request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    const announcementIndex = announcementsData.findIndex(a => a.id === params.id);
    
    if (announcementIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Announcement not found' } },
        { status: 404 }
      );
    }

    const announcement = announcementsData[announcementIndex];
    const updatedAnnouncement = {
      ...announcement,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    announcementsData[announcementIndex] = updatedAnnouncement;

    return HttpResponse.json(updatedAnnouncement);
  }),

  // DELETE /api/v1/store/announcements/:id
  http.delete('/api/v1/store/announcements/:id', async ({ params }) => {
    await simulateLatency();
    
    const announcementIndex = announcementsData.findIndex(a => a.id === params.id);
    
    if (announcementIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Announcement not found' } },
        { status: 404 }
      );
    }

    announcementsData.splice(announcementIndex, 1);

    return HttpResponse.json({ success: true });
  }),

  // GET /api/v1/store/announcements/:id/analytics
  http.get('/api/v1/store/announcements/:id/analytics', async ({ params }) => {
    await simulateLatency();
    
    const announcement = announcementsData.find(a => a.id === params.id);
    
    if (!announcement) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Announcement not found' } },
        { status: 404 }
      );
    }

    // Mock analytics data
    const analytics = {
      id: announcement.id,
      views: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 100) + 10,
      dismissals: Math.floor(Math.random() * 50) + 5,
      engagementRate: Math.random() * 0.3 + 0.1,
      topSources: [
        { source: 'homepage', views: Math.floor(Math.random() * 500) + 50 },
        { source: 'banner', views: Math.floor(Math.random() * 300) + 30 },
        { source: 'modal', views: Math.floor(Math.random() * 200) + 20 },
      ],
      dailyViews: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 10,
      })),
    };
    
    return HttpResponse.json(analytics);
  }),
];
