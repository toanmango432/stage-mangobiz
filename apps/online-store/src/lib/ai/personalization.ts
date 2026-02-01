import { UserProfile, PersonalizationSession, InteractionEvent } from "@/types/personalization";

const STORAGE_KEY = 'mango_user_profile';
const SESSION_KEY = 'mango_session';

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return getDefaultProfile();
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const newProfile: UserProfile = {
    userId: generateUserId(),
    visitCount: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    favoriteCategories: [],
    viewedItems: [],
    cartHistory: [],
    bookingHistory: [],
    avgSpend: 0,
    preferredTimeSlots: [],
    preferences: {},
  };

  saveUserProfile(newProfile);
  return newProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const profile = getUserProfile();
  const updated = { ...profile, ...updates, lastVisit: new Date().toISOString() };
  saveUserProfile(updated);
  return updated;
}

export function trackInteraction(event: InteractionEvent): void {
  const session = getSession();
  session.interactions.push(event);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Update user profile based on interaction
  const profile = getUserProfile();
  if (event.type === 'view' && event.itemId) {
    if (!profile.viewedItems.includes(event.itemId)) {
      profile.viewedItems.push(event.itemId);
      if (profile.viewedItems.length > 50) {
        profile.viewedItems.shift();
      }
    }
  }
  saveUserProfile(profile);
}

export function getSession(): PersonalizationSession {
  if (typeof window === 'undefined') {
    return {
      sessionId: 'ssr-session',
      startTime: new Date().toISOString(),
      currentPage: '/',
      interactions: [],
    };
  }
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    const session = JSON.parse(stored);
    // Check if session is from today
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    if (sessionDate.toDateString() === today.toDateString()) {
      return session;
    }
  }

  const newSession: PersonalizationSession = {
    sessionId: generateSessionId(),
    startTime: new Date().toISOString(),
    currentPage: window.location.pathname,
    interactions: [],
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession;
}

export function isReturningUser(): boolean {
  const profile = getUserProfile();
  return profile.visitCount > 1;
}

export function getDaysSinceLastVisit(): number {
  const profile = getUserProfile();
  const lastVisit = new Date(profile.lastVisit);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getPersonalizedGreeting(): string {
  const profile = getUserProfile();
  const hour = new Date().getHours();
  
  let timeGreeting = 'Hello';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  if (isReturningUser()) {
    return `${timeGreeting}! Welcome back to Mango`;
  }

  return `${timeGreeting}! Welcome to Mango`;
}

export function incrementVisitCount(): void {
  const profile = getUserProfile();
  updateUserProfile({ visitCount: profile.visitCount + 1 });
}

function getDefaultProfile(): UserProfile {
  return {
    userId: 'ssr-user',
    visitCount: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    favoriteCategories: [],
    viewedItems: [],
    cartHistory: [],
    bookingHistory: [],
    avgSpend: 0,
    preferredTimeSlots: [],
    preferences: {},
  };
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now();
}
