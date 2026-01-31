'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types/personalization';
import { getUserProfile, incrementVisitCount, getSession } from '@/lib/ai/personalization';

interface PersonalizationContextType {
  profile: UserProfile;
  isReturningUser: boolean;
  refreshProfile: () => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

// Default profile for SSR - must match getDefaultProfile() in personalization.ts
const defaultProfile: UserProfile = {
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

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  // Use static default for SSR to avoid hydration mismatch
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Load profile from localStorage only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize session
    getSession();

    // Load actual profile from localStorage
    const userProfile = getUserProfile();
    setProfile(userProfile);
    setIsReturningUser(userProfile.visitCount > 1);

    // Increment visit count on mount
    incrementVisitCount();

    // Refresh profile after incrementing visit count
    setProfile(getUserProfile());
  }, []);

  const refreshProfile = () => {
    setProfile(getUserProfile());
  };

  return (
    <PersonalizationContext.Provider value={{ profile, isReturningUser, refreshProfile }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalizationContext() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalizationContext must be used within PersonalizationProvider');
  }
  return context;
}
