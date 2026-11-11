import { html } from 'lit'
import 'fzl-fund-appshell--lit/styles/theme.css'
import { createAppShell, navigate, pattern } from 'fzl-fund-appshell--lit'
import './webcomponents/guia-home-view.js'
import './webcomponents/guia-como-comecar-view.js'
import './webcomponents/guia-emergencias-view.js'
import './webcomponents/guia-tabela-view.js'
import './webcomponents/guia-sobre-view.js'

createAppShell({
  mount: '#app',
  title: 'Guia Regional — Zona Leste SP',
  home: () => html`<guia-home-view></guia-home-view>`,
  routes: [
    {
      name: 'como-comecar',
      match: pattern('como-comecar'),
      title: 'Por Onde Começar? (Passo a Passo)',
      crumb: [{ label: 'Por Onde Começar?' }],
      render: () => html`<guia-como-comecar-view></guia-como-comecar-view>`,
    },
    {
      name: 'emergencias',
      match: pattern('emergencias'),
      title: 'Urgências e Plantão 24h',
      crumb: [{ label: 'Urgências 24h' }],
      render: () => html`<guia-emergencias-view></guia-emergencias-view>`,
    },
    {
      name: 'tabela',
      match: pattern('tabela'),
      title: 'Lista Completa em Tabela',
      crumb: [{ label: 'Tabela de Equipamentos' }],
      render: () => html`<guia-tabela-view></guia-tabela-view>`,
    },
    {
      name: 'sobre',
      match: pattern('sobre'),
      title: 'Sobre o Guia Regional',
      crumb: [{ label: 'Sobre o Guia' }],
      render: () => html`<guia-sobre-view></guia-sobre-view>`,
    },
  ],
  drawer: {
    sections: [
      {
        id: 'navegacao',
        label: 'Guia Regional (Zona Leste)',
        expanded: true,
        items: [
          { id: 'home', label: '🗺️ Mapa e Busca de Locais', href: '#/' },
          { id: 'como-comecar', label: '🧭 Por Onde Começar? (Ajuda)', href: '#/como-comecar' },
          { id: 'emergencias', label: '🚨 Urgências e Plantão 24h', href: '#/emergencias' },
          { id: 'tabela', label: '📋 Tabela Completa (78 Locais)', href: '#/tabela' },
          { id: 'sobre', label: '📖 Sobre este Guia (DREG / UNESP)', href: '#/sobre' },
        ],
      },
    ],
    // App público de utilidade comunitária: não exige login ("conta: false"),
    // mas mantém "config: true" para temas (claro/escuro/alto contraste),
    // fontes acessíveis (Atkinson Hyperlegible e OpenDyslexic) e tamanho da letra.
    shellSections: { conta: false, config: true },
  },
  headerActions: () => html`
    <div style="display:flex;align-items:center;gap:8px;">
      <button
        type="button"
        style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-weight:700;font-size:0.8rem;cursor:pointer;"
        @click=${() => navigate('/emergencias')}
      >
        🚨 24h
      </button>
    </div>
  `,
  share: {
    enabled: true,
    title: 'Compartilhar o Guia Regional com famílias e educadores',
    text: 'Consulte o Guia Regional de Saúde, Educação Inclusiva, Benefícios (CRAS/BPC) e Direitos de Cidade Tiradentes, Guaianases e Lajeado:',
  },
})
