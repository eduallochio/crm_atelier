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
  try {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '')
    
    // Valida se tem 8 dígitos
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP')
    }

    const data: ViaCepResponse = await response.json()

    // ViaCEP retorna erro: true quando CEP não existe
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    throw error
  }
}

export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return cep
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`
}
