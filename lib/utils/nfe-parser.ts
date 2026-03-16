/**
 * Parser de XML para NF-e (Nota Fiscal Eletrônica) e NF-Ce (Nota Fiscal do Consumidor).
 * Funciona no browser usando DOMParser nativo — sem dependências externas.
 */

export interface NFeItem {
  codigo: string
  nome: string
  quantidade: number
  unidade: string
  preco_unitario: number
  preco_total: number
}

export interface NFeParsed {
  tipo: 'NFe' | 'NFCe'
  chave_acesso: string
  numero_nota: string
  serie_nota: string
  data_emissao: string // ISO 8601
  valor_total: number
  emitente: {
    cnpj: string
    nome: string
    nome_fantasia?: string
    telefone?: string
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }
  itens: NFeItem[]
}

function getText(parent: Element | Document, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
}

function mapUnidade(uCom: string): string {
  const map: Record<string, string> = {
    UN: 'un', UNID: 'un', PC: 'un', PÇ: 'un', PCA: 'un',
    KG: 'kg', GR: 'g', G: 'g',
    MT: 'm', M: 'm', CM: 'cm',
    LT: 'L', L: 'L', ML: 'ml',
    PAR: 'par', PR: 'par',
    RL: 'rolo', PCT: 'pacote', CX: 'pacote',
  }
  return map[uCom.toUpperCase()] || uCom.toLowerCase()
}

export function parseNFe(xmlText: string): NFeParsed {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  const parseError = doc.getElementsByTagName('parsererror')[0]
  if (parseError) {
    throw new Error('XML inválido: ' + parseError.textContent)
  }

  // Detecta tipo: NF-Ce usa nfceProc ou modelo 65; NF-e usa nfeProc ou modelo 55
  const modelo = getText(doc, 'mod')
  const isNFCe = modelo === '65' || !!doc.getElementsByTagName('nfceProc')[0]
  const tipo: 'NFe' | 'NFCe' = isNFCe ? 'NFCe' : 'NFe'

  // Chave de acesso — atributo Id do infNFe (formato "NFe44...")
  const infNFe = doc.getElementsByTagName('infNFe')[0]
  if (!infNFe) throw new Error('Estrutura de NF-e não encontrada no XML')
  const idAttr = infNFe.getAttribute('Id') || ''
  const chave_acesso = idAttr.replace(/^NFe|^NFCe/, '').slice(0, 44)

  // Identificação
  const numero_nota = getText(doc, 'nNF')
  const serie_nota = getText(doc, 'serie')
  const dhEmi = getText(doc, 'dhEmi')
  const data_emissao = dhEmi ? new Date(dhEmi).toISOString() : new Date().toISOString()

  // Emitente
  const emitEl = doc.getElementsByTagName('emit')[0]
  const enderEmit = doc.getElementsByTagName('enderEmit')[0]
  const emitente = {
    cnpj: getText(emitEl, 'CNPJ'),
    nome: getText(emitEl, 'xNome'),
    nome_fantasia: getText(emitEl, 'xFant') || undefined,
    telefone: getText(emitEl, 'fone') || undefined,
    logradouro: enderEmit ? getText(enderEmit, 'xLgr') : undefined,
    numero: enderEmit ? getText(enderEmit, 'nro') : undefined,
    bairro: enderEmit ? getText(enderEmit, 'xBairro') : undefined,
    cidade: enderEmit ? getText(enderEmit, 'xMun') : undefined,
    estado: enderEmit ? getText(enderEmit, 'UF') : undefined,
    cep: enderEmit ? getText(enderEmit, 'CEP') : undefined,
  }

  // Remove campos undefined
  Object.keys(emitente).forEach(k => {
    if (emitente[k as keyof typeof emitente] === undefined || emitente[k as keyof typeof emitente] === '') {
      delete emitente[k as keyof typeof emitente]
    }
  })

  // Itens
  const detEls = doc.getElementsByTagName('det')
  const itens: NFeItem[] = []
  for (let i = 0; i < detEls.length; i++) {
    const det = detEls[i]
    const prodEl = det.getElementsByTagName('prod')[0]
    if (!prodEl) continue

    const qCom = parseFloat(getText(prodEl, 'qCom') || '0')
    const vUnCom = parseFloat(getText(prodEl, 'vUnCom') || '0')
    const vProd = parseFloat(getText(prodEl, 'vProd') || '0')
    const uCom = getText(prodEl, 'uCom') || 'un'

    itens.push({
      codigo: getText(prodEl, 'cProd'),
      nome: getText(prodEl, 'xProd'),
      quantidade: qCom,
      unidade: mapUnidade(uCom),
      preco_unitario: vUnCom,
      preco_total: vProd,
    })
  }

  // Valor total
  const vNF = getText(doc, 'vNF')
  const valor_total = parseFloat(vNF || '0')

  return {
    tipo,
    chave_acesso,
    numero_nota,
    serie_nota,
    data_emissao,
    valor_total,
    emitente,
    itens,
  }
}
