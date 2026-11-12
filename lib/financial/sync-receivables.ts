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

  // ON CONFLICT precisa repetir o WHERE do índice parcial uq_receivables_service_order
  // (Drizzle não tem API para isso em onConflictDoNothing) — sem o WHERE aqui,
  // o Postgres não reconhece o índice como alvo do conflito e a query falha
  for (const o of toCreate) {
    await db.execute(sql`
      INSERT INTO org_receivables (
        organization_id, service_order_id, client_id, descricao, valor,
        data_vencimento, status, observacoes
      ) VALUES (
        ${organizationId}, ${o.id}, ${o.clientId || null},
        ${`OS #${o.numero} - ${o.clienteNome || 'Cliente'}`},
        ${String((Number(o.valorTotal) || 0) - (Number(o.valorPago) || 0))},
        ${o.dataPrevista || hojeStr}, 'pendente',
        'Gerado automaticamente a partir do saldo em aberto da ordem de serviço'
      )
      ON CONFLICT (service_order_id) WHERE service_order_id IS NOT NULL DO NOTHING
    `)
  }
}
