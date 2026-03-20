'use client'

import React, {
  Children, cloneElement, forwardRef, isValidElement,
  useEffect, useMemo, useRef,
} from 'react'
import gsap from 'gsap'
import { BarChart3, FileText, Users, Wallet, Scissors, TrendingUp, CheckCircle2, Clock } from 'lucide-react'

/* ─── Card primitive ─────────────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string
}
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, className, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={['cs-card', customClass, className].filter(Boolean).join(' ')}
    />
  )
)
Card.displayName = 'Card'

/* ─── GSAP helpers (idênticos ao React Bits) ─────────────────────────── */
const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
})

const placeNow = (
  el: HTMLElement,
  slot: ReturnType<typeof makeSlot>,
  skew: number
) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  })

/* ─── Telas mockadas ─────────────────────────────────────────────────── */
function ScreenDashboard() {
  return (
    <div style={{ width:'100%', height:'100%', background:'#f4f4f5', display:'flex', borderRadius:10, overflow:'hidden' }}>
      <div style={{ width:52, background:'#18181b', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:16, gap:10, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#c8714a,#d4a85a)', marginBottom:8 }} />
        {[<BarChart3 key="b" size={15}/>, <Users key="u" size={15}/>, <FileText key="f" size={15}/>, <Wallet key="w" size={15}/>].map((ic,i) => (
          <div key={i} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:i===0?'rgba(200,113,74,0.22)':'transparent', color:i===0?'#c8714a':'#52525b' }}>{ic}</div>
        ))}
      </div>
      <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9, overflow:'hidden' }}>
        <div>
          <p style={{ fontSize:8.5, color:'#71717a', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>quinta-feira, 19 de março de 2025</p>
          <p style={{ fontSize:15, fontWeight:700, color:'#18181b', margin:'3px 0 0' }}>Bom dia, Ana! 👋</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
          {[
            { label:'Clientes', value:'156', sub:'+12 este mês', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)', ic:<Users size={10} color="#fff"/>, ibg:'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
            { label:'Ordens',   value:'23',  sub:'+5 semana',    bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', ic:<FileText size={10} color="#fff"/>, ibg:'linear-gradient(135deg,#22c55e,#15803d)' },
            { label:'Receita',  value:'R$8k', sub:'+18%',        bg:'linear-gradient(135deg,#fefce8,#fef9c3)', ic:<Wallet size={10} color="#fff"/>, ibg:'linear-gradient(135deg,#eab308,#a16207)' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius:8, padding:'9px 10px', background:s.bg, border:'1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <p style={{ fontSize:8, color:'#52525b', margin:0 }}>{s.label}</p>
                <div style={{ width:18, height:18, borderRadius:4, background:s.ibg, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.ic}</div>
              </div>
              <p style={{ fontSize:16, fontWeight:700, color:'#18181b', margin:0 }}>{s.value}</p>
              <p style={{ fontSize:7.5, color:'#71717a', margin:'3px 0 0' }}>{s.sub}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:8, padding:'9px 11px', border:'1px solid #e4e4e7', flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:600, color:'#18181b' }}>Receita — Últimos 6 Meses</span>
            <span style={{ fontSize:8, color:'#a1a1aa', background:'#f4f4f5', borderRadius:3, padding:'2px 6px' }}>2025</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:56 }}>
            {[55,72,60,85,68,92].map((h,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0', height:`${h}%`, background:i===5?'#c8714a':i===4?'#d4a85a':'#e4d5b8' }} />
                <span style={{ fontSize:7, color:'#a1a1aa' }}>{['Jan','Fev','Mar','Abr','Mai','Jun'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenOrders() {
  const rows = [
    { client:'Ana Paula S.', service:'Vestido de Festa', status:'em_andamento', value:'R$ 380', date:'22/03' },
    { client:'Carla Mendes',  service:'Ajuste em Calça',  status:'concluido',    value:'R$ 60',  date:'20/03' },
    { client:'Renata Lima',   service:'Blusa Sob Medida', status:'pendente',     value:'R$ 220', date:'25/03' },
    { client:'Júlia Costa',   service:'Saia Rodada',      status:'em_andamento', value:'R$ 180', date:'24/03' },
  ]
  const badge: Record<string,{bg:string;color:string;label:string}> = {
    em_andamento:{ bg:'#fef3c7', color:'#d97706', label:'Em andamento' },
    concluido:   { bg:'#d1fae5', color:'#059669', label:'Concluído'    },
    pendente:    { bg:'#fee2e2', color:'#dc2626', label:'Pendente'     },
  }
  return (
    <div style={{ width:'100%', height:'100%', background:'#f4f4f5', display:'flex', borderRadius:10, overflow:'hidden' }}>
      <div style={{ width:52, background:'#18181b', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:16, gap:10, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#c8714a,#d4a85a)', marginBottom:8 }} />
        {[<BarChart3 key="b" size={15}/>, <Users key="u" size={15}/>, <FileText key="f" size={15}/>, <Wallet key="w" size={15}/>].map((ic,i) => (
          <div key={i} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:i===2?'rgba(200,113,74,0.22)':'transparent', color:i===2?'#c8714a':'#52525b' }}>{ic}</div>
        ))}
      </div>
      <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:15, fontWeight:700, color:'#18181b', margin:0 }}>Ordens de Serviço</p>
          <div style={{ height:22, padding:'0 10px', borderRadius:5, background:'#c8714a', display:'flex', alignItems:'center' }}>
            <span style={{ fontSize:8, color:'#fff', fontWeight:600 }}>+ Nova Ordem</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {['Todas','Pendente','Em andamento','Concluído'].map((f,i) => (
            <div key={f} style={{ padding:'3px 9px', borderRadius:10, background:i===0?'#18181b':'#e4e4e7', fontSize:7.5, color:i===0?'#fff':'#71717a', fontWeight:500 }}>{f}</div>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #e4e4e7', overflow:'hidden', flex:1 }}>
          {rows.map((o,i) => {
            const b = badge[o.status]
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', borderBottom:i<rows.length-1?'1px solid #f4f4f5':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Scissors size={11} color="#d97706"/>
                  </div>
                  <div>
                    <p style={{ fontSize:9.5, fontWeight:600, color:'#18181b', margin:0 }}>{o.client}</p>
                    <p style={{ fontSize:8, color:'#71717a', margin:0 }}>{o.service}</p>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                  <span style={{ fontSize:7.5, padding:'2px 7px', borderRadius:8, background:b.bg, color:b.color, fontWeight:600 }}>{b.label}</span>
                  <span style={{ fontSize:9.5, fontWeight:700, color:'#18181b' }}>{o.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScreenClients() {
  const clients = [
    { name:'Ana Paula S.', orders:8,  total:'R$ 2.140', avatar:'AP', color:'#3b82f6', since:'Jan/24' },
    { name:'Carla Mendes',  orders:5,  total:'R$ 890',   avatar:'CM', color:'#8b5cf6', since:'Mar/24' },
    { name:'Renata Lima',   orders:14, total:'R$ 3.620', avatar:'RL', color:'#c8714a', since:'Out/23' },
    { name:'Júlia Costa',   orders:2,  total:'R$ 400',   avatar:'JC', color:'#059669', since:'Fev/25' },
  ]
  return (
    <div style={{ width:'100%', height:'100%', background:'#f4f4f5', display:'flex', borderRadius:10, overflow:'hidden' }}>
      <div style={{ width:52, background:'#18181b', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:16, gap:10, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#c8714a,#d4a85a)', marginBottom:8 }} />
        {[<BarChart3 key="b" size={15}/>, <Users key="u" size={15}/>, <FileText key="f" size={15}/>, <Wallet key="w" size={15}/>].map((ic,i) => (
          <div key={i} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:i===1?'rgba(200,113,74,0.22)':'transparent', color:i===1?'#c8714a':'#52525b' }}>{ic}</div>
        ))}
      </div>
      <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:15, fontWeight:700, color:'#18181b', margin:0 }}>Clientes</p>
          <div style={{ height:22, padding:'0 10px', borderRadius:5, background:'#c8714a', display:'flex', alignItems:'center' }}>
            <span style={{ fontSize:8, color:'#fff', fontWeight:600 }}>+ Novo Cliente</span>
          </div>
        </div>
        <div style={{ background:'#fff', border:'1px solid #e4e4e7', borderRadius:7, padding:'5px 10px', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid #a1a1aa' }} />
          <span style={{ fontSize:8.5, color:'#a1a1aa' }}>Buscar cliente...</span>
        </div>
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #e4e4e7', overflow:'hidden', flex:1 }}>
          {clients.map((cl,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', borderBottom:i<clients.length-1?'1px solid #f4f4f5':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:cl.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>{cl.avatar}</span>
                </div>
                <div>
                  <p style={{ fontSize:9.5, fontWeight:600, color:'#18181b', margin:0 }}>{cl.name}</p>
                  <p style={{ fontSize:7.5, color:'#a1a1aa', margin:0 }}>desde {cl.since}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#18181b', margin:0 }}>{cl.orders}</p>
                  <p style={{ fontSize:7, color:'#a1a1aa', margin:0 }}>ordens</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:9.5, fontWeight:700, color:'#059669', margin:0 }}>{cl.total}</p>
                  <p style={{ fontSize:7, color:'#a1a1aa', margin:0 }}>total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScreenFinanceiro() {
  const txs = [
    { desc:'Vestido de Festa — Ana Paula', val:'+ R$ 380', color:'#059669', type:'entrada', date:'22/03' },
    { desc:'Tecido Oxford 5m',             val:'- R$ 95',  color:'#dc2626', type:'saída',   date:'21/03' },
    { desc:'Blusa Sob Medida — Renata',    val:'+ R$ 220', color:'#059669', type:'entrada', date:'20/03' },
    { desc:'Linha e Zíper (atacado)',       val:'- R$ 48',  color:'#dc2626', type:'saída',   date:'19/03' },
  ]
  return (
    <div style={{ width:'100%', height:'100%', background:'#f4f4f5', display:'flex', borderRadius:10, overflow:'hidden' }}>
      <div style={{ width:52, background:'#18181b', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:16, gap:10, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#c8714a,#d4a85a)', marginBottom:8 }} />
        {[<BarChart3 key="b" size={15}/>, <Users key="u" size={15}/>, <FileText key="f" size={15}/>, <Wallet key="w" size={15}/>].map((ic,i) => (
          <div key={i} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:i===3?'rgba(200,113,74,0.22)':'transparent', color:i===3?'#c8714a':'#52525b' }}>{ic}</div>
        ))}
      </div>
      <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:9, overflow:'hidden' }}>
        <p style={{ fontSize:15, fontWeight:700, color:'#18181b', margin:0 }}>Financeiro</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          {[
            { label:'A Receber', value:'R$ 3.420', icon:<TrendingUp size={10} color="#fff"/>, bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', ibg:'linear-gradient(135deg,#22c55e,#15803d)', color:'#059669' },
            { label:'A Pagar',   value:'R$ 840',   icon:<Clock size={10} color="#fff"/>,       bg:'linear-gradient(135deg,#fef2f2,#fee2e2)', ibg:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius:8, padding:'10px 11px', background:s.bg, border:'1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <p style={{ fontSize:8, color:'#52525b', margin:0 }}>{s.label}</p>
                <div style={{ width:18, height:18, borderRadius:4, background:s.ibg, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #e4e4e7', flex:1, overflow:'hidden' }}>
          <div style={{ padding:'7px 11px', borderBottom:'1px solid #f4f4f5' }}>
            <p style={{ fontSize:10, fontWeight:600, color:'#18181b', margin:0 }}>Lançamentos Recentes</p>
          </div>
          {txs.map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 11px', borderBottom:i<3?'1px solid #f9f9f9':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:t.type==='entrada'?'#d1fae5':'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle2 size={10} color={t.color}/>
                </div>
                <div>
                  <p style={{ fontSize:8.5, color:'#18181b', margin:0, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.desc}</p>
                  <p style={{ fontSize:7.5, color:'#a1a1aa', margin:0 }}>{t.date}</p>
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:t.color }}>{t.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── CardSwap (GSAP, igual React Bits) ─────────────────────────────── */
interface CardSwapProps {
  width?: number
  height?: number
  cardDistance?: number
  verticalDistance?: number
  delay?: number
  pauseOnHover?: boolean
  skewAmount?: number
  easing?: 'elastic' | 'power'
}

export default function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  skewAmount = 6,
  easing = 'elastic',
}: CardSwapProps) {
  const config = easing === 'elastic'
    ? { ease:'elastic.out(0.6,0.9)', durDrop:2, durMove:2, durReturn:2, promoteOverlap:0.9, returnDelay:0.05 }
    : { ease:'power1.inOut',         durDrop:0.8, durMove:0.8, durReturn:0.8, promoteOverlap:0.45, returnDelay:0.2 }

  const screens = [
    { id:'dashboard',  Screen: ScreenDashboard  },
    { id:'orders',     Screen: ScreenOrders     },
    { id:'clients',    Screen: ScreenClients    },
    { id:'financeiro', Screen: ScreenFinanceiro },
  ]

  const refs = useMemo(() => screens.map(() => React.createRef<HTMLDivElement>()), [])
  const order = useRef(screens.map((_, i) => i))
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const total = refs.length
    refs.forEach((r, i) => {
      if (r.current) placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount)
    })

    const swap = () => {
      if (order.current.length < 2) return
      const [front, ...rest] = order.current
      const elFront = refs[front].current
      if (!elFront) return
      const tl = gsap.timeline()
      tlRef.current = tl

      tl.to(elFront, { y: '+=800', duration: config.durDrop, ease: config.ease })

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`)
      rest.forEach((idx, i) => {
        const el = refs[idx].current
        if (!el) return
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length)
        tl.set(el, { zIndex: slot.zIndex }, 'promote')
        tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.15}`)
      })

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length)
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`)
      tl.call(() => { gsap.set(elFront, { zIndex: backSlot.zIndex }) }, undefined, 'return')
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return')
      tl.call(() => { order.current = [...rest, front] })
    }

    swap()
    intervalRef.current = setInterval(swap, delay)

    if (pauseOnHover && container.current) {
      const node = container.current
      const pause  = () => { tlRef.current?.pause(); if (intervalRef.current) clearInterval(intervalRef.current) }
      const resume = () => { tlRef.current?.play();  intervalRef.current = setInterval(swap, delay) }
      node.addEventListener('mouseenter', pause)
      node.addEventListener('mouseleave', resume)
      return () => {
        node.removeEventListener('mouseenter', pause)
        node.removeEventListener('mouseleave', resume)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing])

  return (
    <>
      <style>{`
        .cs-container {
          position: absolute;
          top: 20%;
          left: 95%;
          transform: translate(-90%, -90%);
          transform-origin: center center;
          perspective: 900px;
          overflow: visible;
        }
        .cs-card {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 14px;
          border: 1px solid rgba(212,168,90,0.3);
          background: #0e0a06;
          transform-style: preserve-3d;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cs-chrome {
          height: 30px;
          background: #0a0603;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 6px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(212,168,90,0.1);
        }
        .cs-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cs-url {
          margin-left: 8px;
          background: #1a0e06;
          border-radius: 4px;
          padding: 3px 10px;
          font-size: 9.5px;
          color: #7a5830;
          letter-spacing: 0.02em;
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap;
        }
        .cs-body { flex: 1; overflow: hidden; min-height: 0; }
        @media (max-width: 1024px) {
          .cs-container {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.85);
          }
        }
        @media (max-width: 768px) {
          .cs-container {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.6);
          }
        }
        @media (max-width: 480px) {
          .cs-container {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.45);
          }
        }
      `}</style>

      <div ref={container} className="cs-container" style={{ width, height }}>
        {screens.map((s, i) => (
          <div
            key={s.id}
            ref={refs[i]}
            className="cs-card"
            style={{ width, height }}
          >
            <div className="cs-chrome">
              <div className="cs-dot" style={{ background:'#ff5f57' }} />
              <div className="cs-dot" style={{ background:'#ffbd2e' }} />
              <div className="cs-dot" style={{ background:'#28c940' }} />
              <div className="cs-url">
                <svg width="7" height="8" viewBox="0 0 12 14" fill="none">
                  <rect x="1" y="5" width="10" height="8" rx="2" stroke="#7a5830" strokeWidth="1.5"/>
                  <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="#7a5830" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                meuatelier.com.br
              </div>
            </div>
            <div className="cs-body">
              <s.Screen />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
