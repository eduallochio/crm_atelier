# 🎨 CRM Atelier

Sistema de gerenciamento completo para ateliês de costura, personalização e artesanato. Solução multi-tenant SaaS com modelo freemium.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação Completa**
  - Login e cadastro com validação
  - Proteção de rotas com middleware
  - Visualização de senha (toggle)
  - Integração com Supabase Auth

- **Dashboard Inteligente**
  - Métricas em tempo real
  - Sidebar responsiva com menu mobile
  - Contador de clientes e limite de plano
  - Design moderno e profissional

- **Módulo de Clientes** 🎯
  - CRUD completo (criar, listar, editar, deletar)
  - Busca por nome, email e telefone
  - Integração com API ViaCEP para busca automática de endereço
  - Campos estruturados: CEP, logradouro, número, complemento, bairro, cidade, estado
  - Validação de limites (50 clientes no plano Free)
  - Confirmação de exclusão
  - Formatação automática de dados

- **Arquitetura Multi-Tenant**
  - Isolamento completo por organização
  - Row Level Security (RLS) no PostgreSQL
  - Triggers automáticos para criação de recursos
  - Controle de limites por plano

### 🔜 Em Desenvolvimento
- Módulo de Serviços (catálogo com preços)
- Módulo de Ordens de Serviço (workflow completo)
- Gestão Financeira (contas a pagar/receber)
- Controle de Caixa (fluxo de entrada/saída)
- Perfil e Configurações do Usuário
- White-label (personalização visual por organização)
- Integração Stripe (pagamentos e assinaturas)

## 🛠️ Tecnologias

### Frontend
- **Next.js 16** - React framework com App Router e Server Actions
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização moderna e responsiva
- **Shadcn UI** - Componentes acessíveis (Radix UI)
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **TanStack Query v5** - Cache e sincronização de dados
- **Lucide React** - Biblioteca de ícones
- **Sonner** - Notificações toast

### Backend
- **Supabase**
  - PostgreSQL (banco de dados)
  - Authentication (auth integrado)
  - Row Level Security (segurança)
  - Realtime subscriptions (futuro)
  - Storage (futuro)

### Integrações
- **ViaCEP** - Busca automática de endereços por CEP
- **Stripe** - Pagamentos (configurado)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/eduallochio/crm_atelier.git
cd crm_atelier
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 4. Configure o banco de dados
Execute os scripts SQL no Supabase (SQL Editor) na seguinte ordem:

1. `supabase/schema.sql` - Schema completo
2. `supabase/fix-trigger.sql` - Triggers melhorados
3. `supabase/fix-rls-insert.sql` - Políticas RLS
4. `supabase/update-clients-address.sql` - Campos de endereço

### 5. Configure autenticação no Supabase
No Supabase Dashboard → Authentication → Settings:
- **Desabilite** "Enable email confirmations" (para desenvolvimento)
- Ou configure SMTP para produção

### 6. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
crm_atelier/
├── app/
│   ├── (auth)/              # Rotas de autenticação
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── actions.ts       # Server actions
│   ├── (dashboard)/         # Rotas protegidas
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── servicos/
│   │   ├── ordens-servico/
│   │   ├── financeiro/
│   │   ├── caixa/
│   │   └── profile/
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Componentes Shadcn UI
│   ├── layouts/             # Header, Sidebar
│   ├── dashboard/           # Componentes do dashboard
│   └── forms/               # Formulários
├── lib/
│   ├── supabase/            # Cliente Supabase
│   ├── validations/         # Schemas Zod
│   ├── services/            # Serviços externos (ViaCEP)
│   └── utils.ts             # Utilitários
├── hooks/                   # Hooks personalizados (React Query)
├── types/                   # Tipos TypeScript
├── supabase/                # Scripts SQL
└── docs/                    # Documentação
```

## 🎯 Planos e Limites

| Recurso           | Free  | Enterprise |
|-------------------|-------|------------|
| Clientes          | 50    | Ilimitado  |
| Usuários          | 1     | Ilimitado  |
| Serviços          | 20    | Ilimitado  |
| Ordens de Serviço | 100   | Ilimitado  |
| Suporte           | Email | Prioritário|
| White-label       | ❌     | ✅          |

## 🔐 Segurança

- Row Level Security (RLS) ativo em todas as tabelas
- Autenticação via Supabase Auth
- Isolamento completo por organização
- Validação de inputs com Zod
- Server Actions para mutações
- HTTPS obrigatório em produção

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas
- Netlify
- Railway
- Render
- Self-hosted

## 📝 Scripts

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linter ESLint
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Eduardo Allochio**
- GitHub: [@eduallochio](https://github.com/eduallochio)
- Email: eduallochio2@outlook.com

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Shadcn UI](https://ui.shadcn.com)
- [ViaCEP](https://viacep.com.br)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
