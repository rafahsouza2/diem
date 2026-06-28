'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function criarUsuario(formData: FormData) {
  const supabase = createAdminClient()
  const email    = formData.get('email') as string
  const senha    = formData.get('senha') as string
  const nome     = formData.get('nome') as string
  const funcao   = formData.get('funcao') as string

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    user_metadata: { full_name: nome, funcao },
    email_confirm: true,
  })
  if (error) return { erro: error.message }
  revalidatePath('/dashboard/usuarios')
  return { ok: true }
}

export async function editarUsuario(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const email    = formData.get('email') as string
  const nome     = formData.get('nome') as string
  const funcao   = formData.get('funcao') as string
  const senha    = formData.get('senha') as string

  const update: Record<string, unknown> = { email, user_metadata: { full_name: nome, funcao } }
  if (senha) update.password = senha

  const { error } = await supabase.auth.admin.updateUserById(id, update)
  if (error) return { erro: error.message }
  revalidatePath('/dashboard/usuarios')
  return { ok: true }
}

export async function excluirUsuario(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return { erro: error.message }
  revalidatePath('/dashboard/usuarios')
  return { ok: true }
}
