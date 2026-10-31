import { db } from '@/lib/db'
import { adminSystemSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { LogoutButton } from '@/components/suspenso/logout-button'

async function getSupportWhatsapp(): Promise<string | null> {
  try {
    const [row] = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'whatsapp_support_phone'))
      .limit(1)
    return row?.value || null
  } catch {
    return null
  }
}

export default async function SuspensoPage() {
  const whatsappPhone = await getSupportWhatsapp()

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
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="8" x2="16" y2="16" />
            <line x1="16" y1="8" x2="8" y2="16" />
          </svg>
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4a85a', marginBottom: 10 }}>
          Conta suspensa
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
          Acesso<br />temporariamente suspenso
        </h1>

        <p style={{ fontSize: 15, fontWeight: 300, color: '#7a6a5a', lineHeight: 1.7, marginBottom: 32 }}>
          O acesso da sua organização foi suspenso. Entre em contato com o suporte
          para regularizar a situação e voltar a usar o sistema.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Minha conta no Meu Atelier Sistema foi suspensa e gostaria de regularizar.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#2C1810',
                borderRadius: 8,
                fontSize: 14,
                color: '#fff8f0',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Falar com o suporte
            </a>
          )}

          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
