import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  text?: string;
  className?: string;
}

/**
 * Shared Loading Spinner component
 *
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" text="Loading products..." />
 * <LoadingSpinner variant="dark" />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'dark',
  text,
  className = '',
}) => {
  const sizeStyles: Record<string, { width: string; height: string; borderWidth: string }> = {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '24px', height: '24px', borderWidth: '3px' },
    lg: { width: '40px', height: '40px', borderWidth: '4px' },
  };

  const spinnerStyle: React.CSSProperties = {
    width: sizeStyles[size].width,
    height: sizeStyles[size].height,
    borderWidth: sizeStyles[size].borderWidth,
    borderStyle: 'solid',
    borderRadius: '50%',
    animation: 'spinner-rotate 0.8s linear infinite',
    borderColor: variant === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    borderTopColor: variant === 'light' ? 'white' : 'var(--color-primary, #28a745)',
  };

  return (
    <div
      className={`loading-spinner-container ${className}`.trim()}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
      role="status"
      aria-label={text || 'Loading'}
    >
      <div style={spinnerStyle} aria-hidden="true" />
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
