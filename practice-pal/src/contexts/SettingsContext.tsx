import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserPreferences {
  defaultTempo: number;
  metronomeSound: 'click' | 'beep' | 'wood';
  themePreference: 'light' | 'dark' | 'system';
}

interface SettingsContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const defaultPreferences: UserPreferences = {
  defaultTempo: 120,
  metronomeSound: 'click',
  themePreference: 'system',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('practicepal-preferences');
    return savedPreferences ? JSON.parse(savedPreferences) : defaultPreferences;
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Update localStorage when preferences change
  useEffect(() => {
    localStorage.setItem('practicepal-preferences', JSON.stringify(preferences));
  }, [preferences]);
  
  // Initialize and update dark mode
  useEffect(() => {
    const updateDarkMode = () => {
      if (preferences.themePreference === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      } else {
        setIsDarkMode(preferences.themePreference === 'dark');
      }
    };
    
    updateDarkMode();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferences.themePreference === 'system') {
        updateDarkMode();
      }
    };
    
    // Add event listener for system theme changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [preferences.themePreference]);
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };
  
  const toggleTheme = () => {
    if (preferences.themePreference === 'system') {
      updatePreferences({ themePreference: 'dark' });
    } else if (preferences.themePreference === 'dark') {
      updatePreferences({ themePreference: 'light' });
    } else {
      updatePreferences({ themePreference: 'system' });
    }
  };
  
  const value = {
    preferences,
    updatePreferences,
    isDarkMode,
    toggleTheme,
  };
  
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 