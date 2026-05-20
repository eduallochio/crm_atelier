import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgFinancialSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULTS = {
  payment_methods: { dinheiro: true, pix: true, credito: true, debito: true, outros: true },
  cashier_requires_opening: true,
  cashier_opening_balance_required: false,
  expense_categories: [] as string[],
  income_categories: [] as string[],
}

export async function GET() {
  try {
    const user = await requireAuth()

    const result = await db
      .select()
      .from(orgFinancialSettings)
      .where(eq(orgFinancialSettings.organizationId, user.organizationId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        updated_at: new Date().toISOString(),
      })
    }

    const row = result[0]
    return NextResponse.json({
      ...row,
      payment_methods:    row.paymentMethodsJson  ?? DEFAULTS.payment_methods,
      expense_categories: row.expenseCategoriesJson ?? [],
      income_categories:  row.incomeCategoriesJson  ?? [],
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/settings/financial]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const values = {
      organizationId:              user.organizationId,
      paymentMethodsJson:          body.payment_methods      ?? DEFAULTS.payment_methods,
      lateFeePercentage:           body.late_fee_percentage  ?? null,
      interestRatePerMonth:        body.interest_rate_per_month ?? null,
      cashierRequiresOpening:      body.cashier_requires_opening !== false,
      cashierOpeningBalanceRequired: !!body.cashier_opening_balance_required,
      expenseCategoriesJson:       body.expense_categories   ?? [],
      incomeCategoriesJson:        body.income_categories    ?? [],
    }

    await db
      .insert(orgFinancialSettings)
      .values(values)
      .onConflictDoUpdate({
        target: orgFinancialSettings.organizationId,
        set: {
          paymentMethodsJson:          values.paymentMethodsJson,
          lateFeePercentage:           values.lateFeePercentage,
          interestRatePerMonth:        values.interestRatePerMonth,
          cashierRequiresOpening:      values.cashierRequiresOpening,
          cashierOpeningBalanceRequired: values.cashierOpeningBalanceRequired,
          expenseCategoriesJson:       values.expenseCategoriesJson,
          incomeCategoriesJson:        values.incomeCategoriesJson,
          updatedAt:                   new Date(),
        },
      })

    const result = await db
      .select()
      .from(orgFinancialSettings)
      .where(eq(orgFinancialSettings.organizationId, user.organizationId))
      .limit(1)

    const row = result[0]
    return NextResponse.json({
      ...row,
      payment_methods:    row.paymentMethodsJson  ?? DEFAULTS.payment_methods,
      expense_categories: row.expenseCategoriesJson ?? [],
      income_categories:  row.incomeCategoriesJson  ?? [],
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/financial]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
