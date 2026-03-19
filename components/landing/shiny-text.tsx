'use client'

import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react'
import { useRef, useState, useCallback, useEffect } from 'react'

interface ShinyTextProps {
  text: string
  speed?: number
  className?: string
  color?: string
  shineColor?: string
  spread?: number
  pauseOnHover?: boolean
  style?: React.CSSProperties
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 3,
  className = '',
  color = 'rgba(247,240,230,0.55)',
  shineColor = 'rgba(212,168,90,0.9)',
  spread = 100,
  pauseOnHover = true,
  style,
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const progress = useMotionValue(0)
  const elapsedRef = useRef(0)
  const lastTimeRef = useRef<number | null>(null)
  const animDuration = speed * 1000

  useAnimationFrame(time => {
    if (isPaused) { lastTimeRef.current = null; return }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return }
    elapsedRef.current += time - lastTimeRef.current
    lastTimeRef.current = time
    const cycleTime = elapsedRef.current % (animDuration + 1200)
    const p = cycleTime < animDuration ? (cycleTime / animDuration) * 100 : 100
    progress.set(p)
  })

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`)

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        ...style,
      }}
      onMouseEnter={() => { if (pauseOnHover) setIsPaused(true) }}
      onMouseLeave={() => { if (pauseOnHover) setIsPaused(false) }}
    >
      {text}
    </motion.span>
  )
}

export default ShinyText
