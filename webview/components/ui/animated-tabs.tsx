'use client'

import React, { useState } from 'react'
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

  const activeContent = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className={cn('w-full', className)}>
      {/* Tab header bar */}
      <div className="relative flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'text-white'
                : 'text-neutral-500 hover:text-white'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-orange-500/10 border border-orange-500/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeContent && (
            <motion.div
              key={activeContent.id}
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
