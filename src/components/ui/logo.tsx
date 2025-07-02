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
    console.error('Logo failed to load from:', e.currentTarget.src);
    // Fallback to text if image fails
    e.currentTarget.style.display = 'none';
    if (e.currentTarget.nextElementSibling) {
      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/f89bb5b6-d346-4bcc-9d5f-46aeec0ea077.png" 
        alt="LuvImg - Administração de Condomínios" 
        className={`${sizeClasses[size]}`}
        onError={handleImageError}
      />
      <span 
        className={`font-bold text-primary hidden ${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'}`}
      >
        LuvImg
      </span>
    </div>
  );
}