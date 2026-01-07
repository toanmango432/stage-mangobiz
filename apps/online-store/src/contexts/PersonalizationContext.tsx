import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types/personalization';
import { getUserProfile, incrementVisitCount, getSession } from '@/lib/ai/personalization';

interface PersonalizationContextType {
  profile: UserProfile;
  isReturningUser: boolean;
  refreshProfile: () => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Initialize session
    getSession();
    
    // Check if returning user
    const userProfile = getUserProfile();
    setIsReturningUser(userProfile.visitCount > 1);
    
    // Increment visit count on mount
    incrementVisitCount();
    
    // Refresh profile
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
