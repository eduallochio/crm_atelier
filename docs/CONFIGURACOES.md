# Sistema de Configurações - CRM Atelier

## 📋 Visão Geral

Implementamos um sistema completo e robusto de configurações para o CRM Atelier, permitindo aos usuários personalizar diversos aspectos do sistema através de uma interface intuitiva com abas organizadas.

## 🎯 Funcionalidades Implementadas

### 1. **Configurações da Empresa** 📊
- **Informações Básicas:**
  - Nome da empresa
  - CNPJ / CPF
  - E-mail e Telefone
  - Endereço completo (Rua, Cidade, Estado, CEP)
  - Website

- **🔍 Busca Automática de CEP:**
  - Digite o CEP e pressione Enter ou clique no ícone da lupa
  - Integração com API ViaCEP
  - Preenchimento automático de:
    - Logradouro (endereço)
    - Cidade
    - Estado
  - Formatação automática do CEP (00000-000)

- **Benefícios:**
  - Dados aparecem automaticamente em documentos e relatórios
  - Centralização das informações da empresa
  - Validação de e-mail e URL
  - Agilidade no preenchimento de endereço

### 2. **Configurações Financeiras** 💰
- **Formas de Pagamento:**
  - Dinheiro
  - PIX
  - Cartão de Crédito
  - Cartão de Débito
  - Outros
  - Sistema de ativação/desativação por switch

- **Juros e Multas:**
  - Percentual de multa por atraso (0-100%)
  - Taxa de juros mensal (0-100%)

- **Configurações de Caixa:**
  - Obrigatoriedade de abertura de caixa
  - Exigência de saldo inicial
  - Categorias personalizadas de receitas/despesas

### 3. **Configurações de Ordens de Serviço** 📝
- **Numeração:**
  - Prefixo personalizável (ex: OS, ORD, SRV)
  - Número inicial configurável
  - Formatos disponíveis:
    - Sequencial: OS-0001, OS-0002
    - Anual: OS-2024-0001
    - Mensal: OS-202401-0001

- **Status:**
  - Status padrão configurável
  - Suporte a status personalizados

- **Campos Obrigatórios:**
  - Cliente obrigatório
  - Serviço obrigatório
  - Data de entrega obrigatória
  - Forma de pagamento obrigatória

- **Prazos:**
  - Dias padrão para entrega (1-365 dias)

### 4. **Configurações de Notificações** 🔔
- **Notificações de Clientes:**
  - Aniversários de clientes
  - Ordem de serviço concluída
  - Lembrete de pagamento

- **Notificações Internas:**
  - Ordens atrasadas
  - Novo cliente cadastrado
  - Estoque baixo (preparado para futuro)

- **Configurações de E-mail:**
  - Ativação de notificações por e-mail
  - E-mail específico para receber notificações

- **Antecedência de Lembretes:**
  - Aniversários (0-30 dias)
  - Pagamentos (0-30 dias)
  - Ordens de serviço (0-30 dias)

### 5. **Preferências do Sistema** ⚙️
_(Em desenvolvimento)_
- Formato de data
- Formato de hora
- Moeda
- Fuso horário
- Idioma
- Tema (light/dark/auto)
- Modo compacto
- Tooltips

## 🏗️ Arquitetura Técnica

### Estrutura de Arquivos

```
types/
  └── settings.ts                    # Tipos TypeScript

lib/validations/
  └── settings.ts                    # Schemas Zod

hooks/
  └── use-settings.ts                # Custom hooks React Query

components/
  ├── ui/
  │   └── tabs.tsx                   # Componente Tabs
  └── settings/
      ├── organization-settings-form.tsx
      ├── financial-settings-form.tsx
      ├── notification-settings-form.tsx
      └── order-settings-form.tsx

app/(dashboard)/
  └── configuracoes/
      └── page.tsx                   # Página principal

supabase/
  └── add-settings-tables.sql        # Migration SQL
```

### Tecnologias Utilizadas

1. **React Hook Form + Zod**
   - Validação de formulários
   - Type-safe schemas
   - Feedback instantâneo de erros

2. **TanStack Query (React Query)**
   - Cache inteligente
   - Invalidação automática
   - Otimistic updates

3. **Supabase**
   - 4 novas tabelas:
     - `org_financial_settings`
     - `org_notification_settings`
     - `org_order_settings`
     - `org_system_preferences`
   - Row Level Security (RLS) ativado
   - Políticas de acesso por organização

4. **TypeScript**
   - Type-safety completo
   - Interfaces bem definidas
   - Validação em compile-time

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **organizations** (atualizada)
   - Campos adicionados: email, phone, cnpj, address, city, state, zip_code, website

2. **org_financial_settings**
   - payment_methods (JSONB)
   - late_fee_percentage
   - interest_rate_per_month
   - cashier_requires_opening
   - cashier_opening_balance_required
   - expense_categories (JSONB)
   - income_categories (JSONB)

3. **org_notification_settings**
   - notify_client_birthday
   - notify_order_ready
   - notify_payment_reminder
   - notify_order_delayed
   - notify_low_stock
   - notify_new_client
   - email_notifications_enabled
   - notification_email
   - birthday_reminder_days
   - payment_reminder_days
   - order_reminder_days

4. **org_order_settings**
   - order_prefix
   - order_start_number
   - order_number_format
   - custom_statuses (JSONB)
   - default_status
   - require_client
   - require_service
   - require_delivery_date
   - require_payment_method
   - default_delivery_days

5. **org_system_preferences**
   - date_format
   - time_format
   - currency
   - timezone
   - language
   - theme
   - compact_mode
   - show_tooltips

### Segurança

- **RLS ativado em todas as tabelas**
- **Políticas de acesso:**
  - Usuários só podem ver/editar configurações da própria organização
  - Baseado no `organization_id` do perfil do usuário

## 🚀 Como Usar

### 1. Executar Migration no Supabase

```sql
-- Executar o arquivo: supabase/add-settings-tables.sql
-- no SQL Editor do Supabase Dashboard
```

### 2. Acessar as Configurações

1. Fazer login no sistema
2. Clicar em "Configurações" no menu lateral
3. Navegar pelas abas:
   - Empresa
   - Financeiro
   - Ordens
   - Notificações
   - Sistema (em breve)

### 3. Salvar Configurações

- Preencher os campos desejados
- Clicar em "Salvar Alterações"
- Feedback visual de sucesso

## 📊 Benefícios do Sistema

### Para o Usuário

1. **Centralização:** Todas as configurações em um só lugar
2. **Organização:** Abas claras e intuitivas
3. **Validação:** Feedback imediato de erros
4. **Personalização:** Sistema adaptável às necessidades
5. **Controle:** Visibilidade total das configurações

### Para o Sistema

1. **Flexibilidade:** Configurações dinâmicas
2. **Escalabilidade:** Fácil adicionar novas configurações
3. **Manutenibilidade:** Código organizado e tipado
4. **Performance:** Cache e otimizações do React Query
5. **Segurança:** RLS e validação em múltiplas camadas

## 🔧 Próximos Passos Sugeridos

1. **Implementar aba Sistema:**
   - Seleção de tema (light/dark/auto)
   - Configuração de idioma
   - Seleção de fuso horário
   - Formato de data/hora

2. **Adicionar Customização Visual:**
   - Upload de logo
   - Seletor de cores (color picker)
   - Preview em tempo real

3. **Categorias Personalizadas:**
   - Interface para gerenciar categorias de receitas/despesas
   - Drag & drop para ordenação

4. **Status Personalizados:**
   - Interface para criar/editar status de ordens
   - Cores personalizadas por status

5. **Backup/Restore:**
   - Exportar configurações
   - Importar de backup

## 📝 Notas de Desenvolvimento

### Validações Implementadas

- E-mail: formato válido
- Website: URL válida
- Cores: formato hexadecimal (#RRGGBB)
- Percentuais: 0-100%
- Dias: 0-30 para lembretes, 1-365 para prazos

### Valores Padrão

Todos os campos possuem valores padrão sensatos para uso imediato sem configuração prévia.

### Performance

- Queries são cacheadas automaticamente
- Updates invalidam apenas o cache necessário
- Formulários com debounce implícito

## 🎨 Interface

- **Design Responsivo:** Funciona em desktop e mobile
- **Feedback Visual:** Loading states e mensagens de sucesso
- **Acessibilidade:** Labels associados, navegação por teclado
- **Consistência:** Segue o design system do projeto

## ✅ Checklist de Implementação

- [x] Tipos TypeScript
- [x] Validações Zod
- [x] Hooks React Query
- [x] Componente Tabs UI
- [x] Formulário de Empresa
- [x] Formulário Financeiro
- [x] Formulário de Ordens
- [x] Formulário de Notificações
- [x] Página principal com tabs
- [x] Migration SQL
- [x] Link no sidebar
- [x] Políticas RLS
- [ ] Aba Sistema (futuro)
- [ ] Upload de logo (futuro)
- [ ] Color picker (futuro)

---

**Sistema pronto para uso!** 🎉

Execute a migration SQL no Supabase e as configurações estarão disponíveis para todos os usuários.
