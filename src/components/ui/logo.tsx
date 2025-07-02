import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

const sizeClasses = {
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-12 w-auto'
};

export function Logo({ className = '', size = 'md', variant = 'light' }: LogoProps) {
  return (
    <img 
      src="/lovable-uploads/f89bb5b6-d346-4bcc-9d5f-46aeec0ea077.png" 
      alt="LuvImg - Administração de Condomínios" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}