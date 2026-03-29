'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
  group?: string
}

interface CommandMenuProps {
  items: CommandItem[]
  placeholder?: string
  emptyMessage?: string
  className?: string
}

function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-ignite font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  items,
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  className,
}) => {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const lower = query.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        (item.group && item.group.toLowerCase().includes(lower))
    )
  }, [items, query])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const group = item.group ?? ''
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(item)
    }
    return map
  }, [filtered])

  const flatList = useMemo(() => filtered, [filtered])

  const scrollActiveIntoView = useCallback(
    (index: number) => {
      const el = listRef.current?.querySelector(`[data-cmd-index="${index}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = Math.min(activeIndex + 1, flatList.length - 1)
        setActiveIndex(next)
        scrollActiveIntoView(next)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = Math.max(activeIndex - 1, 0)
        setActiveIndex(prev)
        scrollActiveIntoView(prev)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        flatList[activeIndex]?.onSelect()
      }
    },
    [activeIndex, flatList, scrollActiveIntoView]
  )

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setActiveIndex(0)
  }, [])

  let runningIndex = 0

  return (
    <div
      className={cn(
        'w-full max-w-md overflow-hidden rounded-xl border border-border bg-obsidian shadow-2xl',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-text-faint"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-chalk placeholder:text-text-faint outline-none"
          autoFocus
        />
      </div>

      {/* Items list */}
      <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
        <AnimatePresence mode="popLayout">
          {flatList.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-6 text-center text-sm text-text-faint"
            >
              {emptyMessage}
            </motion.p>
          ) : (
            Array.from(grouped.entries()).map(([group, groupItems]) => {
              const startIndex = runningIndex
              runningIndex += groupItems.length

              return (
                <div key={group || '__default'}>
                  {group && (
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-faint">
                      {group}
                    </p>
                  )}
                  {groupItems.map((item, i) => {
                    const itemIndex = startIndex + i
                    const isActive = itemIndex === activeIndex

                    return (
                      <motion.button
                        key={item.id}
                        data-cmd-index={itemIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
                        type="button"
                        onClick={() => item.onSelect()}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-ignite/10 text-chalk'
                            : 'text-blush hover:text-chalk'
                        )}
                      >
                        {item.icon && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-faint">
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 truncate">
                          {highlightMatch(item.label, query)}
                        </span>
                        {item.shortcut && (
                          <kbd className="ml-auto shrink-0 rounded border border-border bg-void px-1.5 py-0.5 text-[10px] font-mono text-text-faint">
                            {item.shortcut}
                          </kbd>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CommandMenu
