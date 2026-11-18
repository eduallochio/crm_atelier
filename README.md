# Meu Atelier Sistema

SaaS multi-tenant para gestão de ateliês de costura, personalização e artesanato — clientes, serviços, ordens de serviço, caixa, financeiro, estoque e assinaturas em um só lugar.

**Produção:** [meuateliersistema.com.br](https://meuateliersistema.com.br)
**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) · Drizzle ORM · Tailwind v4 · Shadcn UI

## O que o sistema faz

### Para o ateliê (cliente final)
- **Clientes** — cadastro, busca de endereço via ViaCEP, histórico de ordens
- **Serviços** — catálogo com preço e receita de materiais (consome estoque automaticamente ao concluir a OS)
- **Ordens de serviço** — pendente → em andamento → concluída, numeração sequencial, pagamento parcial/integral, impressão térmica, PDF, embalagens
- **Caixa** — múltiplos caixas, sessões de abertura/fechamento com conferência de saldo, sangria/reforço
- **Financeiro** — contas a pagar/receber, categorias, fluxo de caixa, conciliação
- **Estoque** — produtos, entradas/saídas, baixa automática, alertas de estoque mínimo
- **Fornecedores** — cadastro vinculado às entradas de estoque
- **Assinatura** — planos Free, Pro e Enterprise, cobrança recorrente via Asaas (cartão, Pix, boleto), bônus na primeira assinatura, cupons

### Painel master (`/admin`)
Operação interna do SaaS: organizações, usuários, assinaturas, faturamento, cupons, planos, feature flags, campanhas de email (reengajamento, uso baixo, bônus acabando, novidades — com segmentos salvos e tracking via Resend), analytics, saúde do sistema, logs e erros em produção. Inclui impersonation ("entrar como" qualquer organização sem perder a sessão master, via cookie separado).

## Arquitetura

- **Multi-tenant por `organization_id`**, com Row Level Security em todas as ~47 tabelas do banco — cada organização só enxerga seus próprios dados
- Signup cria a organização via trigger no Postgres (`handle_new_user`): organization + profile do dono + métricas de uso + configurações iniciais, tudo numa transação
- Usuário **master** (`app_metadata.is_master`) acessa `/admin`, protegido por `proxy.ts` (o middleware do projeto — não `middleware.ts`)
- Planos e limites (clientes, serviços, ordens, usuários) configuráveis em `/admin/settings`, lidos via `lib/plan-limits.ts`

```
Navegador → Next.js (Vercel) → Drizzle ORM → Supabase Postgres (RLS)
                              → Supabase Auth
                              → Asaas      (assinaturas, Pix, boleto, cartão)
                              → Resend     (email transacional + campanhas)
                              → Telegram   (notificações internas)
```

## Onde cada coisa vive

| | |
|---|---|
| Deploy | Vercel, deploy automático a cada push na `main` |
| Banco | Supabase (projeto `seuatelier`) — Postgres com RLS, acesso via Drizzle |
| Variáveis de ambiente | `.env.local` localmente; painel da Vercel em produção |
| Migrations | `lib/db/schema.ts` é a fonte da verdade → `npx drizzle-kit push` aplica no banco |
| Erros de produção | capturados em `admin_error_logs`, visíveis em `/admin/errors` |

Não há `.env.example` neste repo — as credenciais reais (Supabase, Asaas, Resend, Telegram) são compartilhadas fora do Git. Variáveis usadas pelo projeto: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`, `INTERNAL_ERROR_TOKEN`, `SETUP_SECRET`.

## Rodando localmente

```bash
npm install
npm run dev
```

Precisa do `.env.local` preenchido (ver variáveis acima) e do schema já aplicado no banco (`npx drizzle-kit push`, se for um banco novo). `npm run setup:master` cria o primeiro usuário com acesso ao `/admin`; `npm run seed:demo` popula dados de teste.

```bash
npm run build          # build de produção
npm run start           # roda o build
npm run lint              # ESLint
npm run screenshots         # screenshots do manual (Playwright)
```

## Estrutura de pastas

```
app/
  (auth)/           login, cadastro — Server Actions
  (dashboard)/      clientes, serviços, ordens de serviço, financeiro,
                     estoque, fornecedores, configurações, ajuda
  admin/            painel master
  api/              route handlers (Drizzle ORM)
  auth/callback/    callback OAuth (login com Google)
components/
  ui/               Shadcn UI
  layouts/          sidebar, header, dashboard shell
  dashboard/ financeiro/ admin/ forms/ inventory/ ...
lib/
  db/               client Drizzle + schema.ts (~47 tabelas)
  auth/             requireAuth, requireMaster, sessão
  campaigns/        critérios e disparo das campanhas de email
  email/            templates e envio via Resend
  financial/        regras de negócio do módulo financeiro
  asaas.ts          integração com a API do Asaas
  plan-limits.ts    limites por plano e licenças vitalícias
  validations/      schemas Zod
hooks/              hooks React Query por módulo
proxy.ts            middleware Next.js (auth, impersonation, redirects)
```

Convenções de código, gotchas conhecidos e padrões do projeto estão em [CLAUDE.md](CLAUDE.md).

## Planos

| Recurso | Free | Pro | Enterprise |
|---|---|---|---|
| Clientes | 50 | Ilimitado | Ilimitado |
| Serviços | 20 | Ilimitado | Ilimitado |
| Ordens de serviço | 100 | Ilimitado | Ilimitado |
| Usuários | 2 | 3 | Ilimitado |
| Caixa e Financeiro | — | ✅ | ✅ |
| Estoque | — | ✅ | ✅ |

Limites configuráveis pelo admin em `/admin/settings`.

## Segurança e conformidade

- RLS ativo em todas as tabelas, validação de entrada com Zod em todas as rotas de API
- LGPD: `/meus-dados`, `/lgpd`, `/termos`, `/privacidade`

---

Projeto proprietário — código fechado, uso restrito ao time do Meu Atelier Sistema.
