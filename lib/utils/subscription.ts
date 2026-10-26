/** Dias de hoje até a data (00:00), arredondado — negativo se já passou */
export function daysUntil(dateStr: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** "Renova em 23 dias" / "Renova amanhã" / "Renova hoje" / "Vencida há 3 dias" */
export function renewalLabel(dateStr: string, now = new Date()) {
  const days = daysUntil(dateStr, now)
  if (days < 0) return `Vencida há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
  if (days === 0) return 'Renova hoje'
  if (days === 1) return 'Renova amanhã'
  return `Renova em ${days} dias`
}
