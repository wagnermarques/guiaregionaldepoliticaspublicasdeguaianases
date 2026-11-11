import { LitElement, html, css } from 'lit'
import '@material/web/dialog/dialog.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-button.js'
import { saveEquipamentoCloud } from '../services/equipamentos-store.js'

export class GuiaEditModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    equipamento: { type: Object },
    _saving: { state: true },
    _error: { state: true },
    _success: { state: true },
  }

  static styles = css`
    :host {
      display: block;
    }

    md-dialog {
      --md-dialog-container-color: var(--md-sys-color-surface, #ffffff);
      max-width: 680px;
      width: 95vw;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 8px 0;
      max-height: 70vh;
      overflow-y: auto;
      font-family: var(--_fzl-font-family, system-ui, sans-serif);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
    }

    input[type='text'],
    input[type='email'],
    select,
    textarea {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      box-sizing: border-box;
      width: 100%;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid #0284c7;
      border-color: #0284c7;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #b91c1c;
      padding: 4px 0;
    }

    .msg-error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 10px;
      font-size: 0.9rem;
    }

    .msg-success {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px;
      font-size: 0.9rem;
    }
  `

  constructor() {
    super()
    this.open = false
    this.equipamento = null
    this._saving = false
    this._error = ''
    this._success = ''
  }

  close() {
    this.open = false
    this._error = ''
    this._success = ''
    this.dispatchEvent(new CustomEvent('modal-closed', { bubbles: true, composed: true }))
  }

  async _handleSubmit(e) {
    e.preventDefault()
    if (!this.equipamento) return

    this._saving = true
    this._error = ''
    this._success = ''

    const form = this.renderRoot.querySelector('#edit-form')
    const formData = new FormData(form)

    const telefonesRaw = formData.get('telefones') || ''
    const celularesRaw = formData.get('celulares_plantao') || ''

    const telefones = telefonesRaw
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean)

    const celulares_plantao = celularesRaw
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean)

    const updatedData = {
      ...this.equipamento,
      nome: formData.get('nome') || this.equipamento.nome,
      distrito: formData.get('distrito') || this.equipamento.distrito,
      subtipo: formData.get('subtipo') || this.equipamento.subtipo,
      endereco_completo: formData.get('endereco_completo') || this.equipamento.endereco_completo,
      bairro: formData.get('bairro') || this.equipamento.bairro,
      cep: formData.get('cep') || this.equipamento.cep,
      telefones,
      celulares_plantao,
      email: formData.get('email') || '',
      horario_funcionamento: formData.get('horario_funcionamento') || '',
      como_acessar: formData.get('como_acessar') || '',
      servicos_oferecidos: formData.get('servicos_oferecidos') || '',
      observacoes: formData.get('observacoes') || '',
      urgencia_24h: formData.get('urgencia_24h') === 'on',
    }

    try {
      await saveEquipamentoCloud(updatedData)
      this._success = 'Alterações salvas no Supabase com sucesso!'
      this.dispatchEvent(new CustomEvent('equipamento-updated', {
        detail: updatedData,
        bubbles: true,
        composed: true,
      }))
      setTimeout(() => {
        this.close()
      }, 1200)
    } catch (err) {
      this._error = err.message || 'Falha ao salvar no Supabase'
    } finally {
      this._saving = false
    }
  }

  render() {
    if (!this.open || !this.equipamento) return html``

    const eq = this.equipamento
    const telefonesStr = (eq.telefones || []).join(', ')
    const celularesStr = (eq.celulares_plantao || []).join(', ')

    return html`
      <md-dialog ?open=${this.open} @closed=${() => this.close()}>
        <div slot="headline">
          ✏️ Editar Equipamento (#${eq.id})
        </div>

        <form slot="content" id="edit-form" class="form-body" @submit=${this._handleSubmit}>
          ${this._error ? html`<div class="msg-error">${this._error}</div>` : ''}
          ${this._success ? html`<div class="msg-success">${this._success}</div>` : ''}

          <div class="form-group">
            <label for="eq-nome">Nome do Local</label>
            <input type="text" id="eq-nome" name="nome" .value=${eq.nome || ''} required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="eq-distrito">Distrito</label>
              <select id="eq-distrito" name="distrito">
                <option value="Cidade Tiradentes" ?selected=${eq.distrito === 'Cidade Tiradentes'}>Cidade Tiradentes</option>
                <option value="Guaianases" ?selected=${eq.distrito === 'Guaianases'}>Guaianases</option>
                <option value="Lajeado" ?selected=${eq.distrito === 'Lajeado'}>Lajeado</option>
                <option value="Sé / Central" ?selected=${eq.distrito === 'Sé / Central'}>Sé / Central</option>
              </select>
            </div>

            <div class="form-group">
              <label for="eq-subtipo">Subtipo / Tipo</label>
              <input type="text" id="eq-subtipo" name="subtipo" .value=${eq.subtipo || ''} required />
            </div>
          </div>

          <div class="form-group">
            <label for="eq-endereco">Endereço Completo</label>
            <input type="text" id="eq-endereco" name="endereco_completo" .value=${eq.endereco_completo || ''} required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="eq-bairro">Bairro</label>
              <input type="text" id="eq-bairro" name="bairro" .value=${eq.bairro || ''} />
            </div>
            <div class="form-group">
              <label for="eq-cep">CEP</label>
              <input type="text" id="eq-cep" name="cep" .value=${eq.cep || ''} />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="eq-telefones">Telefones (separados por vírgula)</label>
              <input type="text" id="eq-telefones" name="telefones" .value=${telefonesStr} />
            </div>
            <div class="form-group">
              <label for="eq-celulares">Plantão / Celular (opcional)</label>
              <input type="text" id="eq-celulares" name="celulares_plantao" .value=${celularesStr} />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="eq-horario">Horário de Atendimento</label>
              <input type="text" id="eq-horario" name="horario_funcionamento" .value=${eq.horario_funcionamento || ''} />
            </div>
            <div class="form-group">
              <label for="eq-email">E-mail</label>
              <input type="email" id="eq-email" name="email" .value=${eq.email || ''} />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" name="urgencia_24h" ?checked=${Boolean(eq.urgencia_24h)} />
              🚨 Atendimento Emergencial 24 Horas
            </label>
          </div>

          <div class="form-group">
            <label for="eq-como-acessar">💡 Para que serve e como acessar (Linguagem Simples)</label>
            <textarea id="eq-como-acessar" name="como_acessar" rows="3">${eq.como_acessar || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="eq-servicos">Serviços Oferecidos</label>
            <textarea id="eq-servicos" name="servicos_oferecidos" rows="2">${eq.servicos_oferecidos || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="eq-obs">Observações / Orientações Adicionais</label>
            <textarea id="eq-obs" name="observacoes" rows="2">${eq.observacoes || ''}</textarea>
          </div>
        </form>

        <div slot="actions">
          <md-text-button @click=${() => this.close()} ?disabled=${this._saving}>
            Cancelar
          </md-text-button>
          <md-filled-button
            type="submit"
            form="edit-form"
            ?disabled=${this._saving}
          >
            ${this._saving ? 'Salvando no Supabase...' : '💾 Salvar Alterações'}
          </md-filled-button>
        </div>
      </md-dialog>
    `
  }
}

if (!customElements.get('guia-edit-modal')) {
  customElements.define('guia-edit-modal', GuiaEditModal)
}
