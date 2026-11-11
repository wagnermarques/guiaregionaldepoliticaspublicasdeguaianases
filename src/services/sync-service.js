import { supabase } from './supabase-client.js'
import { storageService } from './storage-service.js'
import { authService } from './auth-service.js'

const FLUSH_DEBOUNCE_MS = 600

const OPS = {
  'favorite.upsert': (userId, p) =>
    supabase.from('favorite_equipamentos').upsert(
      {
        user_id: userId,
        equipamento_id: Number(p.equipamentoId),
        nota_pessoal: p.notaPessoal || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,equipamento_id' }
    ),
  'favorite.remove': (userId, p) =>
    supabase
      .from('favorite_equipamentos')
      .delete()
      .match({ user_id: userId, equipamento_id: Number(p.equipamentoId) }),
}

function isRetryable(error) {
  return !error?.code
}

let flushing = false
let flushTimer = null
let reachable = true
let status = { state: 'synced', pending: 0, failed: 0, lastSyncedAt: null }
const statusListeners = new Set()

function publishStatus(override) {
  const outbox = storageService.getOutbox()
  const failed = outbox.filter((e) => e.failed).length
  const pending = outbox.length - failed
  let state = override
  if (!state) {
    if (failed) state = 'error'
    else if (!pending) state = 'synced'
    else if (navigator.onLine === false || !reachable) state = 'offline'
    else state = 'pending'
  }
  status = { state, pending, failed, lastSyncedAt: storageService.getLastSyncedAt() }
  statusListeners.forEach((fn) => fn(status))
}

export const syncService = {
  getStatus() {
    return status
  },

  subscribeStatus(callback) {
    statusListeners.add(callback)
    callback(status)
    return () => statusListeners.delete(callback)
  },

  enqueue(op, payload) {
    if (!supabase) return
    storageService.enqueue(op, payload)
    publishStatus()
    clearTimeout(flushTimer)
    flushTimer = setTimeout(() => this.flush(), FLUSH_DEBOUNCE_MS)
  },

  async flush() {
    clearTimeout(flushTimer)
    if (!supabase || flushing) return
    const userId = authService.getCurrentUser()?.id
    if (!userId) return publishStatus()
    if (navigator.onLine === false) return publishStatus()

    flushing = true
    publishStatus('syncing')
    let drained = true
    try {
      for (;;) {
        const entry = storageService.getOutbox().find((e) => !e.failed)
        if (!entry) break
        const handler = OPS[entry.op]
        if (!handler) {
          storageService.removeOutboxEntry(entry.id)
          continue
        }
        const { error } = await handler(userId, entry.payload)
        if (!error) {
          reachable = true
          storageService.removeOutboxEntry(entry.id)
          continue
        }
        if (isRetryable(error)) {
          reachable = false
          drained = false
          break
        }
        console.error(`Servidor rejeitou "${entry.op}"`, error)
        storageService.failOutboxEntry(entry.id, error.message)
      }
      if (drained) storageService.setLastSyncedAt(new Date().toISOString())
    } finally {
      flushing = false
      publishStatus()
    }
  },

  async pullFavorites(userId) {
    if (!supabase || !userId) return
    const { data, error } = await supabase
      .from('favorite_equipamentos')
      .select('equipamento_id, nota_pessoal, updated_at')
      .eq('user_id', userId)
    if (error) {
      console.warn('Aviso ao buscar locais salvos do Supabase:', error.message)
      return
    }
    storageService.mergeFavorites(
      (data ?? []).map((r) => ({
        equipamentoId: r.equipamento_id,
        notaPessoal: r.nota_pessoal || '',
        updatedAt: r.updated_at,
      }))
    )
  },

  async syncAll(userId) {
    await this.flush()
    await this.pullFavorites(userId)
    publishStatus()
  },

  /**
   * Busca sugestões comunitárias de equipamentos públicos (autorizadas por RLS).
   */
  async fetchSugestoes() {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('equipamento_sugestoes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('Aviso ao buscar sugestões:', error.message)
      return []
    }
    return data ?? []
  },

  /**
   * Envia uma nova sugestão/atualização de equipamento público (requer usuário logado).
   */
  async submitSugestao({ equipamentoId = null, nomeEquipamento, distrito, tipoContribuicao, descricao }) {
    if (!supabase) throw new Error('Backend Supabase não configurado.')
    const user = authService.getCurrentUser()
    if (!user?.id) throw new Error('Entre na sua conta para enviar uma sugestão.')
    const { data, error } = await supabase
      .from('equipamento_sugestoes')
      .insert({
        user_id: user.id,
        equipamento_id: equipamentoId ? Number(equipamentoId) : null,
        nome_equipamento: nomeEquipamento,
        distrito,
        tipo_contribuicao: tipoContribuicao || 'atualizacao',
        descricao,
        status: 'pending',
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Modera (aprova/rejeita) uma sugestão — exige papel 'admin' ou 'educator' (enforced por RLS).
   */
  async moderateSugestao(id, newStatus) {
    if (!supabase) throw new Error('Backend Supabase não configurado.')
    if (!authService.isAdminOrEducator()) {
      throw new Error('Acesso negado: apenas Educadores(as) ou Administradores(as) podem moderar.')
    }
    const user = authService.getCurrentUser()
    const { data, error } = await supabase
      .from('equipamento_sugestoes')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    reachable = true
    syncService.flush()
  })
  window.addEventListener('offline', () => publishStatus())
  publishStatus()
}
