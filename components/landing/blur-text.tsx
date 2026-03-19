'use client'

import { motion } from 'motion/react'
import { useEffect, useRef, useState, useMemo } from 'react'

type BlurTextProps = {
  text?: string
  delay?: number
  className?: string
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  stepDuration?: number
  onAnimationComplete?: () => void
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  style?: React.CSSProperties
}

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))])
  const keyframes: Record<string, Array<string | number>> = {}
  keys.forEach(k => { keyframes[k] = [from[k], ...steps.map(s => s[k])] })
  return keyframes
}

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 80,
  className = '',
  animateBy = 'words',
  direction = 'bottom',
  threshold = 0.1,
  rootMargin = '0px',
  stepDuration = 0.4,
  onAnimationComplete,
  as: Tag = 'p',
  style,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold, rootMargin }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const fromSnapshot = useMemo(() => (
    direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -40 }
      : { filter: 'blur(10px)', opacity: 0, y: 40 }
  ), [direction])

  const toSnapshots = useMemo(() => [
    { filter: 'blur(4px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
    { filter: 'blur(0px)', opacity: 1, y: 0 },
  ], [direction])

  const stepCount = toSnapshots.length + 1
  const totalDuration = stepDuration * (stepCount - 1)
  const times = Array.from({ length: stepCount }, (_, i) => i / (stepCount - 1))

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {elements.map((segment, index) => {
        const keyframes = buildKeyframes(fromSnapshot, toSnapshots)
        return (
          <motion.span
            key={index}
            initial={fromSnapshot}
            animate={inView ? keyframes : fromSnapshot}
            transition={{ duration: totalDuration, times, delay: (index * delay) / 1000, ease: 'easeOut' }}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
          </motion.span>
        )
      })}
    </Tag>
  )
}

export default BlurText
