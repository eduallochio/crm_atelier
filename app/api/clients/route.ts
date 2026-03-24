import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getPool, sql } from '@/lib/db'
import { getPlanLimits, limitExceededResponse } from '@/lib/plan-limits'

export async function GET() {
  try {
    const user = await requireAuth()
    const pool = await getPool()

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        SELECT * FROM org_clients
        WHERE organization_id = @orgId
        ORDER BY created_at DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const pool = await getPool()

    // Verificar limite do plano (usa contador cumulativo — exclusões não resetam o limite)
    const [limitResult, limits] = await Promise.all([
      pool.request()
        .input('orgId', sql.UniqueIdentifier, user.organizationId)
        .query(`
          SELECT o.[plan], ISNULL(m.total_clients_ever, 0) AS total_clients_ever
          FROM organizations o
          LEFT JOIN usage_metrics m ON m.organization_id = o.id
          WHERE o.id = @orgId
        `),
      getPlanLimits(),
    ])

    const planRow = limitResult.recordset[0]
    if (planRow?.plan === 'free' && planRow?.total_clients_ever >= limits.max_clients_free) {
      return NextResponse.json(
        limitExceededResponse('clientes', limits.max_clients_free),
        { status: 403 }
      )
    }

    const result = await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .input('nome', sql.NVarChar, body.nome)
      .input('telefone', sql.NVarChar, body.telefone || null)
      .input('email', sql.NVarChar, body.email || null)
      .input('dataNasc', sql.NVarChar, body.data_nascimento || null)
      .input('observacoes', sql.NVarChar, body.observacoes || null)
      .input('cep', sql.NVarChar, body.cep || null)
      .input('logradouro', sql.NVarChar, body.logradouro || null)
      .input('numEnd', sql.NVarChar, body.numero || null)
      .input('complemento', sql.NVarChar, body.complemento || null)
      .input('bairro', sql.NVarChar, body.bairro || null)
      .input('cidade', sql.NVarChar, body.cidade || null)
      .input('estado', sql.NVarChar, body.estado || null)
      .query(`
        INSERT INTO org_clients (
          organization_id, nome, telefone, email, data_nascimento, observacoes,
          cep, logradouro, numero, complemento, bairro, cidade, estado
        )
        OUTPUT INSERTED.*
        VALUES (
          @orgId, @nome, @telefone, @email,
          CAST(NULLIF(@dataNasc, '') AS DATE),
          @observacoes, @cep, @logradouro, @numEnd, @complemento, @bairro, @cidade, @estado
        )
      `)

    // Atualizar métricas
    await pool
      .request()
      .input('orgId', sql.UniqueIdentifier, user.organizationId)
      .query(`
        UPDATE usage_metrics
        SET clients_count = clients_count + 1,
            total_clients_ever = total_clients_ever + 1,
            updated_at = GETDATE()
        WHERE organization_id = @orgId
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/clients]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
