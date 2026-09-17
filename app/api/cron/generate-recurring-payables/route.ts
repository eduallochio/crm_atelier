import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orgRecurringExpenses, orgPayables } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const LEAD_DAYS = 7

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Próxima data de vencimento após a última geração, respeitando o dia fixo do mês
// (cai no último dia do mês se diaVencimento não existir nele, ex: dia 31 em fevereiro).
function nextDueDate(ultimaGeracaoMes: string | null, diaVencimento: number): Date {
  const base = ultimaGeracaoMes ? new Date(`${ultimaGeracaoMes}T00:00:00`) : addMonths(new Date(), -1)
  const next = addMonths(base, 1)
  const day = Math.min(diaVencimento, lastDayOfMonth(next.getFullYear(), next.getMonth()))
  return new Date(next.getFullYear(), next.getMonth(), day)
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// GET — chamado pelo Vercel Cron (diário). Gera as contas a pagar de despesas
// recorrentes cujo próximo vencimento está a LEAD_DAYS dias ou menos.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const templates = await db
      .select()
      .from(orgRecurringExpenses)
      .where(eq(orgRecurringExpenses.ativo, true))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() + LEAD_DAYS)

    let generated = 0

    for (const t of templates) {
      const due = nextDueDate(t.ultimaGeracaoMes, t.diaVencimento)
      if (due > cutoff) continue

      const dueStr = toDateStr(due)

      await db.insert(orgPayables).values({
        organizationId:     t.organizationId,
        supplierId:         t.supplierId,
        categoryId:         t.categoryId,
        recurringExpenseId: t.id,
        descricao:          t.descricao,
        valor:              t.valorPadrao,
        dataVencimento:     dueStr,
        status:             'pendente',
        formaPagamento:     t.formaPagamento,
      })

      await db
        .update(orgRecurringExpenses)
        .set({ ultimaGeracaoMes: dueStr, updatedAt: new Date() })
        .where(eq(orgRecurringExpenses.id, t.id))

      generated++
    }

    return NextResponse.json({ generated })
  } catch (error) {
    logServerError('[GET /api/cron/generate-recurring-payables]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
