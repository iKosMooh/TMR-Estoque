'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string; // Alias for description
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  action,
}) => {
  const text = description || message;
  
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {text && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{text}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
