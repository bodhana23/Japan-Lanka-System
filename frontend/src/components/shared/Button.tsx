import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isBlock?: boolean;
  isIconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Shared Button component with consistent styling
 *
 * Usage:
 * <Button variant="primary">Save</Button>
 * <Button variant="danger" size="sm">Delete</Button>
 * <Button variant="ghost" leftIcon={<Plus size={16} />}>Add Item</Button>
 * <Button variant="primary" isLoading>Saving...</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isBlock = false,
      isIconOnly = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const blockClass = isBlock ? 'btn-block' : '';
    const iconOnlyClass = isIconOnly ? 'btn-icon' : '';

    const classes = [
      baseClass,
      variantClass,
      sizeClass,
      blockClass,
      iconOnlyClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className="spinner" aria-hidden="true" />}
        {!isLoading && leftIcon && <span className="btn-icon-left" aria-hidden="true">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="btn-icon-right" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
