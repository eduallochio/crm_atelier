/**
 * Traduz erros de transporte (fetch) para mensagens legíveis ao usuário final.
 * "Failed to fetch" / "NetworkError" são exceções nativas do navegador quando a
 * requisição não chega ao servidor (sem internet, conexão instável, timeout).
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
  }
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
