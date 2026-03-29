'use client'

import React, { useEffect, useCallback, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  const id = useId()
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${id}-title` : undefined}
            aria-describedby={description ? `${id}-description` : undefined}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cn(
              'relative z-10 w-full max-w-lg rounded-xl border border-border bg-obsidian p-6 shadow-xl',
              className
            )}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-blush transition-colors hover:bg-ignite/10 hover:text-chalk"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header */}
            {(title || description) && (
              <div className="mb-4 pr-6">
                {title && (
                  <h2
                    id={`${id}-title`}
                    className="text-lg font-medium text-chalk"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={`${id}-description`}
                    className="mt-1 text-sm text-blush"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="text-sm text-chalk">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ModalDialog
