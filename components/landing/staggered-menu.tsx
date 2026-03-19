'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { XIcon, ArrowRight } from 'lucide-react'

function IgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function FbIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}
function YtIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
    </svg>
  )
}

interface NavItem {
  href: string
  label: string
  external?: boolean
}

interface StaggeredMenuProps {
  open: boolean
  onClose: () => void
  navItems: NavItem[]
}

/* Cada letra de um item aparece deslizando de baixo p/ cima (clip + translateY),
   com delay crescente por letra — efeito idêntico ao React Bits Staggered Menu */
function StaggeredText({ text, itemIndex, open }: { text: string; itemIndex: number; open: boolean }) {
  const chars = text.split('')
  // delay base por item + delay extra por letra dentro do item
  const ITEM_BASE_DELAY = 60   // ms entre itens
  const CHAR_DELAY      = 28   // ms entre letras dentro do item
  const OPEN_DURATION   = 500  // ms para abrir (cada letra)
  const CLOSE_DURATION  = 200  // ms para fechar (rápido)

  return (
    <span aria-label={text} style={{ display: 'inline-flex', overflow: 'hidden', lineHeight: 1.15, paddingBottom: '0.05em' }}>
      {chars.map((char, ci) => {
        const delay = itemIndex * ITEM_BASE_DELAY + ci * CHAR_DELAY
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              // espaço preservado para letras ' '
              whiteSpace: char === ' ' ? 'pre' : undefined,
              transform: open ? 'translateY(0)' : 'translateY(110%)',
              opacity: open ? 1 : 0,
              transition: open
                ? `transform ${OPEN_DURATION}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity ${OPEN_DURATION}ms ease ${delay}ms`
                : `transform ${CLOSE_DURATION}ms ease 0ms, opacity ${CLOSE_DURATION}ms ease 0ms`,
            }}
          >
            {char}
          </span>
        )
      })}
    </span>
  )
}

export default function StaggeredMenu({ open, onClose, navItems }: StaggeredMenuProps) {
  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // todos os itens: nav + "Entrar"
  const allItems = [...navItems, { href: '/login', label: 'Entrar', isLogin: true }]
  // índice base para CTA e social (após todos os nav items)
  const ctaIndex  = allItems.length
  const socIndex  = allItems.length + 1

  const ITEM_BASE_DELAY = 60
  const FADE_DUR = 500

  return (
    <>
      <style>{`
        .sm-overlay {
          position: fixed; inset: 0; z-index: 200;
          pointer-events: none;
        }
        .sm-overlay.open { pointer-events: all; }

        .sm-backdrop {
          position: absolute; inset: 0;
          background: rgba(10,6,3,0.75);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .sm-overlay.open .sm-backdrop { opacity: 1; }

        .sm-panel {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: min(340px, 90vw);
          background: #120b05;
          border-left: 1px solid rgba(212,168,90,0.18);
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .sm-overlay.open .sm-panel { transform: translateX(0); }

        .sm-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid rgba(212,168,90,0.1);
          flex-shrink: 0;
        }
        .sm-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 600; letter-spacing: 0.05em;
          color: #f7f0e6;
        }
        .sm-close {
          background: none; border: none; cursor: pointer;
          color: rgba(247,240,230,0.55);
          padding: 6px; border-radius: 8px;
          display: flex; align-items: center;
          transition: color 0.2s, background 0.2s;
        }
        .sm-close:hover { color: #f7f0e6; background: rgba(247,240,230,0.08); }

        .sm-nav {
          flex: 1;
          padding: 36px 28px 24px;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }

        /* linha decorativa */
        .sm-accent-line {
          width: 28px; height: 2px;
          background: linear-gradient(90deg,#c8714a,#d4a85a);
          border-radius: 1px;
          margin-bottom: 32px;
          transition: opacity 0.4s ease 0.1s;
          opacity: 0;
        }
        .sm-overlay.open .sm-accent-line { opacity: 1; }

        /* wrapper de cada item — controla a linha separadora e hover */
        .sm-nav-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid rgba(212,168,90,0.08);
          text-decoration: none;
          cursor: pointer;
          transition: padding-left 0.25s ease;
        }
        .sm-nav-item:hover { padding-left: 6px; }

        /* texto do item — grande, display font */
        .sm-nav-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 400; letter-spacing: -0.01em;
          color: rgba(247,240,230,0.85);
          line-height: 1;
          transition: color 0.2s;
        }
        .sm-nav-item:hover .sm-nav-text { color: #f7f0e6; }
        .sm-nav-item.login .sm-nav-text { color: rgba(212,168,90,0.8); font-size: 22px; }

        /* seta hover */
        .sm-arrow {
          opacity: 0; transform: translateX(-8px);
          color: #c8714a;
          transition: opacity 0.2s, transform 0.2s;
          flex-shrink: 0;
        }
        .sm-nav-item:hover .sm-arrow { opacity: 1; transform: translateX(0); }

        /* número do item — estilo editorial */
        .sm-item-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.12em;
          color: rgba(212,168,90,0.4);
          margin-right: 12px;
          align-self: flex-end;
          padding-bottom: 4px;
        }

        /* footer */
        .sm-footer {
          padding: 24px 28px 40px;
          flex-shrink: 0;
          border-top: 1px solid rgba(212,168,90,0.1);
        }

        .sm-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px 24px;
          background: #c8714a; color: #fff;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          margin-bottom: 24px;
          transition: background 0.2s, transform 0.2s;
        }
        .sm-cta:hover { background: #b55f38; transform: translateY(-1px); }

        /* social — oculto por padrão */
        .sm-social-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(212,168,90,0.4);
          margin-bottom: 12px;
        }
        .sm-social-row {
          display: none;          /* ← trocar para flex para ativar */
          gap: 12px; align-items: center;
        }
        .sm-social-link {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(212,168,90,0.2);
          display: flex; align-items: center; justify-content: center;
          color: rgba(212,168,90,0.55);
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .sm-social-link:hover {
          border-color: rgba(212,168,90,0.55);
          color: #d4a85a;
          background: rgba(212,168,90,0.08);
        }
      `}</style>

      <div
        className={`sm-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      >
        <div className="sm-backdrop" />

        <div className="sm-panel" onClick={(e) => e.stopPropagation()}>

          {/* top bar */}
          <div className="sm-topbar">
            <span className="sm-logo">
              Meu <span style={{ color: '#c8714a' }}>Atelier</span>
            </span>
            <button className="sm-close" onClick={onClose} aria-label="Fechar menu">
              <XIcon size={20} />
            </button>
          </div>

          {/* nav */}
          <nav className="sm-nav">
            <div className="sm-accent-line" />

            {allItems.map((item, i) => {
              const isLogin = 'isLogin' in item && item.isLogin
              const Tag = isLogin ? Link : 'a'
              return (
                <Tag
                  key={item.href}
                  href={item.href}
                  className={`sm-nav-item ${isLogin ? 'login' : ''}`}
                  onClick={onClose}
                  {...('external' in item && item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
                    {!isLogin && (
                      <span className="sm-item-num">
                        0{i + 1}
                      </span>
                    )}
                    <span className="sm-nav-text">
                      <StaggeredText text={item.label} itemIndex={i} open={open} />
                    </span>
                  </div>
                  <ArrowRight size={16} className="sm-arrow" />
                </Tag>
              )
            })}
          </nav>

          {/* footer */}
          <div className="sm-footer">
            {/* CTA — fade-in após os itens */}
            <div style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(12px)',
              transition: open
                ? `opacity ${FADE_DUR}ms ease ${ctaIndex * ITEM_BASE_DELAY + 80}ms, transform ${FADE_DUR}ms ease ${ctaIndex * ITEM_BASE_DELAY + 80}ms`
                : 'opacity 0.15s ease, transform 0.15s ease',
            }}>
              <Link href="/cadastro" className="sm-cta" onClick={onClose}>
                Começar grátis <ArrowRight size={13} />
              </Link>
            </div>

            {/* social — oculto mas no DOM */}
            <div style={{
              opacity: open ? 1 : 0,
              transition: open
                ? `opacity ${FADE_DUR}ms ease ${socIndex * ITEM_BASE_DELAY + 80}ms`
                : 'opacity 0.15s ease',
            }}>
              <p className="sm-social-label">Siga nas redes</p>
              <div className="sm-social-row">
                <a href="#" className="sm-social-link" aria-label="Instagram" onClick={onClose}>
                  <IgIcon />
                </a>
                <a href="#" className="sm-social-link" aria-label="Facebook" onClick={onClose}>
                  <FbIcon />
                </a>
                <a href="#" className="sm-social-link" aria-label="YouTube" onClick={onClose}>
                  <YtIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
