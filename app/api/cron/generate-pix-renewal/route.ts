import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, plans } from '@/lib/db/schema'
import { and, eq, lte } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'
import { validateCronSecret } from '@/lib/cron-auth'
import { createPayment, getCustomerPayments, getPixQrCode } from '@/lib/asaas'
import { sendPixAguardando } from '@/lib/email'
import { format } from 'date-fns'

const LEAD_DAYS = 3

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// GET — chamado pelo Vercel Cron (diário). Gera a cobrança PIX avulsa do
// próximo ciclo para organizações que pagam via PIX (sem subscription real
// no Asaas — ver app/api/checkout/asaas e app/api/webhooks/asaas) cujo
// vencimento está a LEAD_DAYS dias ou menos.
export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      logServerError('[cron/generate-pix-renewal]', new Error('CRON_SECRET não configurado'))
      return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
    }
    if (!validateCronSecret(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cutoff = toDateStr(addDays(new Date(), LEAD_DAYS))

    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        plan: organizations.plan,
        asaasCustomerId: organizations.asaasCustomerId,
        asaasCycle: organizations.asaasCycle,
        subscriptionNextDueDate: organizations.subscriptionNextDueDate,
      })
      .from(organizations)
      .where(and(
        eq(organizations.asaasBillingType, 'PIX'),
        eq(organizations.subscriptionStatus, 'active'),
        lte(organizations.subscriptionNextDueDate, cutoff),
      ))

    let generated = 0

    for (const org of orgs) {
      if (!org.asaasCustomerId || !org.subscriptionNextDueDate) continue

      try {
        // Evita gerar a cobrança duplicada em execuções seguintes do cron
        // enquanto a deste ciclo ainda está PENDING (ela só some daqui —
        // vira RECEIVED/CONFIRMED — quando o webhook confirma e avança
        // subscriptionNextDueDate para o ciclo seguinte)
        const existingPayments = await getCustomerPayments(org.asaasCustomerId)
        const alreadyPending = existingPayments.some(
          p => p.status === 'PENDING' && p.dueDate === org.subscriptionNextDueDate
        )
        if (alreadyPending) continue

        const [planRow] = await db
          .select({ price: plans.price, priceAnnual: plans.priceAnnual })
          .from(plans)
          .where(eq(plans.slug, org.plan))
          .limit(1)
        if (!planRow) {
          logServerError('[cron/generate-pix-renewal] plano inválido', new Error(`org ${org.id} plan=${org.plan}`), { orgId: org.id }, org.id)
          continue
        }
        const monthlyPrice = parseFloat(planRow.price)
        const annualPrice1x = parseFloat(planRow.priceAnnual ?? '0') || monthlyPrice * 10
        const basePrice = org.asaasCycle === 'YEARLY' ? annualPrice1x : monthlyPrice

        const payment = await createPayment({
          customer: org.asaasCustomerId,
          billingType: 'PIX',
          value: basePrice,
          dueDate: org.subscriptionNextDueDate,
          description: `Meu Atelier Sistema — Plano ${org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} (${org.asaasCycle === 'YEARLY' ? 'Anual' : 'Mensal'})`,
          externalReference: org.id,
        })

        let pixQrCode: { encodedImage: string; payload: string; expirationDate: string } | null = null
        try {
          pixQrCode = await getPixQrCode(payment.id)
        } catch {
          // QR code opcional — não bloqueia a geração da cobrança
        }

        if (org.email && pixQrCode) {
          const validade = pixQrCode.expirationDate
            ? format(new Date(pixQrCode.expirationDate), "dd/MM/yyyy 'às' HH:mm")
            : '24 horas'
          await sendPixAguardando({
            to: org.email,
            valor: `R$ ${basePrice.toFixed(2).replace('.', ',')}`,
            validade,
            urlPagamento: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br'}/configuracoes?tab=assinatura`,
            pixCopiaCola: pixQrCode.payload,
            qrCodeBase64: pixQrCode.encodedImage,
          }).catch(err => logServerError('[cron/generate-pix-renewal] email', err, { orgId: org.id }, org.id))
        }

        generated++
      } catch (err) {
        logServerError('[cron/generate-pix-renewal] gerar cobrança', err, { orgId: org.id }, org.id)
      }
    }

    return NextResponse.json({ generated })
  } catch (error) {
    logServerError('[GET /api/cron/generate-pix-renewal]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
