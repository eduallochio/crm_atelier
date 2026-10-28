import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { isNotNull } from 'drizzle-orm'
import { getSubscriptionPayments, type AsaasPayment } from '@/lib/asaas'
import { logServerError } from '@/lib/log-error'

// Mapeia status do Asaas para o status simplificado que a UI usa
function mapStatus(payment: AsaasPayment): 'paid' | 'pending' | 'overdue' | 'failed' {
  if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH') return 'paid'
  if (payment.status === 'OVERDUE') return 'overdue'
  if (payment.status === 'REFUNDED' || payment.status === 'REFUND_REQUESTED' || payment.status === 'CHARGEBACK_REQUESTED' || payment.status === 'CHARGEBACK_DISPUTE') return 'failed'
  return 'pending'
}

// GET /api/admin/invoices
// Agrega as faturas reais (pagamentos) de todas as organizações com assinatura
// no Asaas — dados ao vivo, não ficam salvos localmente
export async function GET() {
  try {
    await requireMasterFast()

    const orgs = await db
      .select({
        id:                  organizations.id,
        name:                organizations.name,
        plan:                organizations.plan,
        asaasSubscriptionId: organizations.asaasSubscriptionId,
      })
      .from(organizations)
      .where(isNotNull(organizations.asaasSubscriptionId))

    type Invoice = {
      id: string
      organizationId: string
      organizationName: string
      plan: string
      amount: number
      status: ReturnType<typeof mapStatus>
      dueDate: string
      paidDate: string | null
      invoiceUrl: string | null
    }

    const results = await Promise.allSettled(
      orgs.map(async (org): Promise<Invoice[]> => {
        const payments = await getSubscriptionPayments(org.asaasSubscriptionId!)
        return payments.map((p) => ({
          id:               p.id,
          organizationId:   org.id,
          organizationName: org.name,
          plan:             org.plan,
          amount:           p.value,
          status:           mapStatus(p),
          dueDate:          p.dueDate,
          paidDate:         p.paymentDate ?? null,
          invoiceUrl:       p.invoiceUrl ?? null,
        }))
      })
    )

    const invoices = results
      .filter((r): r is PromiseFulfilledResult<Invoice[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

    // Organizações cuja assinatura falhou ao buscar no Asaas (cancelada, etc.)
    // não quebram a tela inteira — só ficam de fora da lista
    const failedCount = results.filter((r) => r.status === 'rejected').length
    if (failedCount > 0) {
      logServerError('[GET /api/admin/invoices]', new Error(`${failedCount} organizaç${failedCount === 1 ? 'ão falhou' : 'ões falharam'} ao buscar faturas no Asaas`))
    }

    return NextResponse.json(invoices)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/admin/invoices]', error)
    return NextResponse.json({ error: 'Erro ao carregar faturas' }, { status: 500 })
  }
}
