import { supabase } from './supabase-client.js'
import { authService } from './auth-service.js'

function toAppShellUser(u, fallbackName) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || fallbackName || u.email,
    role: u.role || u.user_metadata?.role || 'user',
    avatarUrl: u.user_metadata?.avatarUrl || null,
    phone: u.user_metadata?.phone || '',
    bio: u.user_metadata?.bio || '',
    createdAt: u.created_at,
  }
}

export const supabaseAuthProvider = {
  isConfigured() {
    return supabase !== null
  },

  async signIn({ email, password }) {
    if (!supabase) throw new Error('Supabase não configurado')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = data?.user
    if (user) {
      user.role = await authService.getRole(user.id)
    }
    return toAppShellUser(user)
  },

  async signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  },

  async signUp({ name, email, password }) {
    if (!supabase) throw new Error('Supabase não configurado')
    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: name ? { name } : undefined,
      },
    })
    if (error) throw error
    const user = data?.user
    return toAppShellUser(user, name)
  },

  async requestPasswordReset({ email }) {
    if (!supabase) throw new Error('Supabase não configurado')
    // Usa a URL base do app (sem hash fragment) para compatibilidade com a allowlist
    // de Redirect URLs do Supabase Auth; ao retornar com #access_token=...&type=recovery,
    // auth-service.js intercepta o evento PASSWORD_RECOVERY e abre #/conta/redefinir-senha.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
    return {}
  },

  async resetPassword({ password }) {
    if (!supabase) throw new Error('Supabase não configurado')
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    const user = data?.user
    if (user) {
      user.role = await authService.getRole(user.id)
    }
    return toAppShellUser(user)
  },

  async changePassword({ newPassword }) {
    if (!supabase) throw new Error('Supabase não configurado')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async updateProfile(updates) {
    if (!supabase) throw new Error('Supabase não configurado')
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name: updates.name,
        phone: updates.phone,
        bio: updates.bio,
        avatarUrl: updates.avatarUrl,
      },
    })
    if (error) throw error
    const user = data?.user
    if (user && updates.name !== undefined) {
      await supabase
        .from('profiles')
        .update({ name: updates.name, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }
    if (user) {
      user.role = await authService.getRole(user.id)
    }
    return toAppShellUser(user)
  },

  init({ setUser }) {
    return authService.subscribe((session) => {
      const u = session?.user
      setUser(toAppShellUser(u))
    })
  },

  async getAccessToken() {
    return (await supabase?.auth?.getSession())?.data?.session?.access_token ?? null
  },
}
