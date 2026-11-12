import { db } from '@/lib/db'
import { orgServiceOrders, orgReceivables } from '@/lib/db/schema'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'

/**
 * Garante que toda OS com saldo pendente (qualquer status, exceto cancelada)
 * tenha uma conta a receber correspondente — sem isso, uma OS ainda
 * pendente/em andamento nunca aparecia em Contas a Receber: um receivable só
 * era criado no fluxo de conclusão. Idempotente: cria apenas para OS que
 * ainda não têm um receivable vinculado (left join + isNull).
 *
 * O vencimento usa data_prevista da OS; se não houver, cai para hoje — a tela
 * de Contas a Receber já marca como "atrasado" o que passou da data.
 */
export async function syncReceivablesFromOpenOrders(organizationId: string): Promise<void> {
  const pendentes = await db
    .select({
      id:            orgServiceOrders.id,
      numero:        orgServiceOrders.numero,
      clientId:      orgServiceOrders.clientId,
      clienteNome:   sql<string | null>`(select nome from org_clients where id = ${orgServiceOrders.clientId})`,
      valorTotal:    orgServiceOrders.valorTotal,
      valorPago:     orgServiceOrders.valorPago,
      dataPrevista:  orgServiceOrders.dataPrevista,
    })
    .from(orgServiceOrders)
    .leftJoin(orgReceivables, eq(orgReceivables.serviceOrderId, orgServiceOrders.id))
    .where(and(
      eq(orgServiceOrders.organizationId, organizationId),
      ne(orgServiceOrders.status, 'cancelado'),
      isNull(orgReceivables.id),
    ))

  const toCreate = pendentes.filter(o => (Number(o.valorTotal) || 0) - (Number(o.valorPago) || 0) > 0)
  if (toCreate.length === 0) return

  const hojeStr = new Date().toISOString().split('T')[0]

  await db.insert(orgReceivables).values(
    toCreate.map(o => ({
      organizationId,
      serviceOrderId: o.id,
      clientId:       o.clientId || null,
      descricao:      `OS #${o.numero} - ${o.clienteNome || 'Cliente'}`,
      valor:          String((Number(o.valorTotal) || 0) - (Number(o.valorPago) || 0)),
      dataVencimento: o.dataPrevista || hojeStr,
      status:         'pendente',
      observacoes:    'Gerado automaticamente a partir do saldo em aberto da ordem de serviço',
    }))
  ).onConflictDoNothing({ target: orgReceivables.serviceOrderId })
}
