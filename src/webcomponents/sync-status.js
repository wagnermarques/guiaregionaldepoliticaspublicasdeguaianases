import { LitElement, html, css } from 'lit'
import '@material/web/icon/icon.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/dialog/dialog.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-button.js'
import { navigateToAccount, navigate } from 'fzl-fund-appshell--lit'
import { syncService } from '../services/sync-service.js'
import { authService } from '../services/auth-service.js'

const TOAST_MS = 4000

const ROLE_LABELS = {
  super_admin: '⚡ Super Administrador(a)',
  guia_admin: '🛡️ Administrador(a) do Guia',
  admin: '🛡️ Administrador(a) do Guia',
  educator: '🏫 Educador(a) / Equipe DREG',
  user: '👤 Usuário(a) / Família',
}

export class SyncStatus extends LitElement {
  static properties = {
    _status: { state: true },
    _user: { state: true },
    _role: { state: true },
    _detailOpen: { state: true },
    _toast: { state: true },
  }

  static styles = css`
    :host {
      display: contents;
    }
    .badge-wrap {
      position: relative;
      display: inline-flex;
    }
    .badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: var(--md-sys-color-primary, #0284c7);
      color: var(--md-sys-color-on-primary, #fff);
      font-size: 10px;
      line-height: 16px;
      text-align: center;
      pointer-events: none;
    }
    .badge.failed {
      background: var(--md-sys-color-error, #b3261e);
      color: var(--md-sys-color-on-error, #fff);
    }
    .spin {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .spin {
        animation: none;
      }
    }
    .toast {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 9999;
      max-width: min(90vw, 420px);
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--md-sys-color-inverse-surface, #313033);
      color: var(--md-sys-color-inverse-on-surface, #f4eff4);
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.3);
      font-size: 0.875rem;
    }
    dl {
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 16px;
      font-size: 0.875rem;
    }
    dt {
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 600;
    }
    dd {
      margin: 0;
    }
    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 0.78rem;
    }
  `

  constructor() {
    super()
    this._status = syncService.getStatus()
    this._user = authService.getCurrentUser()
    this._role = authService.getCurrentRole() || 'user'
    this._detailOpen = false
    this._toast = null
  }

  connectedCallback() {
    super.connectedCallback()
    this._unsubscribeAuth = authService.subscribe((session) => {
      this._user = session?.user ?? null
      this._role = session?.user?.role || authService.getCurrentRole() || 'user'
    })
    let previous = this._status
    this._unsubscribeStatus = syncService.subscribeStatus((status) => {
      this._announce(previous, status)
      previous = status
      this._status = status
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribeAuth?.()
    this._unsubscribeStatus?.()
    clearTimeout(this._toastTimer)
  }

  _announce(previous, next) {
    if (!this._user) return
    if (next.state === previous.state) return
    if (next.state === 'offline') {
      this._showToast('Você está offline. Seus locais salvos ficam guardados neste aparelho.')
    } else if (next.state === 'syncing' && previous.pending > 0) {
      this._showToast('Sincronizando seus locais salvos…')
    } else if (next.state === 'synced' && previous.state === 'syncing' && previous.pending > 0) {
      const n = previous.pending
      this._showToast(`${n} ${n === 1 ? 'alteração sincronizada' : 'alterações sincronizadas'}.`)
    } else if (next.state === 'error') {
      this._showToast('Não foi possível sincronizar algumas alterações.')
    }
  }

  _showToast(text) {
    this._toast = text
    clearTimeout(this._toastTimer)
    this._toastTimer = setTimeout(() => (this._toast = null), TOAST_MS)
  }

  _view() {
    if (!this._user) {
      return {
        icon: 'phone_android',
        label: 'Salvo somente neste aparelho',
        detail: 'Entre na sua conta para sincronizar seus locais favoritos e anotações entre aparelhos.',
      }
    }
    const { state, pending, failed } = this._status
    switch (state) {
      case 'offline':
        return {
          icon: 'cloud_off',
          label: 'Offline',
          detail: 'Suas alterações estão salvas neste aparelho e serão enviadas ao reconectar.',
        }
      case 'syncing':
        return { icon: 'sync', spin: true, label: 'Sincronizando…', detail: 'Enviando seus locais salvos.' }
      case 'pending':
        return {
          icon: 'cloud_upload',
          label: `${pending} para enviar`,
          detail: 'Alterações aguardando envio.',
        }
      case 'error':
        return {
          icon: 'sync_problem',
          label: 'Falha ao sincronizar',
          detail: `${failed} ${failed === 1 ? 'alteração foi recusada' : 'alterações foram recusadas'} pelo servidor.`,
        }
      default:
        return { icon: 'cloud_done', label: 'Tudo sincronizado', detail: 'Seus locais salvos e anotações estão sincronizados na nuvem.' }
    }
  }

  _lastSynced() {
    const iso = this._status.lastSyncedAt
    return iso ? new Date(iso).toLocaleString('pt-BR') : 'Nunca'
  }

  render() {
    if (!authService.isConfigured()) return null
    const view = this._view()
    const badge = this._status.failed || this._status.pending
    return html`
      <span class="badge-wrap">
        <md-icon-button
          @click=${() => (this._detailOpen = true)}
          aria-label=${`Sincronização: ${view.label}`}
          title=${view.label}
        >
          <md-icon class=${view.spin ? 'spin' : ''}>${view.icon}</md-icon>
        </md-icon-button>
        ${this._user && badge
          ? html`<span class="badge ${this._status.failed ? 'failed' : ''}"
              >${badge > 99 ? '99+' : badge}</span
            >`
          : ''}
      </span>

      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : ''}

      <md-dialog ?open=${this._detailOpen} @closed=${() => (this._detailOpen = false)}>
        <div slot="headline">${view.label}</div>
        <div slot="content">
          <p>${view.detail}</p>
          ${this._user
            ? html`
                <dl>
                  <dt>Conta</dt>
                  <dd>${this._user.email}</dd>
                  <dt>Nível de Acesso</dt>
                  <dd><span class="role-badge">${ROLE_LABELS[this._role] || ROLE_LABELS.user}</span></dd>
                  <dt>Aguardando envio</dt>
                  <dd>${this._status.pending}</dd>
                  ${this._status.failed
                    ? html`<dt>Recusadas</dt>
                        <dd>${this._status.failed}</dd>`
                    : ''}
                  <dt>Última sincronização</dt>
                  <dd>${this._lastSynced()}</dd>
                </dl>
              `
            : ''}
        </div>
        <div slot="actions">
          ${this._user
            ? html`
                <md-text-button
                  @click=${() => {
                    this._detailOpen = false
                    navigate('/meus-locais')
                  }}
                >
                  Meus Locais Salvos
                </md-text-button>
                <md-text-button
                  ?disabled=${this._status.state === 'syncing'}
                  @click=${() => syncService.flush()}
                >
                  Sincronizar agora
                </md-text-button>
              `
            : html`<md-text-button
                @click=${() => {
                  this._detailOpen = false
                  navigateToAccount()
                }}
                >Entrar / Criar conta</md-text-button
              >`}
          <md-filled-button @click=${() => (this._detailOpen = false)}>Fechar</md-filled-button>
        </div>
      </md-dialog>
    `
  }
}

if (!customElements.get('sync-status')) {
  customElements.define('sync-status', SyncStatus)
}
