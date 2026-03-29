'use client'

import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface AnimatedSelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
}) => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocusIndex(-1)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Scroll focused option into view
  useEffect(() => {
    if (open && focusIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[focusIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusIndex, open])

  const openDropdown = useCallback(() => {
    if (disabled) return
    setOpen(true)
    // Focus the currently selected item, or the first
    const idx = options.findIndex((o) => o.value === value)
    setFocusIndex(idx >= 0 ? idx : 0)
  }, [disabled, options, value])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setFocusIndex(-1)
  }, [])

  const selectOption = useCallback(
    (opt: SelectOption) => {
      onChange?.(opt.value)
      closeDropdown()
    },
    [onChange, closeDropdown]
  )

  const handleTriggerClick = useCallback(() => {
    if (open) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }, [open, openDropdown, closeDropdown])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDropdown()
        }
        return
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeDropdown()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusIndex((prev) => (prev + 1) % options.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusIndex((prev) => (prev - 1 + options.length) % options.length)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusIndex >= 0 && focusIndex < options.length) {
            selectOption(options[focusIndex])
          }
          break
        case 'Home':
          e.preventDefault()
          setFocusIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusIndex(options.length - 1)
          break
      }
    },
    [open, focusIndex, options, openDropdown, closeDropdown, selectOption]
  )

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', disabled && 'opacity-40 pointer-events-none', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-label={placeholder}
        disabled={disabled}
        onClick={handleTriggerClick}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-obsidian px-3.5 py-2.5 text-sm text-left transition-colors cursor-pointer',
          'focus-visible:outline-none',
          open
            ? 'border-ignite/60 ring-1 ring-ignite/20'
            : 'border-border hover:border-border-light'
        )}
      >
        <span className={cn(selectedOption ? 'text-chalk' : 'text-text-faint')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <motion.span
          className="ml-2 flex items-center text-text-faint"
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={placeholder}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ transformOrigin: 'top' }}
            className="absolute z-50 mt-1.5 w-full max-h-60 overflow-auto rounded-lg border border-border bg-obsidian py-1 shadow-xl"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value
              const isFocused = focusIndex === i

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setFocusIndex(i)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-sm cursor-pointer transition-colors',
                    isSelected ? 'text-ignite' : 'text-chalk',
                    isFocused && 'bg-ignite/10',
                    !isFocused && 'hover:bg-ignite/5'
                  )}
                >
                  {/* Selection indicator */}
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-ignite bg-ignite/20'
                        : 'border-border'
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          className="block h-1.5 w-1.5 rounded-full bg-ignite"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        />
                      )}
                    </AnimatePresence>
                  </span>

                  <span>{option.label}</span>
                </div>
              )
            })}

            {options.length === 0 && (
              <div className="px-3.5 py-4 text-center text-sm text-text-faint">
                No options available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnimatedSelect
