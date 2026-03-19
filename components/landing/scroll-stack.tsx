'use client'

import React, { useLayoutEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface ScrollStackItemProps {
  itemClassName?: string
  children: ReactNode
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = '' }) => (
  <div
    className={`scroll-stack-card relative w-full my-6 box-border origin-top will-change-transform ${itemClassName}`.trim()}
    style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
  >
    {children}
  </div>
)

interface ScrollStackProps {
  className?: string
  children: ReactNode
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

/** Pega o offsetTop acumulado até o document (não depende de scroll/transform) */
function getDocumentOffset(el: HTMLElement): number {
  let top = 0
  let cur: HTMLElement | null = el
  while (cur) {
    top += cur.offsetTop
    cur = cur.offsetParent as HTMLElement | null
  }
  return top
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const stackCompletedRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)
  const cardsRef = useRef<HTMLElement[]>([])
  // Offsets cacheados no setup — não mudam durante o scroll
  const cardOffsetsRef = useRef<number[]>([])
  const endOffsetRef = useRef<number>(0)
  const lastTransformsRef = useRef(new Map<number, { translateY: number; scale: number; rotation: number; blur: number }>())
  const isUpdatingRef = useRef(false)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0
    if (scrollTop > end) return 1
    return (scrollTop - start) / (end - start)
  }, [])

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight
    }
    return parseFloat(value as string)
  }, [])

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return { scrollTop: window.scrollY, containerHeight: window.innerHeight }
    }
    const scroller = scrollerRef.current
    return { scrollTop: scroller ? scroller.scrollTop : 0, containerHeight: scroller ? scroller.clientHeight : 0 }
  }, [useWindowScroll])

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return
    isUpdatingRef.current = true

    const { scrollTop, containerHeight } = getScrollData()
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)
    const endElementTop = endOffsetRef.current

    cardsRef.current.forEach((card, i) => {
      if (!card) return

      // Usa offset cacheado — estático, não varia com scroll/transform
      const cardTop = cardOffsetsRef.current[i] ?? 0

      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i
      const triggerEnd = cardTop - scaleEndPositionPx
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i
      const pinEnd = endElementTop - containerHeight / 2

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
      const targetScale = baseScale + i * itemScale
      const scale = 1 - scaleProgress * (1 - targetScale)
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0

      let blur = 0
      if (blurAmount) {
        let topCardIndex = 0
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = cardOffsetsRef.current[j] ?? 0
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j
          if (scrollTop >= jTriggerStart) topCardIndex = j
        }
        if (i < topCardIndex) blur = Math.max(0, (topCardIndex - i) * blurAmount)
      }

      let translateY = 0
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd
      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i
      } else if (scrollTop > pinEnd) {
        // Posição final fixa — sem recomputar
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i
      }

      const newT = {
        translateY: Math.round(translateY * 10) / 10,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 10) / 10,
      }
      const last = lastTransformsRef.current.get(i)
      const changed = !last ||
        Math.abs(last.translateY - newT.translateY) > 0.5 ||
        Math.abs(last.scale - newT.scale) > 0.001 ||
        Math.abs(last.rotation - newT.rotation) > 0.1 ||
        Math.abs(last.blur - newT.blur) > 0.1

      if (changed) {
        card.style.transform = `translate3d(0,${newT.translateY}px,0) scale(${newT.scale}) rotate(${newT.rotation}deg)`
        card.style.filter = newT.blur > 0 ? `blur(${newT.blur}px)` : ''
        lastTransformsRef.current.set(i, newT)
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
        if (isInView && !stackCompletedRef.current) { stackCompletedRef.current = true; onStackComplete?.() }
        else if (!isInView && stackCompletedRef.current) { stackCompletedRef.current = false }
      }
    })

    isUpdatingRef.current = false
  }, [itemScale, itemStackDistance, stackPosition, scaleEndPosition, baseScale, rotationAmount, blurAmount, useWindowScroll, onStackComplete, calculateProgress, parsePercentage, getScrollData])

  /** Recalcula offsets estáticos — chamado no setup e no resize */
  const cacheOffsets = useCallback(() => {
    const cards = cardsRef.current
    if (!cards.length) return

    if (useWindowScroll) {
      cardOffsetsRef.current = cards.map(getDocumentOffset)
      const endEl = document.querySelector('.scroll-stack-end') as HTMLElement | null
      endOffsetRef.current = endEl ? getDocumentOffset(endEl) : 0
    } else {
      cardOffsetsRef.current = cards.map(c => c.offsetTop)
      const scroller = scrollerRef.current
      const endEl = scroller?.querySelector('.scroll-stack-end') as HTMLElement | null
      endOffsetRef.current = endEl ? endEl.offsetTop : 0
    }
  }, [useWindowScroll])

  useLayoutEffect(() => {
    if (!useWindowScroll && !scrollerRef.current) return

    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : (scrollerRef.current?.querySelectorAll('.scroll-stack-card') ?? [])
    ) as HTMLElement[]
    cardsRef.current = cards
    const cache = lastTransformsRef.current

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`
      card.style.willChange = 'transform, filter'
      card.style.transformOrigin = 'top center'
      card.style.transform = 'translateZ(0)'
    })

    // Cacheia offsets após layout estar pronto
    cacheOffsets()
    updateCardTransforms()

    // Atualiza offsets no resize (layout pode mudar)
    const onResize = () => { cacheOffsets(); updateCardTransforms() }
    window.addEventListener('resize', onResize, { passive: true })

    const touch = isTouchDevice()

    if (touch) {
      const onScroll = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = requestAnimationFrame(updateCardTransforms)
      }
      const target = useWindowScroll ? window : scrollerRef.current
      target?.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        target?.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        stackCompletedRef.current = false
        cardsRef.current = []
        cache.clear()
        isUpdatingRef.current = false
      }
    } else {
      let lenisInstance: import('lenis').default | null = null
      const easing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      const raf = (time: number) => {
        lenisInstance?.raf(time)
        animationFrameRef.current = requestAnimationFrame(raf)
      }

      import('lenis').then(({ default: Lenis }) => {
        if (useWindowScroll) {
          lenisInstance = new Lenis({ duration: 1.2, easing, smoothWheel: true })
        } else {
          const scroller = scrollerRef.current
          if (!scroller) return
          lenisInstance = new Lenis({
            wrapper: scroller,
            content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
            duration: 1.2, easing, smoothWheel: true,
          })
        }
        lenisInstance.on('scroll', updateCardTransforms)
        animationFrameRef.current = requestAnimationFrame(raf)
      })

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        lenisInstance?.destroy()
        window.removeEventListener('resize', onResize)
        stackCompletedRef.current = false
        cardsRef.current = []
        cache.clear()
        isUpdatingRef.current = false
      }
    }
  }, [itemDistance, updateCardTransforms, cacheOffsets, useWindowScroll])

  return (
    <div
      ref={scrollerRef}
      className={`relative w-full h-full overflow-y-auto overflow-x-visible ${className}`.trim()}
    >
      <div className="scroll-stack-inner pt-[15vh] px-4 sm:px-8 lg:px-16 pb-[50rem] min-h-screen">
        {children}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  )
}

export default ScrollStack
