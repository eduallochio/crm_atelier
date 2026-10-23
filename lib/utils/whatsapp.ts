/**
 * Número no formato do wa.me (55 + DDD + número).
 * Só considera que o 55 já é o código do país quando o número tem 12 ou 13 dígitos:
 * "(55) 99999-1234" é DDD 55 (RS) e precisa ganhar o 55 do Brasil na frente.
 */
export function whatsappNumber(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}
