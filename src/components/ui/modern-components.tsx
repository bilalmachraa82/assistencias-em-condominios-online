import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Modern Floating Action Button
interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, icon: Icon, label, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-primary text-primary-foreground hover:shadow-glow',
      secondary: 'bg-gradient-secondary text-secondary-foreground hover:shadow-medium',
      accent: 'bg-gradient-vibrant text-white hover:shadow-colored'
    };

    const sizes = {
      sm: 'h-10 w-10',
      md: 'h-12 w-12',
      lg: 'h-14 w-14'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'fixed bottom-6 right-6 rounded-full flex items-center justify-center',
          'transition-all duration-300 hover:-translate-y-2 active:scale-95',
          'shadow-strong backdrop-blur-xl border border-white/20',
          'animate-floating z-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <Icon className="h-5 w-5" />
        {label && (
          <span className="ml-2 text-sm font-medium hidden lg:inline">
            {label}
          </span>
        )}
      </button>
    );
  }
);
FloatingActionButton.displayName = 'FloatingActionButton';

// Modern Status Indicator
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'md', 
  animated = true 
}) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          'rounded-full',
          colors[status],
          sizes[size],
          animated && status === 'online' && 'animate-pulse-soft'
        )}
      />
      {animated && status === 'online' && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-green-500 opacity-30 animate-ping',
            sizes[size]
          )}
        />
      )}
    </div>
  );
};

// Modern Progress Ring
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-light))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// Modern Notification Badge
interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  variant = 'default',
  className
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-destructive text-destructive-foreground'
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-2 py-1 text-xs font-bold leading-none',
        'rounded-full shadow-medium',
        'animate-scale-in',
        variants[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
};

// Modern Loading Skeleton
interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className
}) => {
  const baseClass = 'bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]';
  
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={cn(
        baseClass,
        variants[variant],
        !height && variant === 'text' && 'h-4',
        !height && variant === 'circular' && 'h-12 w-12',
        !height && variant === 'rectangular' && 'h-20',
        className
      )}
      style={style}
    />
  );
};