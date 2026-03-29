'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  variant?: 'text' | 'avatar' | 'card' | 'button'
  width?: string | number
  height?: string | number
  count?: number
  animate?: boolean
  className?: string
}

const variantStyles = {
  text: 'rounded-md w-full h-4',
  avatar: 'rounded-full w-12 h-12',
  card: 'rounded-xl w-full h-[200px]',
  button: 'rounded-lg w-[120px] h-10',
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animate = true,
  className = '',
}) => {
  const lines = variant === 'text' ? count : 1

  return (
    <>
      {Array.from({ length: lines }).map((_, i) => {
        const isLastLine = variant === 'text' && lines > 1 && i === lines - 1

        return (
          <div
            key={i}
            className={cn(
              'bg-border/20 overflow-hidden',
              variantStyles[variant],
              className
            )}
            style={{
              width: isLastLine ? '75%' : width,
              height: height,
            }}
          >
            {animate && (
              <motion.div
                className="h-full w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(232,78,45,0.06), transparent)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export default SkeletonLoader
