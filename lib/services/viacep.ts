export interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  const cepLimpo = cep.replace(/\D/g, '')

  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos')
  }

  const response = await fetch(`/api/cep?cep=${cepLimpo}`)

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao buscar CEP')
  }

  return response.json() as Promise<ViaCepResponse>
}

export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return cep
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`
}
