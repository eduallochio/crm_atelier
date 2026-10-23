/** "6.000,00", "6000,5", "6000.50" e "6.000" viram 6000 / 6000,5 / 6000,5 / 6000; vazio ou inválido vira 0 */
export function parseMoney(raw: string) {
  const s = raw.replace(/[^\d,.]/g, '')
  const n = s.includes(',')
    ? parseFloat(s.replace(/\./g, '').replace(',', '.'))   // formato brasileiro
    : /\.\d{1,2}$/.test(s)
      ? parseFloat(s)                                       // ponto como decimal (6000.50)
      : parseFloat(s.replace(/\./g, ''))                    // ponto de milhar (6.000)
  return Number.isFinite(n) && n > 0 ? n : 0
}
