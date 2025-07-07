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
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Logo failed to load:', e.currentTarget.src);
    // Set a fallback or hide the image on error
    e.currentTarget.style.display = 'none';
  };

  return (
    <img 
      src="/lovable-uploads/eac78bb8-18da-4bc9-b0a7-8e5f0203380c.png" 
      alt="LuvImg - Administração de Condomínios" 
      className={`${sizeClasses[size]} ${className}`}
      onError={handleImageError}
      onLoad={() => console.log('Logo loaded successfully')}
    />
  );
}