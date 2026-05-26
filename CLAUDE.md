# CRM Atelier — Contexto do Projeto

SaaS multi-tenant para gestão de ateliês de costura/artesanato.
URL produção: https://meuateliersistema.com.br

---

## Stack Técnica

- **Next.js 16** — App Router, `proxy.ts` como middleware (não `middleware.ts`)
- **React 19**
- **TypeScript**
- **Supabase** — Auth + PostgreSQL + RLS (`@supabase/ssr`, `@supabase/supabase-js`)
- **Drizzle ORM** — acesso ao banco via `lib/db/index.ts`, schema em `lib/db/schema.ts`
- **TanStack Query v5** — cache e state management async
- **Tailwind CSS v4** — via `@tailwindcss/postcss`
- **Shadcn UI** — Radix UI primitives
- **React Hook Form + Zod** — formulários e validação
- **Sonner** — toasts de feedback
- **date-fns** — manipulação de datas
- **lucide-react** — ícones
- **jspdf + jspdf-autotable** — exportação PDF
- **xlsx** — exportação Excel

---

## Arquitetura Multi-Tenant

- Cada usuário cria uma **organization** ao se cadastrar
- Trigger `handle_new_user` no Supabase cria automaticamente: `organization` + `profile` + `usage_metrics` + `customization_settings`
- **RLS ativo** em todas as 35 tabelas — dados isolados por `organization_id`
- Planos: `free`, `pro`, `enterprise` — limites em `usage_metrics` + `adminSystemSettings`
- Usuário master tem `app_metadata.is_master = true` no Supabase Auth

---

## Estrutura de Pastas

```
app/
  (auth)/           → login, cadastro, actions.ts (Server Actions)
  (dashboard)/      → clientes, servicos, ordens-servico, financeiro, estoque, fornecedores, configuracoes, profile
  admin/            → painel master (requer is_master)
  api/              → route handlers (Drizzle ORM)
  page.tsx          → Landing page
components/
  ui/               → Shadcn UI
  layouts/          → sidebar.tsx, header.tsx, top-bar.tsx
  dashboard/        → componentes do dashboard
  forms/            → formulários (dialogs)
  admin/            → componentes do painel admin
  inventory/        → componentes de estoque
  providers.tsx     → QueryClient + ThemeProvider
hooks/              → React Query hooks por módulo
lib/
  db/               → index.ts (Drizzle singleton), schema.ts (35 tabelas)
  supabase/         → client.ts, server.ts, middleware.ts, viacep.ts
  auth/             → session.ts (requireAuth, requireMaster, getSessionUser)
  validations/      → schemas Zod
  plan-limits.ts    → limites por plano, licenças vitalícias
  admin-log.ts      → log de ações admin
  log-error.ts      → log de erros do servidor
types/              → database.types.ts, settings.ts, audit.ts
supabase/migrations/ → 3 arquivos SQL (triggers, RLS, seeds)
proxy.ts            → middleware Next.js (exporta `export default async function proxy`)
```

---

## Padrões de Código

### API Routes

```typescript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orgClients } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()
    const rows = await db.select().from(orgClients)
      .where(eq(orgClients.organizationId, user.organizationId))
      .orderBy(desc(orgClients.createdAt))
    return NextResponse.json(rows)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    console.error('[GET /api/context]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

### UPSERT para settings (PostgreSQL)

```typescript
await db.insert(table).values({...}).onConflictDoUpdate({
  target: table.organizationId,
  set: { field: value, updatedAt: new Date() }
})
```

### Hooks React Query

```typescript
// Leitura
export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: () => fetch('/api/clients').then(r => r.json()) })
}

// Escrita
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => fetch('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente criado!')
    },
    onError: () => toast.error('Erro ao criar cliente'),
  })
}
```

### Formulários (RHF + Zod)

```typescript
const form = useForm<FormData>({ resolver: zodResolver(schema) })
form.handleSubmit(onSubmit, (errors) => {
  // errors contém os campos com erro — usar para feedback visual
})
```

---

## Banco de Dados

### Campos importantes por tabela

- `orgCashierSessions`: `caixaId` (não cashierId), `usuarioAberturaId`, `saldoInicial`, `saldoReal`
- `orgCashierMovements`: `sessaoId` (não sessionId), `metodoPagamentoId`, `referenciaId`, `referenciaTipo`
- `orgProducts`: `precoCusto` (não preco), `quantidadeAtual`/`quantidadeMinima` são numeric → sempre `Number()`
- `orgStockEntries`: `supplierId` (não fornecedorId)
- `profiles`: sem `avatarUrl`, sem `updatedAt`
- `orgFinancialSettings`: `paymentMethodsJson`, `expenseCategoriesJson`, `incomeCategoriesJson` são jsonb

### Drizzle config

- `drizzle.config.ts` lê `DATABASE_URL` do `.env` (não `.env.local`)
- `.env` contém apenas `DATABASE_URL` porta 5432 (conexão direta)
- `.env.local` contém todas as variáveis de ambiente do projeto

### Admin com Supabase Admin API

```typescript
import { createClient as createServiceClient } from '@supabase/supabase-js'
const adminSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## Autenticação

- `lib/auth/session.ts` → `requireAuth()`, `requireMaster()`, `getSessionUser()`
- `requireAuth()` → lança `'UNAUTHORIZED'` se não logado
- `requireMaster()` → lança `'FORBIDDEN'` se não for master (`app_metadata.is_master !== true`)
- `organizationId` vem da tabela `profiles` (não do user_metadata)
- `isMaster` vem de `user.app_metadata.is_master`

---

## Regras de Negócio

### Planos e Limites

| Recurso | Free | Pro |
|---------|------|-----|
| Clientes | 50 | ilimitado |
| Serviços | 20 | ilimitado |
| Ordens de Serviço | 100 | ilimitado |
| Usuários | 2 | 3 |

- Limites configuráveis pelo admin em `/admin/settings` → persistidos em `adminSystemSettings`
- Lidos via `lib/plan-limits.ts` → `getPlanLimits()` com cache de 60s

### Licenças Vitalícias

Definidas em `lib/plan-limits.ts` — CNPJs hardcoded com acesso enterprise permanente sem mensalidade:

```typescript
const LIFETIME_CNPJS = new Set([
  '33065719000160',
  '27791182000112',
])
```

**NUNCA remover esses CNPJs.**

### Estoque e Financeiro

- Módulos de estoque e financeiro são exclusivos do plano Pro+
- Plano Free recebe `<UpgradePrompt>` nesses módulos

### Numeração de Ordens de Serviço

- Campo `numero` na tabela `orgServiceOrders`
- Preview de OS antes de salvar mostra `#PRÉVIA` (não um número real)
- Números reais são formatados como `#000001` (6 dígitos com zeros)

---

## Armadilhas Conhecidas (Gotchas)

### Drizzle `numeric` retorna string

Campos `numeric`/`decimal` no PostgreSQL chegam como `string` pelo Drizzle. **Sempre converter:**

```typescript
// ERRADO — concatena string em vez de somar
const total = items.reduce((sum, i) => sum + (i.valor || 0), 0)

// CORRETO
const total = items.reduce((sum, i) => sum + (Number(i.valor) || 0), 0)
```

Campos afetados: `valor`, `precoCusto`, `quantidadeAtual`, `quantidadeMinima`, `saldoInicial`, etc.

### Datas nulas

**Nunca** fazer `format(new Date(nullableDate), ...)` sem guard:

```typescript
// ERRADO — lança RangeError: Invalid time value
format(new Date(client.data_nascimento), 'dd/MM/yyyy')

// CORRETO
client.data_nascimento ? format(new Date(client.data_nascimento), 'dd/MM/yyyy') : '—'
```

### NEXT_REDIRECT no ErrorBoundary

`NEXT_REDIRECT` e `NEXT_NOT_FOUND` são exceções internas do Next.js lançadas por `redirect()` e `notFound()`. O `ErrorBoundary` em `components/error-boundary.tsx` já as ignora checando `error.message.startsWith('NEXT_')`. **Não logar esses erros.**

### Middleware é `proxy.ts`

O arquivo de middleware do Next.js neste projeto se chama `proxy.ts` (não `middleware.ts`) e exporta `export default async function proxy`. Isso é intencional.

### Formulários: campos controlados vs não-controlados

Ao usar React Hook Form, sempre inicializar com valores padrão para evitar o warning "changing uncontrolled input to controlled":

```typescript
const form = useForm({ defaultValues: { campo: '', valor: 0 } })
```

---

## Design System

### Cards de Estatísticas (padrão atual)

Todos os cards de stats usam o padrão gradiente+glow:

```tsx
<div className="relative bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
  <div className="absolute inset-0 bg-{color}-500 opacity-[0.07] dark:opacity-[0.12] pointer-events-none" />
  <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-{color}-500 opacity-20 blur-2xl pointer-events-none" />
  <div className="p-5 pt-6">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="p-2 rounded-xl bg-{color}-500 shadow-sm">
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-{color}-600 dark:text-{color}-400">{value}</p>
  </div>
</div>
```

---

## O que NUNCA fazer

- **Nunca commitar `.env.vercel`** — contém segredos de produção, está no `.gitignore`
- **Nunca commitar a pasta `supabase/`** — migrations já foram aplicadas em produção
- **Nunca remover os CNPJs lifetime** de `lib/plan-limits.ts`
- **Nunca usar `--no-verify`** no git commit
- **Nunca fazer push automático** — Eduardo faz o push manualmente
- **Nunca usar `git reset --hard`** sem confirmar com o usuário
- **Nunca fazer `force push` para main**
- **Nunca usar `grep` ou `find` via Bash** — usar as ferramentas Grep e Glob nativas

---

## Sistema de Erros

- Erros do frontend são capturados por `components/error-boundary.tsx` e enviados via POST para `/api/admin/errors`
- Erros do servidor são logados via `lib/log-error.ts` → `logServerError(context, error)`
- Tabela: `admin_error_logs` (sem RLS, acessível só via service role)
- Tela admin: `/admin/errors` — lista, filtra, marca como resolvido
- Use `/fix-errors` para buscar erros não resolvidos e corrigi-los
