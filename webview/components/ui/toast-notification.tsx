'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

interface ToastProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

const variantStyles: Record<NonNullable<Toast['variant']>, string> = {
  default: 'border-border bg-obsidian text-chalk',
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
}

const positionStyles: Record<NonNullable<ToastProps['position']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

function ToastIcon({ variant }: { variant: NonNullable<Toast['variant']> }) {
  switch (variant) {
    case 'success':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'error':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'warning':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      )
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

const ToastItem: React.FC<{
  toast: Toast
  onDismiss: (id: string) => void
}> = ({ toast, onDismiss }) => {
  const variant = toast.variant || 'default'
  const duration = toast.duration || 4000

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={cn(
        'pointer-events-auto flex w-72 items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
        variantStyles[variant]
      )}
    >
      <ToastIcon variant={variant} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </motion.div>
  )
}

const ToastContainer: React.FC<ToastProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
  className = '',
}) => {
  const handleDismiss = onDismiss ?? (() => {})

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionStyles[position],
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {(toasts ?? []).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, variant?: Toast['variant'], duration?: number) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [
      ...prev,
      { id, message, variant: variant || 'default', duration: duration || 4000 },
    ])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}

export { ToastContainer }
export default ToastContainer
