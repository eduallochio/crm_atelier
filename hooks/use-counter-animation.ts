import { useEffect, useState } from 'react'

interface UseCounterAnimationProps {
  end: number
  duration?: number
  start?: number
}

export function useCounterAnimation({ 
  end, 
  duration = 2000, 
  start = 0 
}: UseCounterAnimationProps) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setCount(Math.floor(easeOut * (end - start) + start))
      
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    
    window.requestAnimationFrame(step)
  }, [end, duration, start])

  return count
}
