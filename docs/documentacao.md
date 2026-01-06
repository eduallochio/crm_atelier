# 📘 Especificação Técnica: CRM Atelier (SaaS Multi-tenant)

## 1. Visão Geral do Produto
O projeto é um sistema de gestão (CRM) para ateliês de costura ou artesanato. A arquitetura é **Multi-tenant**, o que significa que uma única instalação do software serve várias empresas (organizações), mantendo os dados de cada uma estritamente isolados.

### Modelo de Negócio
- **Freemium:** Possui planos "Free" e "Enterprise".
- **Limites do Plano Grátis:**
  - Máximo de 50 clientes.
  - Máximo de 1 utilizador (apenas o dono).

---

## 2. Arquitetura de Dados (Backend & Base de Dados)

O sistema baseia-se num relacionamento forte entre utilizadores e organizações.

### Entidades Principais (Tabelas)

#### 🏢 `organizations` (O Tenant)
Representa a empresa/ateliê que está a usar o sistema.
- **Campos:** `id`, `name`, `slug` (url amigável), `plan` (free/enterprise), `stripe_customer_id` (pagamentos), `subscription_status`.
- **Regra:** Criada automaticamente quando um utilizador se regista.

#### 👤 `profiles` (Utilizadores)
Os utilizadores do sistema.
- **Campos:** `id` (vínculo com autenticação), `email`, `full_name`, `role` (papel), `is_owner` (se é o dono), `organization_id`.
- **Regra:** Todo perfil pertence a uma `organization_id`.

#### 👥 `org_clients` (Clientes do Ateliê)
Os clientes finais do ateliê.
- **Campos:** `nome`, `telefone`, `email`, `endereco`, `data_cadastro`.
- **Segurança:** Isolado por `organization_id`.

#### ✂️ `org_services` (Catálogo de Serviços)
Lista de serviços prestados (ex: "Bainha", "Ajuste").
- **Campos:** `nome`, `tipo`, `valor`, `descricao`.
- **Segurança:** Isolado por `organization_id`.

#### 📄 `org_service_orders` (Ordens de Serviço - OS)
O coração do sistema. Regista o trabalho a ser feito.
- **Campos:** `client_id` (quem pediu), `status` (pendente, etc.), `valor_total`, `data_abertura`, `data_prevista`, `data_conclusao`, `observacoes`.
- **Relacionamento:** Liga-se a `org_clients` e `organizations`.

#### 🎨 `customization_settings` (White-label)
Permite que o ateliê personalize a aparência.
- **Campos:** `primary_color`, `logo_url`, `atelier_name`.

#### 📊 `usage_metrics` (Controle de Limites)
Tabela auxiliar para contar o uso sem ter que fazer queries pesadas a toda a hora.
- **Campos:** `clients_count`, `orders_count`, `users_count`.

---

## 3. Regras de Negócio Críticas

### 3.1. Isolamento de Dados (Row Level Security)
Esta é a regra mais importante. Se reescreveres o backend, **tens de garantir isto**:
- Um utilizador **SÓ** pode ver dados (clientes, ordens, métricas) onde o `organization_id` da tabela for igual ao `organization_id` do perfil dele.

### 3.2. Fluxo de Cadastro (Onboarding)
Quando um novo utilizador cria conta no sistema de Autenticação:
1. Uma nova `organization` é criada automaticamente (Nome: "Minha Empresa").
2. Um `profile` é criado e vinculado a essa organização como `owner` (dono).
3. Uma entrada na tabela `usage_metrics` é inicializada.

### 3.3. Verificação de Limites (`check_plan_limits`)
Antes de criar um registo, o sistema verifica:
- Se o plano for 'enterprise' -> Permite tudo.
- Se o plano for 'free':
  - Se for criar cliente: Verifica se `clients_count < 50`.
  - Se for convidar utilizador: Verifica se `users_count < 1`.

---

## 4. Estrutura do Frontend (Navegação)

O sistema está organizado nas seguintes rotas/módulos:

1.  **Dashboard (`/dashboard`):** Visão geral, gráficos e métricas rápidas.
2.  **Clientes (`/clientes`):** Listagem, cadastro e edição de clientes.
3.  **Serviços (`/servicos`):** Catálogo de preços e tipos de serviços.
4.  **Ordens de Serviço (`/ordens-servico`):** Gestão do fluxo de trabalho (Criar OS, mudar status).
5.  **Financeiro (`/financeiro`):** Contas a receber/pagar (provável).
6.  **Caixa (`/caixa`):** Controle de fluxo de caixa diário.
7.  **Perfil (`/profile`):** Configurações do utilizador e dados do ateliê.

### UI/UX Atual
- **Design System:** Baseado em Shadcn UI (limpo, moderno, minimalista).
- **Sidebar:** Navegação lateral colapsável.
- **Responsividade:** Menu adaptável para mobile.

---

## 5. Stack Tecnológica Atual (Para Referência)

Se quiseres manter o padrão ou saber o que substituir:

- **Linguagem:** TypeScript.
- **Framework Frontend:** React (com Vite).
- **Estilização:** Tailwind CSS + Shadcn UI.
- **Estado/Data Fetching:** React Query (TanStack Query).
- **Formulários:** React Hook Form + Zod (validação).
- **Backend/Auth/DB:** Supabase (PostgreSQL).
- **Ícones:** Lucide React.
- **Gráficos:** Recharts.