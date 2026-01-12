# 🚀 Como Executar a Migration do Admin Panel

## Pré-requisitos
- Supabase CLI instalado
- Projeto conectado ao Supabase

## Passos

### 1. Executar a Migration

```bash
# Na raiz do projeto
supabase db push
```

Ou se preferir executar manualmente no Supabase Dashboard:

1. Acesse https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/20260112000000_add_admin_tables.sql`
4. Execute

### 2. Promover seu usuário para Super Admin

Após executar a migration, execute no SQL Editor:

```sql
SELECT promote_to_super_admin('seu-email@exemplo.com');
```

Substitua `seu-email@exemplo.com` pelo email da sua conta.

### 3. Verificar

```sql
-- Ver seu role atual
SELECT id, email, role FROM profiles WHERE email = 'seu-email@exemplo.com';

-- Ver todas as organizações
SELECT * FROM organizations;

-- Ver métricas globais
SELECT * FROM admin_global_metrics;
```

## O que foi criado?

✅ **Campo `role` na tabela `profiles`**
- user (padrão)
- admin
- super_admin
- support
- billing

✅ **Tabela `admin_logs`**
- Armazena logs de todas as ações administrativas
- Usado no componente "Atividade Recente"

✅ **View `admin_global_metrics`**
- Métricas agregadas para o dashboard
- Atualizada automaticamente

✅ **Função `promote_to_super_admin()`**
- Facilita a promoção de usuários

## Próximos Passos

Após executar a migration, o painel admin em `/admin/dashboard` vai:
- ✅ Carregar dados reais das organizações
- ✅ Calcular MRR corretamente
- ✅ Mostrar gráficos com dados reais
- ✅ Exibir atividades recentes
- ✅ Funcionar o controle de permissões

## Troubleshooting

**Erro: relation "organizations" does not exist**
- A tabela `organizations` precisa existir primeiro
- Execute a migration principal do sistema antes

**Erro: permission denied**
- Certifique-se de estar conectado como proprietário do projeto
- Verifique as credenciais do Supabase

**View retorna null**
- Normal se não houver organizações cadastradas ainda
- Cadastre algumas organizações de teste
