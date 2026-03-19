'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BarChart3, FileText, Users, Wallet, Scissors, TrendingUp, CheckCircle2, Clock } from 'lucide-react'

/* ─── telas mockadas ────────────────────────────────────────────────── */

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

/* ─── CardSwap ───────────────────────────────────────────────────────── */

const SCREENS = [
  { id:'dashboard',  label:'Dashboard',  url:'dashboard',  Screen: ScreenDashboard  },
  { id:'orders',     label:'Ordens',     url:'ordens',     Screen: ScreenOrders     },
  { id:'clients',    label:'Clientes',   url:'clientes',   Screen: ScreenClients    },
  { id:'financeiro', label:'Financeiro', url:'financeiro', Screen: ScreenFinanceiro },
]

// Cada card atrás: rotação + offset. Índice 0 = card da frente.
// Exatamente como React Bits: cards atrás ficam ligeiramente rotacionados
// e visíveis na borda direita superior, como um deck de cartas.
const STACK: { rotate: number; tx: number; ty: number; scale: number }[] = [
  { rotate:  0,   tx:   0,  ty:   0,  scale: 1.00 }, // frente
  { rotate:  6,   tx:  36,  ty: -24,  scale: 0.95 }, // atrás 1
  { rotate: 12,   tx:  66,  ty: -44,  scale: 0.90 }, // atrás 2
  { rotate: 18,   tx:  92,  ty: -60,  scale: 0.85 }, // atrás 3
]

const INTERVAL = 3200

export default function CardSwap() {
  const [order, setOrder] = useState([0, 1, 2, 3])
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    if (exiting) return
    setExiting(true)
    setTimeout(() => {
      setOrder(prev => {
        const next = [...prev]
        next.push(next.shift()!)
        return next
      })
      setExiting(false)
    }, 380)
  }, [exiting])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, INTERVAL)
  }, [advance])

  useEffect(() => {
    timerRef.current = setInterval(advance, INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [advance])

  return (
    <>
      <style>{`
        /* wrapper: tamanho fixo grande no desktop, responsivo no mobile */
        .cs-wrap {
          position: relative;
          width: 100%;
          max-width: 680px;
          height: 460px;
        }
        @media (max-width: 1024px) {
          .cs-wrap { max-width: 560px; height: 380px; }
        }
        @media (max-width: 768px) {
          .cs-wrap { max-width: 100%; height: 280px; }
        }

        .cs-card {
          position: absolute;
          /* o card da frente ocupa ~85% da largura do wrapper */
          left: 0;
          top: 0;
          width: 86%;
          height: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(212,168,90,0.22);
          background: #120b05;
          display: flex;
          flex-direction: column;
          will-change: transform, opacity;
          transform-origin: bottom left;
          transition:
            transform 0.40s cubic-bezier(0.4, 0, 0.2, 1),
            opacity   0.40s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.40s ease;
        }

        .cs-card[data-front="true"] {
          box-shadow:
            0 32px 80px rgba(0,0,0,0.55),
            0 8px 24px rgba(0,0,0,0.35),
            0 0 0 1px rgba(212,168,90,0.15);
          cursor: pointer;
        }
        .cs-card[data-front="true"]:hover {
          box-shadow:
            0 36px 88px rgba(0,0,0,0.6),
            0 8px 24px rgba(212,168,90,0.12),
            0 0 0 1px rgba(212,168,90,0.25);
        }

        .cs-chrome {
          height: 30px;
          background: #0e0703;
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
        .cs-screen-name {
          margin-left: auto;
          font-size: 8px;
          color: rgba(212,168,90,0.35);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .cs-body {
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        /* dots */
        .cs-dots {
          display: flex; gap: 6px; align-items: center;
          justify-content: center;
          margin-top: 16px;
        }
        .cs-dot-btn {
          height: 5px; border-radius: 3px;
          border: none; padding: 0; cursor: pointer;
          transition: width 0.3s, background 0.3s;
          background: rgba(212,168,90,0.25);
          width: 5px;
        }
        .cs-dot-btn.active { width: 18px; background: #c8714a; }

        .cs-label {
          text-align: center;
          margin-top: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(247,240,230,0.3);
        }
      `}</style>

      <div>
        <div className="cs-wrap">
          {order.map((screenIdx, stackPos) => {
            const s        = SCREENS[screenIdx]
            const isFront  = stackPos === 0
            const cfg      = STACK[stackPos] ?? STACK[STACK.length - 1]
            const opacity  = stackPos === 0 ? 1
                           : stackPos === 1 ? 0.85
                           : stackPos === 2 ? 0.65
                           : 0
            const zIndex   = SCREENS.length - stackPos

            // saída: card da frente voa para baixo+direita ao ser trocado
            const exitRotate = exiting && isFront ?  8  : cfg.rotate
            const exitTX     = exiting && isFront ?  20 : cfg.tx
            const exitTY     = exiting && isFront ?  80 : cfg.ty
            const exitScale  = exiting && isFront ? 0.9 : cfg.scale
            const exitOpacity = exiting && isFront ? 0  : opacity

            const { Screen } = s

            return (
              <div
                key={s.id}
                className="cs-card"
                data-front={String(isFront)}
                style={{
                  transform: `translate(${exitTX}px, ${exitTY}px) rotate(${exitRotate}deg) scale(${exitScale})`,
                  opacity: exitOpacity,
                  zIndex,
                  pointerEvents: isFront ? 'auto' : 'none',
                }}
                onClick={() => {
                  if (!isFront || exiting) return
                  advance()
                  resetTimer()
                }}
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
                    meuatelier.com.br/{s.url}
                  </div>
                  <span className="cs-screen-name">{s.label}</span>
                </div>
                <div className="cs-body">
                  <Screen />
                </div>
              </div>
            )
          })}
        </div>

        <div className="cs-dots">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              className={`cs-dot-btn ${order[0] === i ? 'active' : ''}`}
              onClick={() => {
                if (exiting) return
                const pos = order.indexOf(i)
                if (pos === 0) return
                setOrder(prev => {
                  const next = [...prev]
                  for (let k = 0; k < pos; k++) next.push(next.shift()!)
                  return next
                })
                resetTimer()
              }}
              aria-label={`Ver ${s.label}`}
            />
          ))}
        </div>
        <p className="cs-label">{SCREENS[order[0]].label}</p>
      </div>
    </>
  )
}
