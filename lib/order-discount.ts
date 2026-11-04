// Calcula o valor de desconto a aplicar sobre um subtotal de OS. Percentual
// tem prioridade sobre desconto fixo (nunca os dois juntos) e é limitado a
// 0-100 — sem o clamp, um percentual acima de 100 zeraria o total
// artificialmente. Usado tanto na criação (POST /api/orders) quanto na
// edição de itens (PUT /api/orders/[id]/items) de uma OS.
export function calcularDesconto(subtotal: number, descontoPercentualInput: number, descontoValorInput: number) {
  const descontoPercentual = Math.min(100, Math.max(0, Number(descontoPercentualInput) || 0))
  // Desconto fixo também é limitado ao subtotal — sem esse clamp, um valor
  // maior que o subtotal ficaria persistido como está (ex.: subtotal R$10,
  // desconto R$500), mesmo com valorTotal corretamente zerado pelo Math.max
  // abaixo, deixando recibos/PDF que leem desconto_valor direto do banco
  // mostrarem um desconto maior que o próprio subtotal
  const descontoValorClamped = Math.min(subtotal, Math.max(0, Number(descontoValorInput) || 0))
  let valorDesconto = 0
  if (descontoPercentual > 0) {
    valorDesconto = (subtotal * descontoPercentual) / 100
  } else if (descontoValorClamped > 0) {
    valorDesconto = descontoValorClamped
  }
  return {
    descontoPercentual,
    descontoValor: descontoPercentual > 0 ? 0 : descontoValorClamped,
    valorTotal: Math.max(0, subtotal - valorDesconto),
  }
}
