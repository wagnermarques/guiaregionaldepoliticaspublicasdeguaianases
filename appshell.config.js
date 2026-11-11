import { defineAppShellConfig } from 'fzl-fund-appshell--lit/config'

export default defineAppShellConfig({
  title: 'Guia Regional de Políticas Públicas — Zona Leste SP',
  storagePrefix: 'fzl-guiaregional',
  accessibility: {
    fonts: ['atkinson', 'opendyslexic'],
    themes: ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'],
    textScale: { min: 1, max: 2 },
    defaults: { font: 'system', theme: 'light', textScale: 1 },
  },
  analytics: {
    requireConsent: false,
  },
  base: process.env.VITE_BASE_PATH || '/',
  manifest: {
    name: 'Guia Regional de Políticas Públicas — DREG Guaianases',
    short_name: 'Guia Regional',
    description: 'Mapa e Guia Acessível de Equipamentos Públicos de Saúde, Educação Inclusiva, Assistência Social, Direitos, Cultura e Lazer em Cidade Tiradentes, Guaianases e Lajeado',
    lang: 'pt-BR',
    start_url: '.',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0284c7',
    icons: [
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  },
  workbox: {
    maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  },
})
