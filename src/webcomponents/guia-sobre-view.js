import { LitElement, html, css } from 'lit'
import '@fzl/webcomponents-lit'
import { navigate } from 'fzl-fund-appshell--lit'

export class GuiaSobreView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 16px 16px 48px;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
      line-height: 1.6;
    }

    .about-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `

  render() {
    return html`
      <div class="about-stack">
        <fzl-lit-card
          title="📖 Sobre o Guia Regional de Políticas Públicas"
          subtitle="Apoio intersetorial à inclusão escolar e garantia de direitos na Zona Leste de São Paulo"
          badge="Pesquisa Acadêmica & Ação Comunitária"
          badge-variant="info"
          body-max-height="none"
        >
          <div>
            <p>
              Este aplicativo web interativo disponibiliza à população e aos educadores os dados do
              <strong>Guia Regional de Políticas Públicas</strong>, abrangendo os <strong>78 equipamentos públicos</strong>
              dos distritos de <strong>Cidade Tiradentes, Guaianases e Lajeado</strong> (território da Diretoria Regional
              de Educação de Guaianases — DREG).
            </p>
            <p>
              O levantamento original integra o <strong>Apêndice D</strong> da dissertação de Mestrado em Educação de
              <strong>Elifas Trindade de Paula</strong> (FCT/UNESP — Presidente Prudente, 2022), intitulada:
              <em>"A inclusão escolar de estudantes com deficiência em situação de vulnerabilidade social: fatores intervenientes na atividade do professor de Atendimento Educacional Especializado"</em>,
              sob orientação da Profa. Dra. Rosimar Bortolini Poker.
            </p>
            <p>
              A construção do guia contou com a colaboração direta de professoras de Atendimento Educacional Especializado (AEE)
              e das equipes do <strong>CEFAI (Centro de Apoio e Acompanhamento à Inclusão)</strong> e do
              <strong>NAAPA (Núcleo de Apoio e Acompanhamento para a Aprendizagem)</strong> da DRE Guaianases, com o objetivo
              de fortalecer o trabalho intersetorial entre <strong>Educação, Saúde, Assistência Social, Cultura, Esporte, Trabalho e Proteção dos Direitos</strong>.
            </p>
          </div>
          <div slot="footer">
            <fzl-lit-button variant="primary" @fzl-click=${() => navigate('/')}>
              🗺️ Explorar o Mapa de Equipamentos
            </fzl-lit-button>
          </div>
        </fzl-lit-card>
      </div>
    `
  }
}

if (!customElements.get('guia-sobre-view')) {
  customElements.define('guia-sobre-view', GuiaSobreView)
}
