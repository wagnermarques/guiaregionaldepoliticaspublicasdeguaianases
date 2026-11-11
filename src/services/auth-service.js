import { supabase } from './supabase-client.js'

let currentSession = null
let currentRole = 'user'
const listeners = new Set()

async function fetchUserProfile(userId) {
  if (!supabase || !userId) return { role: 'user', role_guia: 'user', name: null, distrito_preferido: null }
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, role_guia, name, distrito_preferido')
      .eq('id', userId)
      .single()
    
    // Preferência para role_guia isolado do app, com fallback para role legado
    const roleGuia = data?.role_guia || (data?.role === 'admin' ? 'guia_admin' : data?.role) || 'user'
    return {
      role: data?.role || 'user',
      role_guia: roleGuia,
      name: data?.name || null,
      distrito_preferido: data?.distrito_preferido || null,
    }
  } catch {
    return { role: 'user', role_guia: 'user', name: null, distrito_preferido: null }
  }
}

async function handleSessionChange(event, session) {
  currentSession = session
  if (session?.user?.id) {
    const profile = await fetchUserProfile(session.user.id)
    currentRole = profile.role_guia
    session.user.role = profile.role_guia
    session.user.role_guia = profile.role_guia
    if (profile.name && !session.user.user_metadata?.name) {
      session.user.user_metadata = { ...session.user.user_metadata, name: profile.name }
    }
  } else {
    currentRole = 'user'
  }
  listeners.forEach((fn) => fn(currentSession, event))

  // Quando o usuário clica no link do e-mail de "Esqueci minha senha" enviado pelo Supabase,
  // o Supabase redireciona com #access_token=...&type=recovery e dispara PASSWORD_RECOVERY.
  // Redirecionamos automaticamente para a tela de criar nova senha do appshell.
  if (event === 'PASSWORD_RECOVERY' && typeof window !== 'undefined') {
    window.location.hash = '#/conta/redefinir-senha'
  }
}

if (supabase) {
  // Detecta se a URL inicial já veio de um link de recuperação de senha do Supabase
  const initialHash = typeof window !== 'undefined' ? window.location.hash : ''
  const isRecoveryHash = initialHash.includes('type=recovery')

  supabase.auth.getSession().then(async ({ data }) => {
    await handleSessionChange(isRecoveryHash ? 'PASSWORD_RECOVERY' : 'INITIAL_SESSION', data.session)
  })

  supabase.auth.onAuthStateChange((event, session) => {
    handleSessionChange(event, session)
  })
}

export const authService = {
  isConfigured() {
    return supabase !== null
  },

  /** Síncrono — retorna null até que a sessão inicial resolva. */
  getCurrentUser() {
    return currentSession?.user ?? null
  },

  /** Retorna o papel de autorização ('user' | 'educator' | 'guia_admin' | 'super_admin') do usuário logado. */
  getCurrentRole() {
    return currentSession?.user ? currentRole : null
  },

  /** Verifica se o usuário autenticado possui um dos papéis exigidos (RBAC). */
  hasRole(...roles) {
    if (!currentSession?.user) return false
    return roles.includes(currentRole) || currentRole === 'super_admin'
  },

  /** Verifica se o usuário é administrador específico do Guia Regional. */
  isGuiaAdmin() {
    return this.hasRole('guia_admin', 'super_admin')
  },

  /** Verifica se o usuário tem autorização de Educador(a)/Mediador(a) ou Administrador(a) do Guia. */
  isAdminOrEducator() {
    return this.hasRole('guia_admin', 'educator', 'super_admin')
  },

  /** Chama o callback imediatamente com a sessão atual e a cada mudança. */
  subscribe(callback) {
    listeners.add(callback)
    callback(currentSession)
    return () => listeners.delete(callback)
  },

  async signUp(email, password, name) {
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
    return data
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase não configurado')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  },

  async getRole(userId) {
    if (!supabase || !userId) return 'user'
    const profile = await fetchUserProfile(userId)
    return profile.role
  },
}
