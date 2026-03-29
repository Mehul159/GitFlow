'use client'

import React from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type AnimatedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    children?: React.ReactNode
  }

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = 'Browse Components',
  className = '',
  ...rest
}) => {
  return (
    <motion.button
      type="button"
      {...rest}
      whileTap={{ scale: 0.97 }}
      transition={{
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: { type: 'spring', stiffness: 10, damping: 5, mass: 0.1 },
      }}
      className={cn(
        'px-6 py-2.5 rounded-lg relative overflow-hidden',
        'bg-ignite/10 border border-ignite/30',
        'text-chalk cursor-pointer',
        className
      )}
    >
      <motion.span
        className="tracking-wide font-medium h-full w-full flex items-center justify-center relative z-10"
        style={{
          maskImage:
            'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
          WebkitMaskImage:
            'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
        }}
        initial={{ ['--mask-x' as string]: '100%' }}
        animate={{ ['--mask-x' as string]: '-100%' }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear', repeatDelay: 1 }}
      >
        {children}
      </motion.span>
      <motion.span
        className="block absolute inset-0 rounded-lg p-px"
        style={{
          background:
            'linear-gradient(-75deg, transparent 30%, rgba(232,78,45,0.5) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
        }}
        initial={{ backgroundPosition: '100% 0', opacity: 0 }}
        animate={{ backgroundPosition: ['100% 0', '0% 0'], opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      />
    </motion.button>
  )
}

export default AnimatedButton
