import { LitElement, html, css } from 'lit'
import '@fzl/webcomponents-lit'
import { navigate } from 'fzl-fund-appshell--lit'
import { getAllEquipamentos } from '../services/equipamentos-store.js'

export class GuiaTabelaView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 1380px;
      margin: 0 auto;
      padding: 16px 16px 48px;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
    }

    .header-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .header-box h1 {
      margin: 0;
      font-size: 1.35rem;
    }

    .header-box p {
      margin: 4px 0 0;
      font-size: 0.9rem;
      color: #475569;
    }
  `

  render() {
    const items = getAllEquipamentos().map((e) => ({
      ...e,
      telefones_texto: [...(e.telefones || []), ...(e.celulares_plantao || [])].join(' / ') || 'Presencial',
    }))

    const columns = [
      { field: 'id', label: 'Nº', width: '55px', sortable: true },
      { field: 'nome', label: 'Nome do Equipamento Público', sortable: true },
      { field: 'categoria', label: 'Área', sortable: true },
      { field: 'subtipo', label: 'Tipo de Serviço', sortable: true },
      { field: 'distrito', label: 'Distrito', sortable: true },
      { field: 'telefones_texto', label: 'Telefones / Plantão', sortable: false },
      { field: 'endereco_completo', label: 'Endereço Completo', sortable: true },
    ]

    return html`
      <div class="header-box">
        <div>
          <h1>📋 Lista Geral em Tabela (78 Equipamentos Públicos)</h1>
          <p>
            Visão rápida em grade para professores do AEE, assistentes sociais, gestores escolares e impressão.
          </p>
        </div>

        <fzl-lit-button variant="secondary" @fzl-click=${() => navigate('/')}>
          ← Voltar para o Mapa Interativo
        </fzl-lit-button>
      </div>

      <fzl-data-grid
        .items=${items}
        .columns=${columns}
        .searchable=${true}
        empty-text="Nenhum equipamento público encontrado."
      ></fzl-data-grid>
    `
  }
}

if (!customElements.get('guia-tabela-view')) {
  customElements.define('guia-tabela-view', GuiaTabelaView)
}
