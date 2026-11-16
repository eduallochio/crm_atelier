import { SupabaseClient, User } from '@supabase/supabase-js'

// supabase.auth.admin.listUsers() sem parâmetros só retorna os primeiros 50
// usuários (page=1, perPage=50 são os defaults da API) — silenciosamente,
// sem erro. Projeto já tem mais de 50 usuários hoje, então toda rota admin
// que precisa de dados de qualquer usuário precisa paginar em loop até a
// página vir vazia ou menor que perPage. Retorna o objeto User completo —
// cada chamador extrai só o que precisa (email, app_metadata, etc).
export async function listAllUsers(supabase: SupabaseClient): Promise<User[]> {
  const users: User[] = []
  let page = 1
  const perPage = 200
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage })
    if (!data?.users?.length) break
    users.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  return users
}
