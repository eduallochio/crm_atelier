import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'

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
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_financial_settings WHERE organization_id = @orgId`)

    if (result.recordset.length === 0) {
      return NextResponse.json({
        id: '',
        organization_id: user.organizationId,
        ...DEFAULTS,
        pix_key: '',
        show_pix_key_on_order: false,
        updated_at: new Date().toISOString(),
      })
    }

    const row = result.recordset[0]
    return NextResponse.json({
      ...row,
      payment_methods: JSON.parse(row.payment_methods_json || '{}'),
      expense_categories: JSON.parse(row.expense_categories_json || '[]'),
      income_categories: JSON.parse(row.income_categories_json || '[]'),
      pix_key: row.pix_key || '',
      show_pix_key_on_order: !!row.show_pix_key_on_order,
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
    const pool = await getPool()

    const paymentMethodsJson = JSON.stringify(body.payment_methods ?? DEFAULTS.payment_methods)
    const expenseCategoriesJson = JSON.stringify(body.expense_categories ?? [])
    const incomeCategoriesJson = JSON.stringify(body.income_categories ?? [])

    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('paymentMethodsJson', sql.NVarChar, paymentMethodsJson)
      .input('lateFee', sql.Decimal(5, 2), body.late_fee_percentage ?? null)
      .input('interestRate', sql.Decimal(5, 2), body.interest_rate_per_month ?? null)
      .input('cashierRequiresOpening', sql.Bit, body.cashier_requires_opening !== false ? 1 : 0)
      .input('cashierOpeningBalanceRequired', sql.Bit, body.cashier_opening_balance_required ? 1 : 0)
      .input('expenseCategoriesJson', sql.NVarChar, expenseCategoriesJson)
      .input('incomeCategoriesJson', sql.NVarChar, incomeCategoriesJson)
      .input('pixKey', sql.NVarChar, body.pix_key ?? null)
      .input('showPixKeyOnOrder', sql.Bit, body.show_pix_key_on_order ? 1 : 0)
      .query(`
        UPDATE org_financial_settings
        SET
          payment_methods_json = @paymentMethodsJson,
          late_fee_percentage = @lateFee,
          interest_rate_per_month = @interestRate,
          cashier_requires_opening = @cashierRequiresOpening,
          cashier_opening_balance_required = @cashierOpeningBalanceRequired,
          expense_categories_json = @expenseCategoriesJson,
          income_categories_json = @incomeCategoriesJson,
          pix_key = @pixKey,
          show_pix_key_on_order = @showPixKeyOnOrder,
          updated_at = GETDATE()
        WHERE organization_id = @orgId

        IF @@ROWCOUNT = 0
          INSERT INTO org_financial_settings (
            organization_id, payment_methods_json, late_fee_percentage, interest_rate_per_month,
            cashier_requires_opening, cashier_opening_balance_required,
            expense_categories_json, income_categories_json, pix_key, show_pix_key_on_order
          )
          VALUES (
            @orgId, @paymentMethodsJson, @lateFee, @interestRate,
            @cashierRequiresOpening, @cashierOpeningBalanceRequired,
            @expenseCategoriesJson, @incomeCategoriesJson, @pixKey, @showPixKeyOnOrder
          )
      `)

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`SELECT * FROM org_financial_settings WHERE organization_id = @orgId`)

    const row = result.recordset[0]
    return NextResponse.json({
      ...row,
      payment_methods: JSON.parse(row.payment_methods_json || '{}'),
      expense_categories: JSON.parse(row.expense_categories_json || '[]'),
      income_categories: JSON.parse(row.income_categories_json || '[]'),
      pix_key: row.pix_key || '',
      show_pix_key_on_order: !!row.show_pix_key_on_order,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[PUT /api/settings/financial]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
