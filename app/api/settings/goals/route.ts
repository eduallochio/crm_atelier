import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgMonthlyGoals } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()
    const now   = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1

    const result = await db
      .select()
      .from(orgMonthlyGoals)
      .where(
        and(
          eq(orgMonthlyGoals.organizationId, user.organizationId),
          eq(orgMonthlyGoals.year,  year),
          eq(orgMonthlyGoals.month, month),
        )
      )
      .limit(1)

    const goal = result[0]?.revenueGoal ?? '0'
    return NextResponse.json({ monthly_revenue_goal: Number(goal) })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/settings/goals]', error); console.error('[GET /api/settings/goals]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth()
    const { monthly_revenue_goal } = await req.json()

    if (typeof monthly_revenue_goal !== 'number' || monthly_revenue_goal < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const now   = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1

    await db
      .insert(orgMonthlyGoals)
      .values({
        organizationId: user.organizationId,
        year,
        month,
        revenueGoal: String(monthly_revenue_goal),
      })
      .onConflictDoUpdate({
        target: [orgMonthlyGoals.organizationId, orgMonthlyGoals.year, orgMonthlyGoals.month],
        set: {
          revenueGoal: String(monthly_revenue_goal),
          updatedAt:   new Date(),
        },
      })

    return NextResponse.json({ monthly_revenue_goal })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/settings/goals]', error); console.error('[PUT /api/settings/goals]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
