// Cupom "pendente" vindo de uma página de promoção (ex: /promo) — guardado no
// navegador para sobreviver ao fluxo de cadastro (vários redirects: /cadastro
// → confirmação de e-mail → /dashboard) até a pessoa chegar em Configurações
// > Assinatura, onde é aplicado automaticamente. Só faz sentido para quem
// ainda não teve nenhuma assinatura — por isso quem usa isso sempre confere
// currentPlan === 'free' antes de agir sobre o valor salvo aqui.
const PENDING_COUPON_KEY = 'ma-cupom-pendente'
const PENDING_COUPON_MAX_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

export function markPendingCoupon(code: string) {
  try { localStorage.setItem(PENDING_COUPON_KEY, `${code}|${Date.now()}`) } catch { /* storage bloqueado */ }
}

export function clearPendingCoupon() {
  try { localStorage.removeItem(PENDING_COUPON_KEY) } catch { /* storage bloqueado */ }
}

export function readPendingCoupon(): string | null {
  try {
    const v = localStorage.getItem(PENDING_COUPON_KEY)
    if (!v) return null
    const [code, at] = v.split('|')
    if (!code || !at || Date.now() - Number(at) > PENDING_COUPON_MAX_MS) {
      localStorage.removeItem(PENDING_COUPON_KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}
