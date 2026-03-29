'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type ProgressSize = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: string
  size?: ProgressSize
  animated?: boolean
  className?: string
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  color,
  size = 'md',
  animated = true,
  className,
}) => {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = Math.round((clamped / max) * 100)

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-chalk">{label}</span>}
          {showValue && <span className="text-blush">{percent}%</span>}
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full border border-border bg-void',
          sizeStyles[size]
        )}
      >
        {/* Fill */}
        <motion.div
          className={cn(
            'relative h-full rounded-full',
            !color && 'bg-ignite'
          )}
          style={color ? { backgroundColor: color } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Animated stripes */}
          {animated && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                backgroundSize: '16px 16px',
              }}
              animate={{ backgroundPosition: ['0px 0px', '16px 0px'] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressBar
