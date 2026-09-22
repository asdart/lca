import { motion, useReducedMotion } from 'motion/react'
import React, { type CSSProperties, type JSX, useMemo } from 'react'

export type TextShimmerProps = {
  children: string
  as?: React.ElementType
  className?: string
  duration?: number
  spread?: number
  baseColor?: string
  gradientColor?: string
}

function TextShimmerComponent({
  children,
  as: Component = 'span',
  className,
  duration = 3,
  spread = 2,
  baseColor = 'rgba(22, 17, 28, .6)',
  gradientColor = '#16111c',
}: TextShimmerProps) {
  const reduceMotion = useReducedMotion()
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  )
  const dynamicSpread = useMemo(
    () => children.length * spread,
    [children, spread],
  )

  return (
    <MotionComponent
      animate={reduceMotion ? undefined : { backgroundPosition: '0% center' }}
      className={className}
      initial={{ backgroundPosition: '100% center' }}
      style={{
        '--spread': `${dynamicSpread}px`,
        display: 'inline-block',
        color: 'transparent',
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - var(--spread)), ${gradientColor}, transparent calc(50% + var(--spread))), linear-gradient(${baseColor}, ${baseColor})`,
        backgroundSize: '250% 100%, auto',
        backgroundRepeat: 'no-repeat',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } as CSSProperties}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration,
        ease: 'linear',
      }}
    >
      {children}
    </MotionComponent>
  )
}

export const TextShimmer = React.memo(TextShimmerComponent)
