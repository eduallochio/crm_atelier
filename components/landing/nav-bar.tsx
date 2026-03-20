'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface NavItem {
  href: string
  label: string
}

interface NavBarProps {
  scrolled: boolean
  onMenuOpen: () => void
}

const navItems: NavItem[] = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona',   label: 'Como funciona'   },
  { href: '#planos',          label: 'Planos'          },
]

export default function NavBar({ scrolled, onMenuOpen }: NavBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const [mounted, setMounted] = useState(false)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    // entrada animada após mount
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (hoveredIndex === null) {
      setPillStyle(s => ({ ...s, opacity: 0 }))
      return
    }
    const el = itemRefs.current[hoveredIndex]
    if (!el) return
    const parent = el.parentElement
    if (!parent) return
    const parentRect = parent.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setPillStyle({
      left: elRect.left - parentRect.left - 10,
      width: elRect.width + 20,
      opacity: 1,
    })
  }, [hoveredIndex])

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '18px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(26,17,10,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212,168,90,0.12)' : 'none',
        boxShadow: scrolled ? '0 1px 40px rgba(200,113,74,0.06)' : 'none',
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        // entrada animada
        transform: mounted ? 'translateY(0)' : 'translateY(-100%)',
        opacity: mounted ? 1 : 0,
      }}
    >
      {/* Logo */}
      <div style={{
        fontSize: 22, fontWeight: 600,
        color: '#f7f0e6', letterSpacing: '0.05em',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Meu <span style={{ color: '#c8714a' }}>Atelier</span>
      </div>

      {/* Desktop links */}
      <div
        className="nav-links-desktop"
        style={{ position: 'relative', display: 'flex', gap: 0, alignItems: 'center' }}
      >
        {/* Pill flutuante */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            height: 32,
            borderRadius: 999,
            background: 'rgba(200,113,74,0.12)',
            border: '1px solid rgba(200,113,74,0.25)',
            left: pillStyle.left,
            width: pillStyle.width,
            opacity: pillStyle.opacity,
            transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
            pointerEvents: 'none',
          }}
        />

        {navItems.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            ref={el => { itemRefs.current[i] = el }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              position: 'relative',
              color: hoveredIndex === i ? '#f7f0e6' : 'rgba(247,240,230,0.55)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '6px 16px',
              transition: 'color 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {item.label}
          </a>
        ))}

        {/* Separador vertical */}
        <span style={{
          width: 1, height: 18,
          background: 'rgba(212,168,90,0.2)',
          margin: '0 16px',
          flexShrink: 0,
        }} />

        <Link
          href="/login"
          style={{
            color: 'rgba(247,240,230,0.65)',
            fontSize: 12, letterSpacing: '0.08em',
            textTransform: 'uppercase', textDecoration: 'none',
            padding: '6px 10px',
            transition: 'color 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f7f0e6')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,240,230,0.65)')}
        >
          Entrar
        </Link>

        <Link
          href="/cadastro"
          style={{
            marginLeft: 12,
            padding: '9px 22px',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#f7f0e6',
            background: 'linear-gradient(135deg, #c8714a, #a85a38)',
            borderRadius: 2,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            position: 'relative',
            overflow: 'hidden',
            transition: 'opacity 0.2s, transform 0.2s',
            display: 'inline-block',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.88'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Começar grátis
        </Link>
      </div>

      {/* Hamburger (mobile) */}
      <button
        className="nav-hamburger"
        onClick={onMenuOpen}
        aria-label="Abrir menu"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f7f0e6', padding: 4 }}
      >
        <Menu size={24} />
      </button>
    </nav>
  )
}
