type Movement = { tipo: string; valor: string | number }

// Saldo esperado de uma sessão de caixa a partir do saldo inicial + movimentos
// — mesma fórmula usada no fechamento manual (close-all) e automático
// (cron/close-cashiers)
export function calcularSaldoEsperado(saldoInicial: string | number, movimentos: Movement[]): number {
  const entradas = movimentos.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0)
  const saidas   = movimentos.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0)
  const sangrias = movimentos.filter(m => m.tipo === 'sangria').reduce((s, m) => s + Number(m.valor), 0)
  const reforcos = movimentos.filter(m => m.tipo === 'reforco').reduce((s, m) => s + Number(m.valor), 0)
  return Number(saldoInicial) + entradas - saidas - sangrias + reforcos
}
