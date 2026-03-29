'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  animated?: boolean
  removable?: boolean
  onRemove?: () => void
  icon?: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-neutral-700 bg-neutral-900 text-neutral-400',
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  info: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  animated = true,
  removable = false,
  onRemove,
  icon,
  className,
}) => {
  const Component = animated ? motion.span : 'span'
  const animationProps = animated
    ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { duration: 0.2 },
      }
    : {}

  return (
    <Component
      className={cn(
        'inline-flex items-center rounded-full border font-medium leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...animationProps}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/10"
          aria-label="Remove"
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 2.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </Component>
  )
}

export default Badge
