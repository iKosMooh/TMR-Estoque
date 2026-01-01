'use client';

import { useEffect, useCallback } from 'react';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
}

export const useFocusTrap = (ref: React.RefObject<HTMLElement>, options: UseFocusTrapOptions) => {
  const { isActive, onEscape } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;

    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

    // Handle Tab key for focus trap
    if (e.key === 'Tab' && ref.current) {
      const focusableElements = ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }, [isActive, onEscape, ref]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);
};
