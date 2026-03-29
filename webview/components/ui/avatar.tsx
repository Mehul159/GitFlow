'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: AvatarSize
  status?: AvatarStatus
  className?: string
}

const sizeStyles: Record<AvatarSize, { container: string; dot: string; text: string }> = {
  sm: { container: 'h-8 w-8', dot: 'h-2 w-2 right-0 bottom-0', text: 'text-xs' },
  md: { container: 'h-10 w-10', dot: 'h-2.5 w-2.5 right-0 bottom-0', text: 'text-sm' },
  lg: { container: 'h-14 w-14', dot: 'h-3 w-3 right-0.5 bottom-0.5', text: 'text-base' },
  xl: { container: 'h-20 w-20', dot: 'h-3.5 w-3.5 right-1 bottom-1', text: 'text-lg' },
}

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-text-faint',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback,
  size = 'md',
  status,
  className,
}) => {
  const [imgError, setImgError] = useState(false)
  const config = sizeStyles[size]
  const showFallback = !src || imgError

  const initials =
    fallback ||
    alt
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    '?'

  return (
    <div className={cn('relative inline-flex shrink-0', config.container, className)}>
      {showFallback ? (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full border border-border bg-obsidian font-medium text-blush',
            config.text
          )}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      )}

      {status && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute rounded-full ring-2 ring-void',
            config.dot,
            statusColors[status]
          )}
        >
          {status === 'online' && (
            <motion.span
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.span>
      )}
    </div>
  )
}

export default Avatar
