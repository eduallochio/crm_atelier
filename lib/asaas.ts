const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://api.asaas.com/v3'
const API_KEY  = process.env.ASAAS_API_KEY ?? ''

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': API_KEY,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas ${options.method ?? 'GET'} ${path} → ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY' | 'YEARLY'
  description: string
  status: string
  discount?: { value: number; type: 'FIXED' | 'PERCENTAGE' }
}

export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  billingType: string
  value: number
  netValue: number
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  dueDate: string
  paymentDate?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCodeId?: string
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createCustomer(data: {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const clean = cpfCnpj.replace(/\D/g, '')
  const res = await asaasFetch<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${clean}`)
  return res.data[0] ?? null
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode?: string
  addressNumber?: string
  phone?: string
  mobilePhone?: string
  // addressNumber é obrigatório pelo Asaas para assinaturas com cartão
}

export async function createSubscription(data: {
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY'
  description: string
  discount?: { value: number; type: 'FIXED' | 'PERCENTAGE' }
  externalReference?: string
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
  remoteIp?: string
  installmentCount?: number
  installmentValue?: number
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${id}`)
}

export async function cancelSubscription(id: string): Promise<void> {
  await asaasFetch(`/subscriptions/${id}`, { method: 'DELETE' })
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayment(id: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${id}`)
}

export async function getSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  const res = await asaasFetch<{ data: AsaasPayment[] }>(`/payments?subscription=${subscriptionId}`)
  return res.data
}

// ─── PIX QR Code ──────────────────────────────────────────────────────────────

export async function getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
  return asaasFetch(`/payments/${paymentId}/pixQrCode`)
}
