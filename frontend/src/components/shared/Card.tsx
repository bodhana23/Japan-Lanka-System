import React from 'react';

type CardVariant = 'default' | 'bordered' | 'accent' | 'accent-danger' | 'accent-warning' | 'accent-info';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  isHoverable?: boolean;
  children?: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Shared Card component with consistent styling
 *
 * Usage:
 * <Card variant="bordered" isHoverable>
 *   <Card.Header>
 *     <h3>Card Title</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     Card content here
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 */
const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ variant = 'default', isHoverable = false, children, className = '', ...props }) => {
  const variantClasses: Record<CardVariant, string> = {
    default: '',
    bordered: 'card-bordered',
    accent: 'card-accent',
    'accent-danger': 'card-accent-danger',
    'accent-warning': 'card-accent-warning',
    'accent-info': 'card-accent-info',
  };

  const classes = [
    'card',
    variantClasses[variant],
    isHoverable ? 'card-hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`.trim()} {...props}>
    {children}
  </div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`.trim()} {...props}>
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`.trim()} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
