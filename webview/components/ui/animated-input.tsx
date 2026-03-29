'use client'

import React, { useState, useRef, useId, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  type?: string
}

const sizeConfig = {
  sm: {
    wrapper: 'h-9',
    input: 'text-xs px-3',
    label: 'text-[10px]',
    labelFloating: '-top-2 text-[10px]',
    labelResting: 'top-2 text-xs',
    iconSize: 'h-3.5 w-3.5',
    iconPadLeft: 'pl-8',
    iconPadRight: 'pr-8',
    iconLeft: 'left-2.5',
    iconRight: 'right-2.5',
  },
  md: {
    wrapper: 'h-11',
    input: 'text-sm px-3.5',
    label: 'text-xs',
    labelFloating: '-top-2.5 text-xs',
    labelResting: 'top-3 text-sm',
    iconSize: 'h-4 w-4',
    iconPadLeft: 'pl-10',
    iconPadRight: 'pr-10',
    iconLeft: 'left-3',
    iconRight: 'right-3',
  },
  lg: {
    wrapper: 'h-13',
    input: 'text-base px-4',
    label: 'text-xs',
    labelFloating: '-top-2.5 text-xs',
    labelResting: 'top-3.5 text-base',
    iconSize: 'h-5 w-5',
    iconPadLeft: 'pl-11',
    iconPadRight: 'pr-11',
    iconLeft: 'left-3.5',
    iconRight: 'right-3.5',
  },
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  placeholder,
  value: controlledValue,
  onChange,
  error,
  disabled = false,
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  type = 'text',
}) => {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(controlledValue ?? '')
  const config = sizeConfig[size]

  // Support both controlled and uncontrolled usage
  const isControlled = controlledValue !== undefined && onChange !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value)
      onChange?.(e)
    },
    [isControlled, onChange]
  )

  const isFloating = focused || value.length > 0

  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback(() => setFocused(false), [])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Input wrapper */}
      <div
        className={cn(
          'relative flex items-center rounded-lg',
          config.wrapper,
          disabled && 'opacity-40 pointer-events-none'
        )}
      >
        {/* Animated border / focus ring */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={false}
          animate={{
            boxShadow: focused
              ? error
                ? '0 0 0 1.5px rgba(232,78,45,0.5), 0 0 0 4px rgba(232,78,45,0.08)'
                : '0 0 0 1.5px rgba(232,78,45,0.6), 0 0 0 4px rgba(232,78,45,0.1)'
              : error
                ? '0 0 0 1.5px rgba(232,78,45,0.5)'
                : '0 0 0 1px rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />

        {/* Background */}
        <div className="absolute inset-0 rounded-lg bg-obsidian pointer-events-none" />

        {/* Left icon */}
        {leftIcon && (
          <span
            className={cn(
              'absolute flex items-center justify-center text-text-faint transition-colors z-10',
              focused && 'text-ignite',
              config.iconLeft,
              config.iconSize
            )}
          >
            {leftIcon}
          </span>
        )}

        {/* Native input */}
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={isFloating ? placeholder : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'relative z-[1] w-full h-full bg-transparent outline-none rounded-lg text-chalk placeholder:text-text-faint',
            config.input,
            leftIcon && config.iconPadLeft,
            rightIcon && config.iconPadRight,
            label && isFloating && 'pt-3'
          )}
        />

        {/* Floating label */}
        {label && (
          <motion.label
            htmlFor={id}
            className={cn(
              'absolute z-[2] pointer-events-none origin-left px-1 rounded-sm',
              leftIcon ? config.iconPadLeft : 'left-3',
              error ? 'text-ignite' : focused ? 'text-ignite' : 'text-text-faint'
            )}
            initial={false}
            animate={
              isFloating
                ? {
                    y: size === 'sm' ? -16 : -20,
                    x: leftIcon ? -24 : 0,
                    scale: 0.85,
                    opacity: 1,
                  }
                : {
                    y: 0,
                    x: 0,
                    scale: 1,
                    opacity: 1,
                  }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{ top: '50%', translateY: '-50%' }}
          >
            <span className={cn(isFloating && 'bg-obsidian px-1')}>
              {label}
            </span>
          </motion.label>
        )}

        {/* Right icon */}
        {rightIcon && (
          <span
            className={cn(
              'absolute flex items-center justify-center text-text-faint transition-colors z-10',
              focused && 'text-ignite',
              config.iconRight,
              config.iconSize
            )}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mt-1.5 text-xs text-ignite"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnimatedInput
