'use client';

import React from 'react';
import { SunIcon, MoonIcon } from './Icons';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-muted-foreground hover:bg-accent hover:text-card-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      suppressHydrationWarning
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5" aria-hidden={true} />
      ) : (
        <SunIcon className="w-5 h-5" aria-hidden={true} />
      )}
    </button>
  );
};