import React, { HTMLAttributes } from 'react';

interface AnimatedProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'bounce';
  delay?: number;
  duration?: number;
}

export const Animated: React.FC<AnimatedProps> = ({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 300,
  className = '',
  ...props
}) => {
  const animationClass = `animate-${animation}`;
  const style = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  };

  return (
    <div className={`${animationClass} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};
