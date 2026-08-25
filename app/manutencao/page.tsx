export default function ManutencaoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff8f0',
        fontFamily: "'DM Sans', sans-serif",
        padding: '24px',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div
          style={{
            width: 64,
            height: 64,
            background: '#2C1810',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4a85a', marginBottom: 10 }}>
          Manutenção
        </p>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 42,
            fontWeight: 300,
            color: '#2C1810',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Sistema em<br />manutenção
        </h1>

        <p style={{ fontSize: 15, fontWeight: 300, color: '#7a6a5a', lineHeight: 1.7, marginBottom: 32 }}>
          Estamos realizando melhorias no sistema. Voltaremos em breve.
          Agradecemos sua paciência.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(212,168,90,0.1)',
            border: '1px solid rgba(212,168,90,0.3)',
            borderRadius: 8,
            fontSize: 13,
            color: '#a07850',
            fontWeight: 400,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Tente novamente em alguns minutos
        </div>
      </div>
    </div>
  )
}
