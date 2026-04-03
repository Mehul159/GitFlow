'use client'

import React, { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface AnimatedTabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultTab,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTab ?? tabs[0]?.id ?? ''
  )
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const activeContent = tabs.find((tab) => tab.id === activeTab)
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)

  const focusTab = useCallback(
    (index: number) => {
      const tab = tabs[index]
      if (!tab) return
      setActiveTab(tab.id)
      tabRefs.current.get(tab.id)?.focus()
    },
    [tabs]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        focusTab((activeIndex + 1) % tabs.length)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        focusTab((activeIndex - 1 + tabs.length) % tabs.length)
      } else if (e.key === 'Home') {
        e.preventDefault()
        focusTab(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        focusTab(tabs.length - 1)
      }
    },
    [activeIndex, tabs.length, focusTab]
  )

  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="relative flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-1"
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
              }}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                isActive
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-lg bg-orange-500/10 border border-orange-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeContent && (
            <motion.div
              key={activeContent.id}
              role="tabpanel"
              id={`tabpanel-${activeContent.id}`}
              aria-labelledby={`tab-${activeContent.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeContent.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnimatedTabs
