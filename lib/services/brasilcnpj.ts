export interface CnpjResponse {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  // 2 = Ativa, 3 = Suspensa, 4 = Inapta, 8 = Baixada
  situacao_cadastral: number
  descricao_situacao_cadastral?: string
  natureza_juridica: string
  email: string | null
  ddd_telefone_1: string       // pode ser string vazia ""
  ddd_telefone_2: string
  ddd_fax: string
  cep: string | null
  logradouro: string           // pode ser string vazia ""
  numero: string
  complemento: string
  bairro: string
  municipio: string | null
  uf: string | null
  porte: string
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  opcao_pelo_mei: boolean
  qsa: { nome_socio?: string; nome?: string; qualificacao_socio?: string }[]
}

export function isAtiva(data: CnpjResponse): boolean {
  return data.situacao_cadastral === 2
}

/** Retorna o telefone formatado, priorizando ddd_telefone_1 */
export function getTelefone(data: CnpjResponse): string {
  const raw = data.ddd_telefone_1 || data.ddd_telefone_2 || ''
  return raw.replace(/\D/g, '')
}

export async function buscarCnpj(cnpj: string): Promise<CnpjResponse> {
  const digits = cnpj.replace(/\D/g, '')

  if (digits.length !== 14) throw new Error('CNPJ deve conter 14 dígitos')

  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
    // Sem cache — dados cadastrais podem mudar
    cache: 'no-store',
  })

  if (res.status === 404) throw new Error('CNPJ não encontrado na base da Receita Federal')
  if (res.status === 400) throw new Error('CNPJ inválido')
  if (!res.ok) throw new Error('Serviço de consulta indisponível. Tente novamente.')

  return res.json()
}

export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
