import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-16 w-auto',
  xl: 'h-20 w-auto'
};

export function Logo({ className = '', size = 'md', variant = 'light' }: LogoProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Logo failed to load:', e.currentTarget.src);
    // Set a fallback or hide the image on error
    e.currentTarget.style.display = 'none';
  };

  return (
    <img 
      src="/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" 
      alt="Luv.img - Administração de Condomínios" 
      className={`${sizeClasses[size]} ${className}`}
      onError={handleImageError}
      onLoad={() => console.log('Logo loaded successfully')}
    />
  );
}