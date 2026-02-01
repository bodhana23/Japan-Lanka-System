import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared Badge component for status indicators
 *
 * Usage:
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger" icon={<AlertCircle size={12} />}>Error</Badge>
 * <Badge variant="warning">Pending</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
}) => {
  const classes = ['badge', `badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
