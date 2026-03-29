'use client'

import React, { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion'
import { cn } from '@/lib/utils'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: TooltipPosition
  delay?: number
  className?: string
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-obsidian border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-obsidian border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-obsidian border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-obsidian border-y-transparent border-l-transparent',
}

const motionVariants: Record<TooltipPosition, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
  top: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
  },
  bottom: {
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },
  left: {
    initial: { opacity: 0, x: 4 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 4 },
  },
  right: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -4 },
  },
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className,
}) => {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }, [delay])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const variants = motionVariants[position]

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 max-w-xs whitespace-nowrap rounded-md border border-border bg-obsidian px-3 py-1.5 text-xs text-chalk shadow-lg pointer-events-none',
              positionStyles[position],
              className
            )}
          >
            {content}
            {/* Arrow */}
            <span
              className={cn(
                'absolute block h-0 w-0 border-[4px]',
                arrowStyles[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Tooltip
