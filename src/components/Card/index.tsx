import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

const CardRoot: React.FC<CardProps> = ({ children, className = '', as: Component = 'div' }) => {
  return (
    <Component className={`bg-level-1 shadow-sm rounded-xl border border-border transition-all duration-200 hover:shadow-lg hover:border-primary/20 ${className}`}>
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', as: Component = 'h3' }) => {
  return (
    <Component className={`text-lg font-semibold text-card-foreground ${className}`}>
      {children}
    </Component>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 bg-card rounded-lg mx-2 my-2 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-border bg-accent rounded-b-lg ${className}`}>
      {children}
    </div>
  );
};

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Content: CardContent,
  Body: CardContent, // Alias para Content
  Footer: CardFooter,
});

export { CardHeader, CardTitle, CardContent, CardFooter };
