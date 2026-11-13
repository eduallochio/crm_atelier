import { NextResponse } from 'next/server'
import { requireAuth, assertPermission } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function GET() {
  try {
    const user = await requireAuth()
    // Leitura também é permitida com a permissão de OS (não só "configuracoes")
    // — nome/telefone/logo da empresa são usados no PDF e na mensagem de
    // WhatsApp da ordem, mesmo por quem não administra Configurações.
    // Escrita (PUT abaixo) continua exigindo "configuracoes".
    if (!user.isOwner && !user.isMaster && user.permissions.configuracoes !== true && user.permissions.ordens_servico !== true) {
      throw new Error('FORBIDDEN')
    }

    const result = await db
      .select({
        id:        organizations.id,
        name:      organizations.name,
        slug:      organizations.slug,
        email:     organizations.email,
        phone:     organizations.phone,
        cnpj:      organizations.cnpj,
        address:   organizations.address,
        city:      organizations.city,
        state:     organizations.state,
        zipCode:   organizations.zipCode,
        website:   organizations.website,
        logoUrl:   organizations.logoUrl,
        instagram: organizations.instagram,
        facebook:  organizations.facebook,
        twitter:   organizations.twitter,
        tiktok:    organizations.tiktok,
        kwai:      organizations.kwai,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Só retorna os campos públicos da empresa (nome, contato, logo, redes) —
    // nunca dados de billing/plano (asaas_*, plan, subscription_*, cnpj é o
    // único dado "sensível" mantido por já constar no form de Configurações
    // para quem tem essa permissão; exclui-se o resto por não ser necessário
    // para PDF/WhatsApp nem para o form)
    const org = result[0]
    return NextResponse.json({
      id:              org.id,
      organization_id: org.id,
      name:            org.name,
      slug:            org.slug,
      email:           org.email,
      phone:           org.phone,
      cnpj:            org.cnpj,
      address:         org.address,
      city:            org.city,
      state:           org.state,
      zip_code:        org.zipCode ?? null,
      website:         org.website,
      logo_url:        org.logoUrl ?? null,
      instagram:       org.instagram,
      facebook:        org.facebook,
      twitter:         org.twitter,
      tiktok:          org.tiktok,
      kwai:            org.kwai,
      created_at:      org.createdAt,
      updated_at:      org.updatedAt,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[GET /api/settings/organization]', error); console.error('[GET /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    assertPermission(user, 'configuracoes')
    const body = await request.json()

    const updated = await db
      .update(organizations)
      .set({
        name:      body.name,
        email:     body.email     || null,
        phone:     body.phone     || null,
        cnpj:      body.cnpj      || null,
        address:   body.address   || null,
        city:      body.city      || null,
        state:     body.state     || null,
        zipCode:   body.zip_code  || null,
        website:   body.website   || null,
        logoUrl:   body.logo_url  || null,
        instagram: body.instagram || null,
        facebook:  body.facebook  || null,
        twitter:   body.twitter   || null,
        tiktok:    body.tiktok    || null,
        kwai:      body.kwai      || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, user.organizationId))
      .returning()

    const org = updated[0]
    return NextResponse.json({
      ...org,
      organization_id: org.id,
      zip_code: org.zipCode  ?? null,
      logo_url: org.logoUrl  ?? null,
    })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    logServerError('[PUT /api/settings/organization]', error); console.error('[PUT /api/settings/organization]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
