import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ServiceOrder } from '@/lib/validations/service-order'

export interface OrganizationData {
  name: string
  instagram?: string | null
  facebook?: string | null
  twitter?: string | null
  tiktok?: string | null
  kwai?: string | null
  pix_key?: string | null
  show_pix_key_on_order?: boolean
}

/**
 * Gera PDF otimizado para impressora térmica (80mm)
 * Layout compacto e vertical, ideal para cupons não fiscais
 */
export function generateThermalPDF(order: ServiceOrder, organizationName: string = 'Meu Atelier', orgData?: OrganizationData) {
  // Impressora térmica 80mm = ~75mm útil
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 297], // 80mm largura, altura variável (A4 height)
  })
  
  const width = 80
  const margin = 5
  const contentWidth = width - (margin * 2)
  let y = margin

  // Função auxiliar para adicionar linha
  const addLine = () => {
    doc.setLineWidth(0.3)
    doc.line(margin, y, width - margin, y)
    y += 3
  }

  // Função auxiliar para adicionar texto centralizado
  const addCenteredText = (text: string, fontSize: number = 10, bold: boolean = false) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, width / 2, y, { align: 'center' })
    y += fontSize / 2 + 2
  }

  // Função auxiliar para adicionar texto normal
  const addText = (text: string, fontSize: number = 9) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, contentWidth)
    doc.text(lines, margin, y)
    y += (lines.length * (fontSize / 2 + 1))
  }

  // Função para adicionar linha chave-valor
  const addKeyValue = (key: string, value: string, valueAlign: 'left' | 'right' = 'left') => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(key, margin, y)
    if (valueAlign === 'right') {
      doc.text(value, width - margin, y, { align: 'right' })
    } else {
      doc.text(value, margin + 20, y)
    }
    y += 4
  }

  // CABEÇALHO
  addCenteredText(organizationName, 14, true)
  addCenteredText('ORDEM DE SERVIÇO', 12, true)
  addCenteredText(`#${order.numero.toString().padStart(6, '0')}`, 11, true)
  addLine()

  // DATA E HORA
  y += 2
  addCenteredText(format(new Date(order.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR }), 9)
  y += 2
  addLine()

  // CLIENTE
  y += 2
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', margin, y)
  y += 5

  addText(`${order.client?.nome || 'Não informado'}`, 9)
  
  if (order.client?.telefone) {
    addKeyValue('Tel:', order.client.telefone)
  }
  
  if (order.client?.email) {
    addText(order.client.email, 8)
  }

  y += 2
  addLine()

  // STATUS E DATAS
  y += 2
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMAÇÕES', margin, y)
  y += 5

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  }

  addKeyValue('Status:', statusLabels[order.status])

  if (order.data_prevista) {
    addKeyValue('Previsão:', format(new Date(order.data_prevista), 'dd/MM/yyyy', { locale: ptBR }))
  }

  if (order.data_conclusao) {
    addKeyValue('Conclusão:', format(new Date(order.data_conclusao), 'dd/MM/yyyy', { locale: ptBR }))
  }

  if (order.forma_pagamento) {
    addKeyValue('Pagamento:', order.forma_pagamento)
  }

  // Exibe chave PIX se pagamento for PIX e configuração ativa
  if (
    orgData?.show_pix_key_on_order &&
    orgData?.pix_key &&
    order.forma_pagamento?.toLowerCase().includes('pix')
  ) {
    addKeyValue('Chave PIX:', orgData.pix_key)
  }

  y += 2
  addLine()

  // SERVIÇOS
  y += 2
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVIÇOS', margin, y)
  y += 5

  let subtotal = 0

  order.items?.forEach((item, index) => {
    // Nome do serviço
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const serviceLines = doc.splitTextToSize(item.service_nome, contentWidth)
    doc.text(serviceLines, margin, y)
    y += (serviceLines.length * 4)

    // Quantidade e valores
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${item.quantidade} x R$ ${item.valor_unitario.toFixed(2)}`, margin + 2, y)
    doc.text(`R$ ${item.valor_total.toFixed(2)}`, width - margin, y, { align: 'right' })
    y += 5

    subtotal += item.valor_total

    // Espaço entre itens
    if (index < (order.items?.length || 0) - 1) {
      y += 2
    }
  })

  y += 2
  addLine()

  // TOTAIS
  y += 2
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Subtotal
  doc.text('Subtotal:', margin, y)
  doc.text(`R$ ${subtotal.toFixed(2)}`, width - margin, y, { align: 'right' })
  y += 5

  // Desconto
  let valorDesconto = 0
  if (order.desconto_percentual && order.desconto_percentual > 0) {
    valorDesconto = (subtotal * order.desconto_percentual) / 100
    doc.text(`Desconto (${order.desconto_percentual}%):`, margin, y)
    doc.text(`-R$ ${valorDesconto.toFixed(2)}`, width - margin, y, { align: 'right' })
    y += 5
  } else if (order.desconto_valor && order.desconto_valor > 0) {
    valorDesconto = order.desconto_valor
    doc.text('Desconto:', margin, y)
    doc.text(`-R$ ${valorDesconto.toFixed(2)}`, width - margin, y, { align: 'right' })
    y += 5
  }

  // Total
  const totalComDesconto = subtotal - valorDesconto
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', margin, y)
  doc.text(`R$ ${totalComDesconto.toFixed(2)}`, width - margin, y, { align: 'right' })
  y += 6

  // Pagamento
  const valorPago = order.valor_pago || 0
  const saldoRestante = totalComDesconto - valorPago

  if (valorPago > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Pago:', margin, y)
    doc.text(`R$ ${valorPago.toFixed(2)}`, width - margin, y, { align: 'right' })
    y += 5
  }

  if (saldoRestante > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Saldo Restante:', margin, y)
    doc.text(`R$ ${saldoRestante.toFixed(2)}`, width - margin, y, { align: 'right' })
    y += 6
  }

  // Observações
  if (order.observacoes) {
    y += 2
    addLine()
    y += 2
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES', margin, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const obsLines = doc.splitTextToSize(order.observacoes, contentWidth)
    doc.text(obsLines, margin, y)
    y += (obsLines.length * 3.5) + 3
  }

  // Rodapé
  y += 5
  addLine()
  y += 3
  addCenteredText('Obrigado pela preferência!', 9)

  // Redes sociais
  if (orgData) {
    const socials: { label: string; handle: string | null | undefined }[] = [
      { label: 'Instagram', handle: orgData.instagram },
      { label: 'Facebook',  handle: orgData.facebook },
      { label: 'X',         handle: orgData.twitter },
      { label: 'TikTok',   handle: orgData.tiktok },
      { label: 'Kwai',     handle: orgData.kwai },
    ].filter(s => s.handle)
    if (socials.length > 0) {
      y += 2
      socials.forEach(s => addCenteredText(`${s.label}: @${s.handle}`, 7))
    }
  }

  addCenteredText(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), 7)

  // Salvar PDF
  doc.save(`ordem-servico-${order.numero.toString().padStart(6, '0')}.pdf`)
}

/**
 * Gera preview HTML da ordem para impressora térmica
 */
export function generateThermalPreview(order: ServiceOrder, organizationName: string = 'Meu Atelier', orgData?: OrganizationData): string {
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  }

  const subtotal = order.items?.reduce((sum, item) => sum + item.valor_total, 0) || 0
  
  let valorDesconto = 0
  if (order.desconto_percentual && order.desconto_percentual > 0) {
    valorDesconto = (subtotal * order.desconto_percentual) / 100
  } else if (order.desconto_valor && order.desconto_valor > 0) {
    valorDesconto = order.desconto_valor
  }
  
  const totalComDesconto = subtotal - valorDesconto
  const valorPago = order.valor_pago || 0
  const saldoRestante = totalComDesconto - valorPago

  return `
    <div style="width: 300px; font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; background: white; border: 2px dashed #ccc; margin: 0 auto;">
      <!-- Cabeçalho -->
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">${organizationName}</div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">ORDEM DE SERVIÇO</div>
        <div style="font-size: 13px; font-weight: bold;">#${order.numero.toString().padStart(6, '0')}</div>
      </div>
      
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      
      <!-- Data -->
      <div style="text-align: center; font-size: 11px; margin-bottom: 8px;">
        ${format(new Date(order.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
      </div>
      
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      
      <!-- Cliente -->
      <div style="margin-bottom: 12px;">
        <div style="font-weight: bold; margin-bottom: 4px;">CLIENTE</div>
        <div style="margin-left: 4px;">
          <div>${order.client?.nome || 'Não informado'}</div>
          ${order.client?.telefone ? `<div style="font-size: 11px;">Tel: ${order.client.telefone}</div>` : ''}
          ${order.client?.email ? `<div style="font-size: 10px;">${order.client.email}</div>` : ''}
        </div>
      </div>
      
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      
      <!-- Informações -->
      <div style="margin-bottom: 12px;">
        <div style="font-weight: bold; margin-bottom: 4px;">INFORMAÇÕES</div>
        <div style="margin-left: 4px; font-size: 11px;">
          <div>Status: ${statusLabels[order.status]}</div>
          ${order.data_prevista ? `<div>Previsão: ${format(new Date(order.data_prevista), 'dd/MM/yyyy', { locale: ptBR })}</div>` : ''}
          ${order.data_conclusao ? `<div>Conclusão: ${format(new Date(order.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}</div>` : ''}
          ${order.forma_pagamento ? `<div>Pagamento: ${order.forma_pagamento}</div>` : '<div style="color: #999;">Pagamento: Não informado</div>'}
          ${(orgData?.show_pix_key_on_order && orgData?.pix_key && order.forma_pagamento?.toLowerCase().includes('pix')) ? `<div style="font-size: 10px; margin-top: 2px; padding: 4px 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; color: #166534;">Chave PIX: ${orgData.pix_key}</div>` : ''}
        </div>
      </div>
      
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      
      <!-- Serviços -->
      <div style="margin-bottom: 12px;">
        <div style="font-weight: bold; margin-bottom: 6px;">SERVIÇOS</div>
        ${order.items?.map(item => `
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; font-size: 11px;">${item.service_nome}</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-left: 4px;">
              <span>${item.quantidade} x R$ ${item.valor_unitario.toFixed(2)}</span>
              <span>R$ ${item.valor_total.toFixed(2)}</span>
            </div>
          </div>
        `).join('') || '<div style="font-size: 11px;">Nenhum serviço adicionado</div>'}
      </div>
      
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      
      <!-- Totais -->
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span>Subtotal:</span>
          <span>R$ ${subtotal.toFixed(2)}</span>
        </div>
        ${valorDesconto > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>Desconto${order.desconto_percentual ? ` (${order.desconto_percentual}%)` : ''}:</span>
            <span>-R$ ${valorDesconto.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 6px;">
          <span>TOTAL:</span>
          <span>R$ ${totalComDesconto.toFixed(2)}</span>
        </div>
        ${valorPago > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px;">
            <span>Pago:</span>
            <span>R$ ${valorPago.toFixed(2)}</span>
          </div>
        ` : ''}
        ${saldoRestante > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-top: 4px;">
            <span>Saldo Restante:</span>
            <span>R$ ${saldoRestante.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      ${order.observacoes ? `
        <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px;">OBSERVAÇÕES</div>
          <div style="font-size: 10px; margin-left: 4px;">${order.observacoes}</div>
        </div>
      ` : ''}
      
      <!-- Rodapé -->
      <div style="border-top: 1px dashed #666; margin: 8px 0;"></div>
      <div style="text-align: center; font-size: 11px; margin-top: 12px;">
        <div style="margin-bottom: 4px;">Obrigado pela preferência!</div>
        ${orgData ? (() => {
          const socials = [
            { label: 'Instagram', handle: orgData.instagram },
            { label: 'Facebook',  handle: orgData.facebook },
            { label: 'X',         handle: orgData.twitter },
            { label: 'TikTok',   handle: orgData.tiktok },
            { label: 'Kwai',     handle: orgData.kwai },
          ].filter(s => s.handle)
          if (socials.length === 0) return ''
          return `<div style="margin-top: 6px; font-size: 9px; line-height: 1.6;">
            ${socials.map(s => `<div>${s.label}: @${s.handle}</div>`).join('')}
          </div>`
        })() : ''}
        <div style="font-size: 9px; margin-top: 4px;">${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
      </div>
    </div>
  `
}

/**
 * Gera texto formatado para envio via WhatsApp
 * Usa formatação suportada pelo WhatsApp (*negrito*, _itálico_)
 */
export function generateWhatsAppText(order: ServiceOrder, organizationName: string = 'Meu Atelier', orgData?: OrganizationData): string {
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  }

  const sep = '─────────────────────'
  const orderNumber = order.numero.toString().padStart(6, '0')

  const subtotal = order.items?.reduce((sum, item) => sum + item.valor_total, 0) || 0

  let valorDesconto = 0
  if (order.desconto_percentual && order.desconto_percentual > 0) {
    valorDesconto = (subtotal * order.desconto_percentual) / 100
  } else if (order.desconto_valor && order.desconto_valor > 0) {
    valorDesconto = order.desconto_valor
  }

  const totalComDesconto = subtotal - valorDesconto
  const valorPago = order.valor_pago || 0
  const saldoRestante = totalComDesconto - valorPago

  const lines: string[] = []

  // Cabeçalho
  lines.push(`*${organizationName.toUpperCase()}*`)
  lines.push(`*ORDEM DE SERVIÇO #${orderNumber}*`)
  if (order.data_abertura) {
    lines.push(format(new Date(order.data_abertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }))
  }
  lines.push(sep)

  // Cliente
  lines.push(`*CLIENTE*`)
  lines.push(order.client?.nome || 'Não informado')
  if (order.client?.telefone) lines.push(`Tel: ${order.client.telefone}`)
  if (order.client?.email) lines.push(order.client.email)
  lines.push(sep)

  // Informações
  lines.push(`*INFORMAÇÕES*`)
  lines.push(`Status: ${statusLabels[order.status]}`)
  if (order.data_prevista) {
    lines.push(`Previsão: ${format(new Date(order.data_prevista), 'dd/MM/yyyy', { locale: ptBR })}`)
  }
  if (order.data_conclusao) {
    lines.push(`Conclusão: ${format(new Date(order.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}`)
  }
  if (order.forma_pagamento) {
    lines.push(`Pagamento: ${order.forma_pagamento}`)
  }
  // Chave PIX
  if (
    orgData?.show_pix_key_on_order &&
    orgData?.pix_key &&
    order.forma_pagamento?.toLowerCase().includes('pix')
  ) {
    lines.push(`Chave PIX: *${orgData.pix_key}*`)
  }
  lines.push(sep)

  // Serviços
  lines.push(`*SERVIÇOS*`)
  order.items?.forEach(item => {
    lines.push(`• *${item.service_nome}*`)
    lines.push(`  ${item.quantidade}x R$ ${item.valor_unitario.toFixed(2)} = R$ ${item.valor_total.toFixed(2)}`)
  })
  if (!order.items?.length) lines.push('Nenhum serviço adicionado')
  lines.push(sep)

  // Totais
  lines.push(`Subtotal: R$ ${subtotal.toFixed(2)}`)
  if (valorDesconto > 0) {
    const descontoLabel = order.desconto_percentual ? ` (${order.desconto_percentual}%)` : ''
    lines.push(`Desconto${descontoLabel}: -R$ ${valorDesconto.toFixed(2)}`)
  }
  lines.push(`*TOTAL: R$ ${totalComDesconto.toFixed(2)}*`)
  if (valorPago > 0) lines.push(`Pago: R$ ${valorPago.toFixed(2)}`)
  if (saldoRestante > 0) lines.push(`*Saldo Restante: R$ ${saldoRestante.toFixed(2)}*`)

  // Observações
  if (order.observacoes) {
    lines.push(sep)
    lines.push(`*OBSERVAÇÕES*`)
    lines.push(order.observacoes)
  }

  // Rodapé
  lines.push(sep)
  lines.push('Obrigado pela preferência! 🙏')

  // Redes sociais
  if (orgData) {
    const socials: { label: string; handle: string | null | undefined }[] = [
      { label: 'Instagram', handle: orgData.instagram },
      { label: 'Facebook',  handle: orgData.facebook },
      { label: 'X',         handle: orgData.twitter },
      { label: 'TikTok',   handle: orgData.tiktok },
      { label: 'Kwai',     handle: orgData.kwai },
    ].filter(s => s.handle)
    if (socials.length > 0) {
      socials.forEach(s => lines.push(`${s.label}: @${s.handle}`))
    }
  }

  return lines.join('\n')
}
