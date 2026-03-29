'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type SheetSide = 'left' | 'right' | 'top' | 'bottom'

interface SheetProps {
  open: boolean
  onClose: () => void
  side?: SheetSide
  title?: string
  children?: React.ReactNode
  className?: string
}

const slideVariants = {
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
} as const

const positionClasses: Record<SheetSide, string> = {
  right: 'inset-y-0 right-0 w-full max-w-md border-l',
  left: 'inset-y-0 left-0 w-full max-w-md border-r',
  top: 'inset-x-0 top-0 h-auto max-h-[80vh] border-b',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[80vh] border-t',
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  side = 'right',
  title,
  children,
  className,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  // Scroll lock & Escape listener
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  const variant = slideVariants[side]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title || 'Sheet'}>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-void/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet panel */}
          <motion.div
            className={cn(
              'absolute flex flex-col bg-obsidian border-border shadow-2xl',
              positionClasses[side],
              className
            )}
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-5 py-4 border-b border-border">
              {title && (
                <h2 className="text-base font-medium text-chalk truncate pr-4">
                  {title}
                </h2>
              )}
              {!title && <span />}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close sheet"
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-lg text-text-faint transition-colors',
                  'hover:text-chalk hover:bg-ignite/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ignite/40'
                )}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Sheet
