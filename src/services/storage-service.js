const KEYS = {
  favorites: 'guiaregional:favorites', // [{ equipamentoId, notaPessoal, updatedAt }]
  outbox: 'guiaregional:outbox', // [{ id, op, payload, createdAt, failed?, lastError? }]
  lastSyncedAt: 'guiaregional:last-synced-at', // ISO string
}

const MAX_OUTBOX_ENTRIES = 2000
const changeListeners = new Set()

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage indisponível — falha silenciosa
  }
}

function notifyListeners() {
  changeListeners.forEach((fn) => fn())
}

function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const storageService = {
  subscribe(callback) {
    changeListeners.add(callback)
    return () => changeListeners.delete(callback)
  },

  /** Lista de equipamentos salvos pelo usuário: [{ equipamentoId, notaPessoal, updatedAt }] */
  getFavorites() {
    return readJSON(KEYS.favorites, [])
  },

  isFavorite(equipamentoId) {
    const id = Number(equipamentoId)
    return this.getFavorites().some((f) => Number(f.equipamentoId) === id)
  },

  getNote(equipamentoId) {
    const id = Number(equipamentoId)
    const found = this.getFavorites().find((f) => Number(f.equipamentoId) === id)
    return found?.notaPessoal || ''
  },

  /** Alterna um equipamento entre salvo e não salvo. Retorna { added, entry, favorites }. */
  toggleFavorite(equipamentoId) {
    const id = Number(equipamentoId)
    const list = this.getFavorites()
    const idx = list.findIndex((f) => Number(f.equipamentoId) === id)
    let added = false
    let entry = null
    if (idx >= 0) {
      list.splice(idx, 1)
      added = false
    } else {
      entry = {
        equipamentoId: id,
        notaPessoal: '',
        updatedAt: new Date().toISOString(),
      }
      list.push(entry)
      added = true
    }
    writeJSON(KEYS.favorites, list)
    notifyListeners()
    return { added, entry, favorites: list }
  },

  /** Salva/atualiza uma anotação pessoal para um equipamento (adicionando aos favoritos se ainda não estiver). */
  setFavoriteNote(equipamentoId, notaPessoal) {
    const id = Number(equipamentoId)
    const list = this.getFavorites()
    const now = new Date().toISOString()
    const idx = list.findIndex((f) => Number(f.equipamentoId) === id)
    const cleanNote = String(notaPessoal ?? '').trim()
    let entry
    if (idx >= 0) {
      entry = { ...list[idx], notaPessoal: cleanNote, updatedAt: now }
      list[idx] = entry
    } else {
      entry = { equipamentoId: id, notaPessoal: cleanNote, updatedAt: now }
      list.push(entry)
    }
    writeJSON(KEYS.favorites, list)
    notifyListeners()
    return entry
  },

  /** Mescla favoritos vindos do Supabase sem perder notas locais mais recentes. */
  mergeFavorites(remoteFavorites) {
    const local = this.getFavorites()
    const byId = new Map(local.map((f) => [Number(f.equipamentoId), f]))
    for (const r of remoteFavorites) {
      const id = Number(r.equipamentoId)
      const existing = byId.get(id)
      if (!existing) {
        byId.set(id, {
          equipamentoId: id,
          notaPessoal: r.notaPessoal || '',
          updatedAt: r.updatedAt || new Date().toISOString(),
        })
      } else if (r.notaPessoal && !existing.notaPessoal) {
        byId.set(id, {
          ...existing,
          notaPessoal: r.notaPessoal,
        })
      }
    }
    const merged = Array.from(byId.values())
    writeJSON(KEYS.favorites, merged)
    notifyListeners()
    return merged
  },

  getOutbox() {
    return readJSON(KEYS.outbox, [])
  },

  enqueue(op, payload) {
    const targetId = payload?.equipamentoId
    const list = this.getOutbox().filter(
      (e) => !(e.op === op && Number(e.payload?.equipamentoId) === Number(targetId))
    )
    const entry = { id: newId(), op, payload, createdAt: new Date().toISOString() }
    list.push(entry)
    writeJSON(KEYS.outbox, list.slice(-MAX_OUTBOX_ENTRIES))
    return entry
  },

  removeOutboxEntry(id) {
    writeJSON(
      KEYS.outbox,
      this.getOutbox().filter((e) => e.id !== id)
    )
  },

  failOutboxEntry(id, lastError) {
    const list = this.getOutbox()
    const entry = list.find((e) => e.id === id)
    if (!entry) return
    entry.failed = true
    entry.lastError = lastError
    writeJSON(KEYS.outbox, list)
  },

  getLastSyncedAt() {
    return readJSON(KEYS.lastSyncedAt, null)
  },

  setLastSyncedAt(iso) {
    writeJSON(KEYS.lastSyncedAt, iso)
  },
}
