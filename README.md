<div align="center">

# Meu Atelier Sistema

**SaaS multi-tenant para gestão de ateliês de costura, personalização e artesanato.**

[meuateliersistema.com.br](https://meuateliersistema.com.br)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

Clientes, serviços, ordens de serviço, caixa, financeiro, estoque e assinaturas — tudo em um só sistema, pensado para quem costura e cuida do próprio negócio ao mesmo tempo. Modelo freemium com planos **Free**, **Pro** e **Enterprise**, cobrança recorrente via Asaas e um painel administrativo completo por trás.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Rodando localmente](#rodando-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Planos](#planos)
- [Scripts](#scripts)
- [Segurança](#segurança)

## Funcionalidades

### Operação do dia a dia
- **Clientes** — cadastro completo, busca de endereço via ViaCEP, histórico de ordens por cliente
- **Serviços** — catálogo com preço, receita de materiais (consumo automático de estoque na conclusão da OS)
- **Ordens de serviço** — fluxo completo (pendente → em andamento → concluída), numeração sequencial, pagamento parcial/integral, impressão térmica e PDF, embalagens
- **Caixa** — múltiplos caixas, sessões de abertura/fechamento com conferência de saldo, sangria/reforço, lançamento automático de pagamentos das OS
- **Financeiro** — contas a pagar/receber, categorias, fluxo de caixa, relatórios, conciliação
- **Estoque** — produtos, entradas/saídas, baixa automática por receita de serviço, alertas de estoque mínimo
- **Fornecedores** — cadastro e vínculo com entradas de estoque

### Negócio e crescimento
- **Assinaturas** — planos Free/Pro/Enterprise, cobrança recorrente via **Asaas** (cartão, Pix, boleto), bônus promocional na primeira assinatura, cupons de desconto
- **Campanhas de email** — reengajamento, uso baixo, bônus acabando e novidades de produto, com segmentos salvos e tracking de abertura/clique (Resend)
- **Tour guiado** e central de ajuda/manual dentro do produto
- **Multi-tenant real** — cada organização só enxerga seus próprios dados, isolado por Row Level Security no Postgres

### Painel administrativo (master)
Operação interna completa em `/admin`: organizações, usuários, assinaturas, faturamento, cupons, planos, feature flags, campanhas, analytics, saúde do sistema, logs e monitoramento de erros em produção — com impersonation segura (entrar como qualquer organização sem perder a sessão master).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions, `proxy.ts` como middleware) |
| UI | React 19 · TypeScript · Tailwind CSS v4 · [Shadcn UI](https://ui.shadcn.com) (Radix) |
| Formulários | React Hook Form + Zod |
| Dados no cliente | TanStack Query v5 |
| Banco | Supabase (PostgreSQL + Auth + RLS) via [Drizzle ORM](https://orm.drizzle.team) |
| Pagamentos | [Asaas](https://www.asaas.com) (assinaturas, Pix, boleto, cartão) |
| Email transacional | [Resend](https://resend.com) |
| Gráficos | Recharts + Tremor |
| Animações | GSAP |
| Outros | Zustand · react-joyride (tour) · jsPDF · xlsx · qrcode |

## Arquitetura

- **Multi-tenant por `organization_id`**, com Row Level Security ativo nas ~47 tabelas do banco
- Ao criar a conta, um trigger no Postgres (`handle_new_user`) cria automaticamente a organização, o profile do dono, as métricas de uso e as configurações iniciais
- Usuário **master** (`app_metadata.is_master`) acessa o painel `/admin`, protegido por `proxy.ts`
- Planos e limites (clientes, serviços, ordens, usuários) configuráveis pelo admin, aplicados via `lib/plan-limits.ts`

```
Cliente → Next.js (Vercel) → Drizzle ORM → Supabase Postgres (RLS)
                           → Supabase Auth
                           → Asaas (cobranças)
                           → Resend (emails)
```

## Rodando localmente

### Pré-requisitos
- Node.js 20+
- Um projeto no [Supabase](https://supabase.com)
- (Opcional, para testar cobrança/email de verdade) contas no [Asaas](https://www.asaas.com) e [Resend](https://resend.com)

### 1. Clone e instale

```bash
git clone https://github.com/eduallochio/crm_atelier.git
cd crm_atelier
npm install
```

### 2. Configure o `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Banco (Drizzle — usado em migrations/scripts locais)
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Asaas (cobrança — opcional em dev)
ASAAS_API_KEY=
ASAAS_BASE_URL=
ASAAS_WEBHOOK_TOKEN=

# Resend (email transacional — opcional em dev)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=

# Telegram (notificações internas — opcional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Cron / endpoints internos
CRON_SECRET=
INTERNAL_ERROR_TOKEN=
SETUP_SECRET=
```

### 3. Rode as migrations e crie o usuário master

```bash
npx drizzle-kit push      # aplica o schema no banco
npm run setup:master      # cria o primeiro usuário com acesso ao /admin
```

### 4. Suba o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do projeto

```
app/
  (auth)/           login, cadastro — Server Actions
  (dashboard)/      clientes, serviços, ordens de serviço, financeiro,
                     estoque, fornecedores, configurações, ajuda
  admin/            painel master (organizações, billing, campanhas, logs...)
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

## Scripts

```bash
npm run dev            # servidor de desenvolvimento
npm run build           # build de produção
npm run start            # servidor de produção
npm run lint               # ESLint
npm run setup:master       # cria o usuário master inicial
npm run seed:demo          # popula dados de demonstração
npm run screenshots        # gera screenshots do manual (Playwright)
```

## Segurança

- Row Level Security ativo em todas as tabelas, isolando os dados por organização
- Validação de entrada com Zod em todas as rotas de API
- Sessão de impersonation (admin "entrando como" uma organização) usa cookie separado da sessão master
- Páginas de conformidade com a LGPD: `/meus-dados`, `/lgpd`, `/termos`, `/privacidade`

## Licença

Projeto proprietário — código fechado, uso restrito ao time do Meu Atelier Sistema.

---

<div align="center">

Feito por **Eduardo Allochio** — [GitHub](https://github.com/eduallochio)

</div>
