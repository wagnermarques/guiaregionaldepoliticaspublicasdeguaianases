import { LitElement, html, css } from 'lit'
import '@fzl/webcomponents-lit'
import { navigate, navigateToLogin } from 'fzl-fund-appshell--lit'
import {
  getEquipamentoById,
  getVisualStyleForEquipamento,
  formatPhoneHref,
  getGoogleMapsUrl,
  getWhatsAppShareUrl,
} from '../services/equipamentos-store.js'
import { storageService } from '../services/storage-service.js'
import { syncService } from '../services/sync-service.js'
import { authService } from '../services/auth-service.js'

const ROLE_DESCRIPTIONS = {
  user: {
    badge: '👤 Perfil: Usuário(a) / Família',
    text: 'Você pode salvar seus equipamentos favoritos, criar anotações pessoais sincronizadas na nuvem e enviar sugestões de atualização.',
  },
  educator: {
    badge: '🏫 Perfil Autorizado: Educador(a) / Equipe DREG',
    text: 'Além de salvar favoritos e anotações, você possui autorização para aprovar ou rejeitar sugestões comunitárias da rede.',
  },
  admin: {
    badge: '🛡️ Perfil Autorizado: Administrador(a)',
    text: 'Acesso completo de administração e moderação das contribuições comunitárias do Guia Regional.',
  },
}

export class GuiaMeusLocaisView extends LitElement {
  static properties = {
    _favorites: { state: true },
    _user: { state: true },
    _role: { state: true },
    _sugestoes: { state: true },
    _nomeEquipamento: { state: true },
    _distritoSugestao: { state: true },
    _tipoContribuicao: { state: true },
    _descricaoSugestao: { state: true },
    _feedbackMsg: { state: true },
    _errorMsg: { state: true },
    _submitting: { state: true },
  }

  static styles = css`
    :host {
      display: block;
      max-width: 1140px;
      margin: 0 auto;
      padding: 16px 16px 48px;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
      color: var(--md-sys-color-on-surface, #0f172a);
    }

    .top-banner {
      background: linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 22px 24px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .top-banner h1 {
      margin: 0 0 6px;
      font-size: 1.5rem;
    }

    .top-banner p {
      margin: 0;
      font-size: 0.94rem;
      opacity: 0.95;
    }

    .auth-status-card {
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 22px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 0.82rem;
      margin-bottom: 6px;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 24px 0 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .note-box {
      background: #fefce8;
      border: 1px solid #fde047;
      border-radius: 8px;
      padding: 10px 12px;
      margin-top: 8px;
    }

    .note-box label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #854d0e;
      margin-bottom: 6px;
    }

    .note-textarea {
      width: 100%;
      min-height: 64px;
      border: 1px solid #eab308;
      border-radius: 6px;
      padding: 8px;
      font-family: inherit;
      font-size: 0.86rem;
      background: #ffffff;
      color: #0f172a;
      box-sizing: border-box;
    }

    .actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .btn-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .btn-call {
      background: #16a34a;
      color: #ffffff;
    }

    .btn-maps {
      background: #0284c7;
      color: #ffffff;
    }

    .btn-remove {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }

    .empty-state {
      padding: 32px 20px;
      text-align: center;
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
      border: 2px dashed #cbd5e1;
      border-radius: 14px;
    }

    .collab-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 12px;
    }

    @media (max-width: 900px) {
      .collab-grid {
        grid-template-columns: 1fr;
      }
    }

    .sugestao-item {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
      background: var(--md-sys-color-surface, #f8fafc);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-approved {
      background: #dcfce7;
      color: #166534;
    }

    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
  `

  constructor() {
    super()
    this._favorites = storageService.getFavorites()
    this._user = authService.getCurrentUser()
    this._role = authService.getCurrentRole() || 'user'
    this._sugestoes = []
    this._nomeEquipamento = ''
    this._distritoSugestao = 'Cidade Tiradentes'
    this._tipoContribuicao = 'atualizacao'
    this._descricaoSugestao = ''
    this._feedbackMsg = ''
    this._errorMsg = ''
    this._submitting = false
  }

  connectedCallback() {
    super.connectedCallback()
    this._unsubStorage = storageService.subscribe(() => {
      this._favorites = storageService.getFavorites()
    })
    this._unsubAuth = authService.subscribe((session) => {
      this._user = session?.user ?? null
      this._role = session?.user?.role || authService.getCurrentRole() || 'user'
      this._loadSugestoes()
    })
    this._loadSugestoes()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubStorage?.()
    this._unsubAuth?.()
  }

  async _loadSugestoes() {
    this._sugestoes = await syncService.fetchSugestoes()
  }

  _handleNoteChange(equipamentoId, nota) {
    const entry = storageService.setFavoriteNote(equipamentoId, nota)
    syncService.enqueue('favorite.upsert', {
      equipamentoId,
      notaPessoal: entry.notaPessoal,
    })
  }

  _handleRemoveFavorite(equipamentoId) {
    storageService.toggleFavorite(equipamentoId)
    syncService.enqueue('favorite.remove', { equipamentoId })
  }

  async _handleSubmitSugestao(e) {
    e.preventDefault()
    this._feedbackMsg = ''
    this._errorMsg = ''
    if (!this._nomeEquipamento.trim() || !this._descricaoSugestao.trim()) {
      this._errorMsg = 'Preencha o nome do local e a descrição da sugestão.'
      return
    }
    this._submitting = true
    try {
      await syncService.submitSugestao({
        nomeEquipamento: this._nomeEquipamento.trim(),
        distrito: this._distritoSugestao,
        tipoContribuicao: this._tipoContribuicao,
        descricao: this._descricaoSugestao.trim(),
      })
      this._nomeEquipamento = ''
      this._descricaoSugestao = ''
      this._feedbackMsg = 'Contribuição enviada com sucesso! Obrigado por ajudar a comunidade.'
      await this._loadSugestoes()
    } catch (err) {
      this._errorMsg = err.message || 'Não foi possível enviar a sugestão.'
    } finally {
      this._submitting = false
    }
  }

  async _handleModerate(id, newStatus) {
    try {
      await syncService.moderateSugestao(id, newStatus)
      await this._loadSugestoes()
    } catch (err) {
      this._errorMsg = err.message
    }
  }

  render() {
    const roleMeta = ROLE_DESCRIPTIONS[this._role] || ROLE_DESCRIPTIONS.user
    const savedItems = this._favorites
      .map((f) => ({
        fav: f,
        item: getEquipamentoById(f.equipamentoId),
      }))
      .filter((x) => Boolean(x.item))

    return html`
      <section class="top-banner">
        <div>
          <h1>⭐ Meus Locais Salvos e Caderno de Anotações</h1>
          <p>
            Guarde aqui os postos de saúde (UBS), CER II, CRAS ou escolas que você mais usa e anote horários de
            consultas, nomes de profissionais ou documentos necessários.
          </p>
        </div>
        <fzl-lit-button variant="secondary" @fzl-click=${() => navigate('/')}>
          ← Voltar ao Mapa
        </fzl-lit-button>
      </section>

      <!-- Status de Autenticação e Autorização (Supabase Auth + RBAC) -->
      <div class="auth-status-card">
        <div>
          ${this._user
            ? html`
                <span class="role-pill">${roleMeta.badge}</span>
                <div style="font-size:0.92rem;">
                  Conectado como <strong>${this._user.email}</strong> — ${roleMeta.text}
                </div>
              `
            : html`
                <span class="role-pill">📱 Modo Dispositivo Local</span>
                <div style="font-size:0.92rem;">
                  Seus locais salvos estão guardados neste navegador. Entre na sua conta para sincronizar na nuvem entre
                  celular e computador e enviar sugestões.
                </div>
              `}
        </div>

        <div>
          ${this._user
            ? html`
                <fzl-lit-button
                  variant="primary"
                  size="sm"
                  @fzl-click=${() => syncService.syncAll(this._user.id)}
                >
                  🔄 Sincronizar Agora
                </fzl-lit-button>
              `
            : html`
                <fzl-lit-button variant="primary" size="sm" @fzl-click=${navigateToLogin}>
                  🔑 Entrar ou Criar Conta
                </fzl-lit-button>
              `}
        </div>
      </div>

      <!-- 1. Lista de Locais Favoritos Salvos -->
      <h2 class="section-title">⭐ Meus Equipamentos Públicos Salvos (${savedItems.length})</h2>

      ${savedItems.length === 0
        ? html`
            <div class="empty-state">
              <h3 style="margin:0 0 8px;">Você ainda não salvou nenhum local nos seus favoritos</h3>
              <p style="margin:0 0 16px;color:#64748b;">
                No mapa principal, toque no botão <strong>"☆ Salvar Local"</strong> em qualquer UBS, Hospital, CER II,
                CRAS ou escola para guardá-lo aqui.
              </p>
              <fzl-lit-button variant="primary" @fzl-click=${() => navigate('/')}>
                🗺️ Escolher Locais no Mapa
              </fzl-lit-button>
            </div>
          `
        : html`
            <div class="fav-grid">
              ${savedItems.map(({ fav, item }) => {
                const st = getVisualStyleForEquipamento(item)
                return html`
                  <fzl-lit-card
                    .title=${`${st.icon} ${item.nome}`}
                    .subtitle=${`${item.subtipo} • ${item.distrito}`}
                    .badge=${st.shortTag}
                    .badgeVariant=${st.badgeVariant}
                    body-max-height="none"
                  >
                    <div style="display:flex;flex-direction:column;gap:8px;font-size:0.88rem;">
                      <div><strong>🏠 Endereço:</strong> ${item.endereco_completo}</div>
                      ${item.horario_funcionamento
                        ? html`<div><strong>🕒 Horário:</strong> ${item.horario_funcionamento}</div>`
                        : ''}

                      <div class="note-box">
                        <label for="note-${item.id}">
                          📝 Minha anotação pessoal (ex: dia da consulta, médico, documentos):
                        </label>
                        <textarea
                          id="note-${item.id}"
                          class="note-textarea"
                          placeholder="Escreva aqui um lembrete sobre seu atendimento neste local..."
                          .value=${fav.notaPessoal || ''}
                          @change=${(e) => this._handleNoteChange(item.id, e.target.value)}
                        ></textarea>
                      </div>
                    </div>

                    <div slot="footer" class="actions-row">
                      ${(item.telefones || []).slice(0, 1).map(
                        (tel) => html`
                          <a class="btn-link btn-call" href=${formatPhoneHref(tel)}>
                            📞 ${tel}
                          </a>
                        `
                      )}
                      <a
                        class="btn-link btn-maps"
                        href=${getGoogleMapsUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🧭 Como Chegar
                      </a>
                      <a
                        class="btn-link"
                        style="background:#dcfce7;color:#166534;"
                        href=${getWhatsAppShareUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📲 WhatsApp
                      </a>
                      <button
                        type="button"
                        class="btn-link btn-remove"
                        @click=${() => this._handleRemoveFavorite(item.id)}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </fzl-lit-card>
                `
              })}
            </div>
          `}

      <!-- 2. Colaboração Comunitária e Moderação Autorizada (RBAC) -->
      <h2 class="section-title">🤝 Colaboração da Comunidade e Rede Intersetorial</h2>

      <div class="collab-grid">
        <fzl-lit-card
          title="💬 Enviar Atualização ou Sugestão de Local"
          subtitle="Mudou algum telefone, horário ou conhece um novo serviço público na região?"
          badge="Colaborativo"
          badge-variant="info"
          body-max-height="none"
        >
          ${!this._user
            ? html`
                <p style="font-size:0.9rem;color:#475569;">
                  Para evitar spam e garantir a segurança das informações, entre na sua conta para enviar uma sugestão de
                  atualização.
                </p>
                <fzl-lit-button variant="primary" size="sm" @fzl-click=${navigateToLogin}>
                  🔑 Entrar para Colaborar
                </fzl-lit-button>
              `
            : html`
                <form @submit=${this._handleSubmitSugestao}>
                  <fzl-text-input
                    label="Nome do Equipamento Público"
                    placeholder="Ex: UBS Jardim Etelvina, CER II Guaianases..."
                    .value=${this._nomeEquipamento}
                    required
                    @fzl-input=${(e) => (this._nomeEquipamento = e.detail.value)}
                  ></fzl-text-input>

                  <fzl-select
                    label="Distrito"
                    .value=${this._distritoSugestao}
                    .options=${[
                      { value: 'Cidade Tiradentes', label: 'Cidade Tiradentes' },
                      { value: 'Guaianases', label: 'Guaianases' },
                      { value: 'Lajeado', label: 'Lajeado' },
                    ]}
                    @fzl-change=${(e) => (this._distritoSugestao = e.detail.value)}
                  ></fzl-select>

                  <fzl-text-input
                    label="O que mudou ou deve ser incluído?"
                    placeholder="Ex: Novo telefone de atendimento (11) 2555-0000..."
                    .value=${this._descricaoSugestao}
                    required
                    @fzl-input=${(e) => (this._descricaoSugestao = e.detail.value)}
                  ></fzl-text-input>

                  ${this._feedbackMsg
                    ? html`<p style="color:#15803d;font-weight:700;font-size:0.86rem;">✅ ${this._feedbackMsg}</p>`
                    : ''}
                  ${this._errorMsg
                    ? html`<p style="color:#dc2626;font-weight:700;font-size:0.86rem;">⚠️ ${this._errorMsg}</p>`
                    : ''}

                  <fzl-lit-button type="submit" variant="primary" ?disabled=${this._submitting}>
                    📨 Enviar Contribuição
                  </fzl-lit-button>
                </form>
              `}
        </fzl-lit-card>

        <fzl-lit-card
          title="🛡️ Mural de Atualizações & Moderação"
          subtitle=${authService.isAdminOrEducator()
            ? 'Você possui permissão de Educador(a)/Admin para aprovar ou rejeitar sugestões'
            : 'Atualizações validadas pela equipe de Educadores / Administração'}
          badge=${authService.isAdminOrEducator() ? 'Modo Moderador Ativo' : 'Leitura Pública'}
          badge-variant=${authService.isAdminOrEducator() ? 'success' : 'default'}
          body-max-height="none"
        >
          ${this._sugestoes.length === 0
            ? html`
                <p style="font-size:0.88rem;color:#64748b;margin:0;">
                  Nenhuma atualização comunitária pendente ou publicada no momento.
                </p>
              `
            : this._sugestoes.map(
                (s) => html`
                  <div class="sugestao-item">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
                      <strong>${s.nome_equipamento} (${s.distrito})</strong>
                      <span class="status-badge status-${s.status}">
                        ${s.status === 'approved'
                          ? '✅ Aprovada'
                          : s.status === 'rejected'
                            ? '❌ Rejeitada'
                            : '⏳ Em Análise'}
                      </span>
                    </div>
                    <p style="margin:4px 0;font-size:0.86rem;">${s.descricao}</p>
                    ${authService.isAdminOrEducator() && s.status === 'pending'
                      ? html`
                          <div style="display:flex;gap:8px;margin-top:8px;">
                            <fzl-lit-button
                              variant="primary"
                              size="sm"
                              @fzl-click=${() => this._handleModerate(s.id, 'approved')}
                            >
                              ✅ Aprovar
                            </fzl-lit-button>
                            <fzl-lit-button
                              variant="danger"
                              size="sm"
                              @fzl-click=${() => this._handleModerate(s.id, 'rejected')}
                            >
                              ✕ Rejeitar
                            </fzl-lit-button>
                          </div>
                        `
                      : ''}
                  </div>
                `
              )}
        </fzl-lit-card>
      </div>
    `
  }
}

if (!customElements.get('guia-meus-locais-view')) {
  customElements.define('guia-meus-locais-view', GuiaMeusLocaisView)
}
