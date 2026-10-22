'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * "Veja funcionando": gravação real de uma OS sendo criada no celular,
 * dentro da moldura de celular, com os passos ao lado acendendo conforme o vídeo.
 * - toca sozinho (sem som) só enquanto está na tela e com animações ligadas;
 * - com movimento reduzido/pausado não toca sozinho: mostra os controles do vídeo;
 * - clicar num passo leva o vídeo até ele.
 * A gravação foi editada para não mostrar a lista de clientes nem telefones.
 */

const CHAPTERS = [
  { t: 0, title: 'Nova ordem e cliente', desc: 'Do painel, um toque em Nova Ordem e a cliente já cadastrada.' },
  { t: 2.2, title: 'Status e data de entrega', desc: 'Em andamento, com a data prevista escolhida no calendário.' },
  { t: 7.6, title: 'Forma de pagamento', desc: 'Pix, dinheiro, cartão ou vale — a que a cliente usar.' },
  { t: 9.4, title: 'Serviços e valores', desc: 'Os serviços do seu catálogo, com quantidade e preço somados na hora.' },
  { t: 16.9, title: 'Desconto e total', desc: 'Desconto em reais ou em porcentagem, e o total já atualizado.' },
]
const DURATION = 20.86

interface Props {
  animated: boolean
  onPlay?: () => void
}

export default function DemoVideo({ animated, onPlay }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [t, setT] = useState(0)
  const played = useRef(false)

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (!animated) { v.pause(); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        v.play().then(() => { if (!played.current) { played.current = true; onPlay?.() } }).catch(() => { /* autoplay bloqueado */ })
      } else v.pause()
    }, { threshold: 0.35 })
    io.observe(v)
    return () => io.disconnect()
  }, [animated, onPlay])

  const active = CHAPTERS.reduce((acc, c, i) => (t >= c.t ? i : acc), 0)
  const seek = (i: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = CHAPTERS[i].t + 0.05
    setT(v.currentTime)
    if (animated) v.play().catch(() => {})
  }

  return (
    <div className="demo-grid">
      <div className="demo-phone-wrap">
        <div className="m-phone m-phone-video">
          <span className="m-btn-side" style={{ left: -3, top: '18%', height: '7%' }} />
          <span className="m-btn-side" style={{ left: -3, top: '28%', height: '12%' }} />
          <span className="m-btn-side" style={{ right: -3, top: '24%', height: '16%' }} />
          <div className="m-screen">
            <div className="m-status" aria-hidden="true">
              <span>15:15</span>
              <span className="m-island" />
              <svg width="38" height="10" viewBox="0 0 38 10">
                <rect x="0" y="6" width="2.4" height="4" rx=".6" fill="#111" /><rect x="3.4" y="4.5" width="2.4" height="5.5" rx=".6" fill="#111" /><rect x="6.8" y="3" width="2.4" height="7" rx=".6" fill="#111" /><rect x="10.2" y="1" width="2.4" height="9" rx=".6" fill="#111" />
                <rect x="25.5" y="1.2" width="10.5" height="7.6" rx="2" stroke="#111" strokeOpacity=".45" fill="none" /><rect x="26.8" y="2.5" width="7.9" height="5" rx="1.1" fill="#111" />
              </svg>
            </div>
            <video
              ref={video}
              muted
              loop
              playsInline
              preload="metadata"
              controls={!animated}
              poster="/screenshots/landing-os-video-poster.webp"
              aria-label="Gravação da tela do Meu Atelier no celular: criando uma ordem de serviço com cliente, status, data de entrega, forma de pagamento, serviços e desconto"
              onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
              width={480}
              height={892}
            >
              <source src="/screenshots/landing-os-video.webm" type="video/webm" />
              <source src="/screenshots/landing-os-video.mp4" type="video/mp4" />
            </video>
            <span className="m-home" aria-hidden="true" />
          </div>
        </div>
      </div>

      <ol className="demo-steps">
        {CHAPTERS.map((c, i) => {
          const end = CHAPTERS[i + 1]?.t ?? DURATION
          const p = i < active ? 1 : i > active ? 0 : Math.min(1, Math.max(0, (t - c.t) / (end - c.t)))
          return (
            <li key={c.title}>
              <button type="button" className={`demo-step ${i === active ? 'is-on' : ''}`} aria-current={i === active ? 'step' : undefined} onClick={() => seek(i)}>
                <span className="demo-num display">{String(i + 1).padStart(2, '0')}</span>
                <span className="demo-body">
                  <span className="demo-title">{c.title}</span>
                  <span className="demo-desc">{c.desc}</span>
                  <span className="demo-thread" aria-hidden="true"><span style={{ transform: `scaleX(${p.toFixed(3)})` }} /></span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
