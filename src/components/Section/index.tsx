import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  as?: 'div' | 'section';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  title, 
  as: Component = 'section',
  className = '' 
}) => {
  return (
    <Component className={`py-6 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
        )}
        {children}
      </div>
    </Component>
  );
};
