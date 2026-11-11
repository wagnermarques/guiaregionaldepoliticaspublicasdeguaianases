import { LitElement, html, css } from 'lit'
import '@fzl/webcomponents-lit'
import { navigate } from 'fzl-fund-appshell--lit'
import {
  getAllEquipamentos,
  formatPhoneHref,
  getGoogleMapsUrl,
} from '../services/equipamentos-store.js'

export class GuiaEmergenciasView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 1140px;
      margin: 0 auto;
      padding: 16px 16px 48px;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
      color: var(--md-sys-color-on-surface, #0f172a);
    }

    .emergency-header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: #ffffff;
      padding: 22px 24px;
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .emergency-header h1 {
      margin: 0 0 8px;
      font-size: 1.5rem;
    }

    .emergency-header p {
      margin: 0 0 14px;
      font-size: 0.95rem;
      line-height: 1.45;
    }

    .national-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }

    .nat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      color: #991b1b;
      padding: 8px 14px;
      border-radius: 10px;
      font-weight: 800;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .grid-24h {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 16px;
    }

    .call-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #dc2626;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.84rem;
    }

    .map-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #0284c7;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.84rem;
    }
  `

  render() {
    const items24h = getAllEquipamentos().filter((e) => e.urgencia_24h)

    return html`
      <section class="emergency-header">
        <h1>🚨 Urgências Médicas 24h e Plantão do Conselho Tutelar</h1>
        <p>
          Estes equipamentos funcionam <strong>24 horas por dia</strong> (incluindo finais de semana e feriados)
          para emergências de saúde ou proteção imediata de crianças e adolescentes em Cidade Tiradentes, Guaianases e Lajeado.
        </p>

        <div class="national-numbers">
          <a class="nat-pill" href="tel:192">🚑 SAMU: 192</a>
          <a class="nat-pill" href="tel:193">🚒 Bombeiros: 193</a>
          <a class="nat-pill" href="tel:190">🚓 Polícia Militar: 190</a>
          <a class="nat-pill" href="tel:100">🛡️ Disque Direitos Humanos: 100</a>
          <fzl-lit-button variant="secondary" @fzl-click=${() => navigate('/')}>
            ← Voltar ao Mapa Completo
          </fzl-lit-button>
        </div>
      </section>

      <div class="grid-24h">
        ${items24h.map(
          (item) => html`
            <fzl-lit-card
              .title=${`🚨 ${item.nome}`}
              .subtitle=${`${item.subtipo} • Distrito: ${item.distrito}`}
              badge="24 HORAS"
              badge-variant="danger"
              body-max-height="none"
            >
              <div style="display:flex;flex-direction:column;gap:8px;font-size:0.88rem;">
                <div><strong>🏠 Endereço:</strong> ${item.endereco_completo}</div>
                <div><strong>🩺 Atendimento:</strong> ${item.servicos_oferecidos}</div>
                ${item.horario_funcionamento
                  ? html`<div><strong>🕒 Regime:</strong> ${item.horario_funcionamento}</div>`
                  : ''}
              </div>

              <div slot="footer" style="display:flex;flex-wrap:wrap;gap:8px;">
                ${(item.telefones || []).map(
                  (t) => html`
                    <a class="call-btn" href=${formatPhoneHref(t)}>📞 ${t}</a>
                  `
                )}
                ${(item.celulares_plantao || []).map(
                  (c) => html`
                    <a class="call-btn" href=${formatPhoneHref(c)}>📱 ${c}</a>
                  `
                )}
                <a
                  class="map-btn"
                  href=${getGoogleMapsUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🧭 Abrir Rota
                </a>
              </div>
            </fzl-lit-card>
          `
        )}
      </div>
    `
  }
}

if (!customElements.get('guia-emergencias-view')) {
  customElements.define('guia-emergencias-view', GuiaEmergenciasView)
}
