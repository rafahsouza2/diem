import { createAdminClient } from '@/lib/supabase/admin'
import UsuariosPage from '@/components/UsuariosPage'

export default async function UsuariosAdminPage() {
  let usuarios: {
    id: string; email: string; nome: string; funcao: string
    confirmado: boolean; ultimoAcesso: string | null; criado: string
  }[] = []
  let erroConfig: string | undefined

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    usuarios = (data?.users ?? []).map(u => ({
      id:           u.id,
      email:        u.email ?? '',
      nome:         (u.user_metadata?.full_name ?? '') as string,
      funcao:       (u.user_metadata?.funcao ?? '') as string,
      confirmado:   !!u.email_confirmed_at,
      ultimoAcesso: u.last_sign_in_at ?? null,
      criado:       u.created_at,
    }))
  } catch (e: unknown) {
    erroConfig = e instanceof Error ? e.message : 'Erro desconhecido'
  }

  return <UsuariosPage usuarios={usuarios} erroConfig={erroConfig} />
}
