import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ServiceOrder } from '@/lib/validations/service-order'

export function generateOrderPDF(order: ServiceOrder, organizationName: string = 'Meu Atelier') {
  const doc = new jsPDF()
  
  // Configurações
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPosition = 20

  // Cabeçalho
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(organizationName, margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(16)
  doc.text(`Ordem de Serviço #${order.numero.toString().padStart(6, '0')}`, margin, yPosition)
  
  // Linha separadora
  yPosition += 5
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  // Informações do Cliente
  yPosition += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', margin, yPosition)
  
  yPosition += 7
  doc.setFont('helvetica', 'normal')
  doc.text(order.client?.nome || 'Não informado', margin + 5, yPosition)
  
  if (order.client?.telefone) {
    yPosition += 7
    doc.text(`Telefone: ${order.client.telefone}`, margin + 5, yPosition)
  }
  
  if (order.client?.email) {
    yPosition += 7
    doc.text(`Email: ${order.client.email}`, margin + 5, yPosition)
  }
  
  // Informações da Ordem
  yPosition += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Informações da Ordem:', margin, yPosition)
  
  yPosition += 7
  doc.setFont('helvetica', 'normal')
  
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  }
  
  doc.text(`Status: ${statusLabels[order.status]}`, margin + 5, yPosition)
  
  yPosition += 7
  doc.text(
    `Data de Abertura: ${format(new Date(order.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}`,
    margin + 5,
    yPosition
  )
  
  if (order.data_prevista) {
    yPosition += 7
    doc.text(
      `Data Prevista: ${format(new Date(order.data_prevista), 'dd/MM/yyyy', { locale: ptBR })}`,
      margin + 5,
      yPosition
    )
  }
  
  if (order.data_conclusao) {
    yPosition += 7
    doc.text(
      `Data de Conclusão: ${format(new Date(order.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}`,
      margin + 5,
      yPosition
    )
  }
  
  // Tabela de Serviços
  yPosition += 10
  
  const tableData = order.items?.map(item => [
    item.service_nome,
    item.quantidade.toString(),
    `R$ ${item.valor_unitario.toFixed(2)}`,
    `R$ ${item.valor_total.toFixed(2)}`
  ]) || []
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Serviço', 'Qtd', 'Valor Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })
  
  // Obter posição Y após a tabela
  yPosition = (doc as any).lastAutoTable.finalY + 10
  
  // Resumo Financeiro
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
  
  // Box de totais
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(245, 245, 245)
  doc.rect(pageWidth - 90, yPosition, 70, 50, 'FD')
  
  yPosition += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Subtotal:`, pageWidth - 85, yPosition)
  doc.text(`R$ ${subtotal.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
  
  if (valorDesconto > 0) {
    yPosition += 7
    doc.setTextColor(220, 38, 38)
    doc.text(`Desconto:`, pageWidth - 85, yPosition)
    doc.text(`- R$ ${valorDesconto.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  
  yPosition += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total:`, pageWidth - 85, yPosition)
  doc.setTextColor(22, 163, 74)
  doc.text(`R$ ${totalComDesconto.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  
  if (valorPago > 0) {
    yPosition += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(59, 130, 246)
    doc.text(`Pago:`, pageWidth - 85, yPosition)
    doc.text(`R$ ${valorPago.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
    
    yPosition += 7
    doc.setTextColor(249, 115, 22)
    doc.text(`Saldo:`, pageWidth - 85, yPosition)
    doc.text(`R$ ${saldoRestante.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  
  // Observações
  if (order.observacoes) {
    yPosition += 20
    
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Observações:', margin, yPosition)
    
    yPosition += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const observacoesLines = doc.splitTextToSize(order.observacoes, pageWidth - 2 * margin)
    doc.text(observacoesLines, margin, yPosition)
  }
  
  // Rodapé
  const footerY = doc.internal.pageSize.height - 20
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  
  // Baixar PDF
  doc.save(`ordem-servico-${order.numero.toString().padStart(6, '0')}.pdf`)
}
