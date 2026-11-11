import { LitElement, html, css } from 'lit'
import * as L from 'leaflet'
import '@fzl/webcomponents-lit'
import { navigate } from 'fzl-fund-appshell--lit'
import {
  DISTRITOS_GEOJSON,
  NECESSIDADES_FILTROS,
  DISTRITOS_FILTROS,
  LEGEND_ITEMS_GUIA,
  getAllEquipamentos,
  filterEquipamentos,
  getVisualStyleForEquipamento,
  formatPhoneHref,
  getGoogleMapsUrl,
  getWhatsAppShareUrl,
} from '../services/equipamentos-store.js'

const SUGESTOES_RAPIDAS = [
  { label: '🧩 Autismo / Fono / Terapias', query: 'autismo', necessidadeId: 'todos' },
  { label: '💰 BPC / LOAS / CadÚnico', query: 'bpc', necessidadeId: 'todos' },
  { label: '💉 Vacina / Posto de Saúde', query: 'vacina', necessidadeId: 'ubs-atencao-basica' },
  { label: '🦷 Dentista Especializado', query: 'dentista', necessidadeId: 'todos' },
  { label: '🏫 Inclusão na Escola (CEFAI/NAAPA)', query: '', necessidadeId: 'educacao-inclusiva' },
  { label: '💼 Emprego para PcD (CATE)', query: 'emprego', necessidadeId: 'todos' },
]

export class GuiaHomeView extends LitElement {
  static properties = {
    necessidadeId: { type: String },
    distrito: { type: String },
    searchQuery: { type: String },
    apenas24h: { type: Boolean },
    selectedEquipamento: { type: Object },
    basemap: { type: String },
    showDistritoBounds: { type: Boolean },
    mobileTab: { type: String }, // 'ambos' | 'mapa' | 'lista'
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      padding: 12px 16px 40px;
      box-sizing: border-box;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
      color: var(--md-sys-color-on-surface, #0f172a);
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    /* Banner de Boas-vindas acolhedor para famílias e educadores */
    .welcome-banner {
      background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(2, 132, 199, 0.18);
    }

    .welcome-text {
      max-width: 780px;
    }

    .welcome-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .welcome-text h1 {
      margin: 0 0 6px;
      font-size: clamp(1.25rem, 2.5vw, 1.65rem);
      line-height: 1.25;
      font-weight: 800;
    }

    .welcome-text p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
      opacity: 0.95;
    }

    .welcome-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .banner-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      text-decoration: none;
    }

    .banner-btn:hover {
      transform: translateY(-1px);
    }

    .banner-btn.white {
      background: #ffffff;
      color: #0369a1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .banner-btn.emergency {
      background: #dc2626;
      color: #ffffff;
      border-color: #fecaca;
    }

    /* Painel de Filtros Passo a Passo */
    .filters-panel {
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 18px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }

    .step-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1e293b);
      margin: 0 0 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 800;
    }

    /* Botões de Necessidade (Grandes e claros para leigos) */
    .needs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }

    .need-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 2px solid var(--md-sys-color-outline-variant, #e2e8f0);
      background: var(--md-sys-color-surface, #f8fafc);
      color: var(--md-sys-color-on-surface, #1e293b);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: all 0.15s ease;
    }

    .need-pill:hover {
      border-color: #94a3b8;
      background: var(--md-sys-color-surface-container, #f1f5f9);
    }

    .need-pill.active {
      border-color: var(--need-color, #0284c7);
      background: var(--need-bg, #e0f2fe);
      color: #0f172a;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15);
    }

    .need-icon {
      font-size: 1.45rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .need-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .need-title {
      font-size: 0.84rem;
      font-weight: 700;
      line-height: 1.25;
    }

    .need-count {
      font-size: 0.74rem;
      opacity: 0.78;
      margin-top: 2px;
      font-weight: 600;
    }

    /* Linha de Bairro + Busca por texto */
    .search-and-district-row {
      display: grid;
      grid-template-columns: 1.1fr 1.4fr;
      gap: 16px;
      align-items: start;
      padding-top: 14px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #e2e8f0);
    }

    @media (max-width: 900px) {
      .search-and-district-row {
        grid-template-columns: 1fr;
      }
    }

    .district-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .district-btn {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1.5px solid var(--md-sys-color-outline-variant, #cbd5e1);
      background: var(--md-sys-color-surface, #ffffff);
      color: var(--md-sys-color-on-surface, #334155);
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .district-btn:hover {
      border-color: #0284c7;
    }

    .district-btn.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    .quick-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
    }

    .quick-chips-label {
      font-size: 0.76rem;
      color: var(--md-sys-color-on-surface-variant, #64748b);
      font-weight: 600;
    }

    .quick-chip {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid #bae6fd;
      background: #f0f9ff;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }

    .quick-chip:hover {
      background: #e0f2fe;
    }

    /* Barra de Status dos Resultados */
    .results-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding: 10px 14px;
      background: var(--md-sys-color-surface-container-low, #f1f5f9);
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
    }

    .results-summary {
      font-size: 0.92rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .count-pill {
      background: #0284c7;
      color: #ffffff;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .filter-24h-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      padding: 5px 12px;
      border-radius: 999px;
      cursor: pointer;
      user-select: none;
    }

    /* Layout Principal: Mapa + Lista de Cartões */
    .explorer-split {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 18px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .explorer-split {
        grid-template-columns: 1fr;
      }
    }

    /* Coluna do Mapa */
    .map-column {
      position: sticky;
      top: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (max-width: 1024px) {
      .map-column {
        position: static;
      }
    }

    .map-card {
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    }

    .map-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.82rem;
    }

    .map-toolbar-title {
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .map-toolbar-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .map-select {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.78rem;
      font-family: inherit;
      cursor: pointer;
    }

    .map-viewport-box {
      width: 100%;
      height: 500px;
      position: relative;
    }

    @media (max-width: 640px) {
      .map-viewport-box {
        height: 370px;
      }
    }

    .map-footer-legend {
      padding: 10px 14px;
      background: var(--md-sys-color-surface, #f8fafc);
      border-top: 1px solid var(--md-sys-color-outline-variant, #e2e8f0);
    }

    .legend-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface-variant, #475569);
      margin: 0 0 6px;
    }

    /* Cartão em Destaque quando clica num pino do mapa */
    .selected-spot-banner {
      background: #f0f9ff;
      border: 2px solid #0284c7;
      border-radius: 12px;
      padding: 14px 16px;
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.14);
    }

    .selected-spot-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .selected-spot-header h3 {
      margin: 0;
      font-size: 1.05rem;
      color: #0369a1;
    }

    .close-spot-btn {
      background: transparent;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.78rem;
      cursor: pointer;
      color: #334155;
    }

    /* Coluna da Lista de Cartões */
    .cards-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .equip-card-wrapper {
      transition: transform 0.15s ease;
    }

    .equip-card-wrapper.is-selected {
      outline: 3px solid #0284c7;
      border-radius: 10px;
    }

    /* Conteúdo interno amigável de cada <fzl-lit-card> */
    .card-inner {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .tag-distrito {
      background: #e2e8f0;
      color: #1e293b;
    }

    .tag-24h {
      background: #dc2626;
      color: #ffffff;
    }

    .como-acessar-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 0.86rem;
      line-height: 1.45;
      color: #14532d;
    }

    .como-acessar-box strong {
      display: block;
      margin-bottom: 2px;
      color: #15803d;
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .info-icon {
      flex-shrink: 0;
      font-size: 1rem;
      line-height: 1.3;
    }

    /* Botões de Ação Rápida para Celular / Usuário Leigo */
    .card-actions-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
      padding-top: 4px;
    }

    .action-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      font-family: inherit;
      transition: filter 0.15s ease;
    }

    .action-link:hover {
      filter: brightness(0.95);
    }

    .action-call {
      background: #16a34a;
      color: #ffffff;
    }

    .action-call-plantao {
      background: #dc2626;
      color: #ffffff;
    }

    .action-maps {
      background: #0284c7;
      color: #ffffff;
    }

    .action-pin {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .action-whatsapp {
      background: #dcfce7;
      color: #166534;
      border-color: #86efac;
    }

    .empty-box {
      padding: 36px 20px;
      text-align: center;
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
    }
  `

  constructor() {
    super()
    this.necessidadeId = 'todos'
    this.distrito = 'todos'
    this.searchQuery = ''
    this.apenas24h = false
    this.selectedEquipamento = null
    this.basemap = 'osm'
    this.showDistritoBounds = true
    this.mobileTab = 'ambos'
    this._markersLayerGroup = null
    this._markerById = new Map()
  }

  firstUpdated() {
    this._setupMapOverlays()
  }

  updated(changed) {
    if (
      changed.has('necessidadeId') ||
      changed.has('distrito') ||
      changed.has('searchQuery') ||
      changed.has('apenas24h') ||
      changed.has('selectedEquipamento')
    ) {
      this._renderMapMarkers()
    }
  }

  _getGeoMapEl() {
    return this.renderRoot?.querySelector('fzl-geo-map') || null
  }

  _setupMapOverlays() {
    const geoMap = this._getGeoMapEl()
    if (!geoMap) return

    // Aguarda um frame para garantir que _initMap() do <fzl-geo-map> criou o _mapInstance
    requestAnimationFrame(() => {
      const leafletMap = geoMap._mapInstance
      if (!leafletMap) return

      // Injeta CSS dos marcadores customizados dentro do ShadowRoot do <fzl-geo-map>
      if (geoMap.shadowRoot && !geoMap.shadowRoot.querySelector('#guia-custom-pins-css')) {
        const styleEl = document.createElement('style')
        styleEl.id = 'guia-custom-pins-css'
        styleEl.textContent = `
          .guia-map-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 4px;
            transform: rotate(-45deg);
            border: 2.5px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            transition: transform 0.15s ease;
          }
          .guia-map-pin.is-selected {
            width: 40px;
            height: 40px;
            border: 3px solid #fde047;
            box-shadow: 0 0 0 5px rgba(2, 132, 199, 0.45), 0 4px 12px rgba(0,0,0,0.45);
            z-index: 999 !important;
          }
          .guia-map-pin-icon {
            transform: rotate(45deg);
            font-size: 15px;
            line-height: 1;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 10px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
        `
        geoMap.shadowRoot.appendChild(styleEl)
      }

      // Adiciona os limites territoriais dos 3 distritos (Cidade Tiradentes, Guaianases e Lajeado)
      if (this.showDistritoBounds) {
        geoMap.setGeoJsonLayer('municipios', DISTRITOS_GEOJSON, false)
      }

      this._markersLayerGroup = L.layerGroup().addTo(leafletMap)
      this._renderMapMarkers()
    })
  }

  _renderMapMarkers() {
    const geoMap = this._getGeoMapEl()
    const leafletMap = geoMap?._mapInstance
    if (!leafletMap || !this._markersLayerGroup) return

    this._markersLayerGroup.clearLayers()
    this._markerById.clear()

    const filtered = this._getFilteredItems()

    filtered.forEach((item) => {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return
      const st = getVisualStyleForEquipamento(item)
      const isSelected = this.selectedEquipamento?.id === item.id

      const icon = L.divIcon({
        className: '',
        iconSize: isSelected ? [40, 40] : [32, 32],
        iconAnchor: isSelected ? [20, 40] : [16, 32],
        popupAnchor: [0, -30],
        html: `
          <div class="guia-map-pin ${isSelected ? 'is-selected' : ''}" style="background-color: ${st.color};">
            <span class="guia-map-pin-icon">${st.icon}</span>
          </div>
        `,
      })

      const marker = L.marker([item.lat, item.lng], { icon })
      const phone = item.telefones?.[0] || item.celulares_plantao?.[0] || ''
      const phoneLink = phone
        ? `<a href="${formatPhoneHref(phone)}" style="display:inline-block;margin-top:6px;padding:5px 10px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:12px;">📞 Ligar: ${phone}</a>`
        : ''

      marker.bindPopup(`
        <div style="min-width:210px;max-width:260px;line-height:1.35;">
          <div style="font-size:11px;font-weight:700;color:${st.color};text-transform:uppercase;margin-bottom:2px;">
            ${st.icon} ${item.subtipo} • ${item.distrito}
          </div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:4px;">
            ${item.nome}
          </div>
          <div style="font-size:12px;color:#334155;margin-bottom:4px;">
            🏠 ${item.endereco_completo}
          </div>
          ${item.horario_funcionamento ? `<div style="font-size:11px;color:#475569;margin-bottom:4px;">🕒 ${item.horario_funcionamento}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
            ${phoneLink}
            <a href="${getGoogleMapsUrl(item)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;padding:5px 10px;background:#0284c7;color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:12px;">🧭 Como chegar</a>
          </div>
        </div>
      `)

      marker.on('click', () => {
        this.selectedEquipamento = item
      })

      marker.addTo(this._markersLayerGroup)
      this._markerById.set(item.id, marker)
    })
  }

  _focusEquipamentoOnMap(item) {
    this.selectedEquipamento = item
    const geoMap = this._getGeoMapEl()
    if (geoMap && typeof item.lat === 'number' && typeof item.lng === 'number') {
      geoMap.panTo(item.lat, item.lng)
      geoMap.setZoom(16)
      setTimeout(() => {
        const marker = this._markerById.get(item.id)
        if (marker) marker.openPopup()
      }, 150)
    }
    const mapCard = this.renderRoot?.querySelector('.map-card')
    if (mapCard && window.innerWidth < 1024) {
      mapCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  _selectDistrito(distId) {
    this.distrito = distId
    const meta = DISTRITOS_FILTROS.find((d) => d.id === distId)
    const geoMap = this._getGeoMapEl()
    if (meta && geoMap) {
      geoMap.panTo(meta.center[0], meta.center[1])
      geoMap.setZoom(meta.zoom)
    }
  }

  _toggleDistritosPolygon(e) {
    this.showDistritoBounds = e.target.checked
    const geoMap = this._getGeoMapEl()
    if (!geoMap) return
    if (this.showDistritoBounds) {
      geoMap.setGeoJsonLayer('municipios', DISTRITOS_GEOJSON, false)
    } else {
      geoMap.removeGeoJsonLayer('municipios')
    }
  }

  _clearAllFilters() {
    this.necessidadeId = 'todos'
    this.distrito = 'todos'
    this.searchQuery = ''
    this.apenas24h = false
    this.selectedEquipamento = null
    this._selectDistrito('todos')
  }

  _getFilteredItems() {
    return filterEquipamentos({
      necessidadeId: this.necessidadeId,
      distrito: this.distrito,
      query: this.searchQuery,
      apenas24h: this.apenas24h,
    })
  }

  render() {
    const allItems = getAllEquipamentos()
    const filteredItems = this._getFilteredItems()
    const activeNec =
      NECESSIDADES_FILTROS.find((n) => n.id === this.necessidadeId) || NECESSIDADES_FILTROS[0]

    return html`
      <!-- 1. Banner Acolhedor para o Usuário Leigo -->
      <section class="welcome-banner" aria-label="Boas-vindas ao Guia Regional">
        <div class="welcome-text">
          <span class="welcome-badge">
            🤝 Guia Regional da Zona Leste • Cidade Tiradentes, Guaianases e Lajeado
          </span>
          <h1>Encontre Saúde, Educação Inclusiva, Benefícios e Direitos perto de você</h1>
          <p>
            Feito de forma simples para <strong>famílias, estudantes com deficiência, moradores e professores</strong>.
            Escolha abaixo o que você precisa hoje para ver os locais no mapa, ligar com 1 toque ou traçar sua rota.
          </p>
        </div>

        <div class="welcome-actions">
          <button
            type="button"
            class="banner-btn white"
            @click=${() => navigate('/como-comecar')}
          >
            🧭 Não sabe onde ir? Veja o Passo a Passo
          </button>
          <button
            type="button"
            class="banner-btn emergency"
            @click=${() => navigate('/emergencias')}
          >
            🚨 Emergências e Plantão 24h
          </button>
        </div>
      </section>

      <!-- 2. Painel Passo a Passo de Filtros -->
      <section class="filters-panel" aria-label="Filtros de busca">
        <h2 class="step-label">
          <span class="step-number">1</span>
          O que você precisa hoje? (Toque em uma opção)
        </h2>

        <div class="needs-grid" role="group" aria-label="Categorias de necessidade">
          ${NECESSIDADES_FILTROS.map((nec) => {
            const count = allItems.filter((item) => nec.match(item)).length
            const isActive = this.necessidadeId === nec.id
            return html`
              <button
                type="button"
                class="need-pill ${isActive ? 'active' : ''}"
                style="--need-color: ${nec.color};"
                aria-pressed=${isActive ? 'true' : 'false'}
                @click=${() => {
                  this.necessidadeId = nec.id
                  this.selectedEquipamento = null
                }}
              >
                <span class="need-icon" aria-hidden="true">${nec.icon}</span>
                <span class="need-info">
                  <span class="need-title">${nec.shortLabel}</span>
                  <span class="need-count">${count} locais disponíveis</span>
                </span>
              </button>
            `
          })}
        </div>

        <div class="search-and-district-row">
          <!-- Escolha do Bairro/Distrito -->
          <div>
            <h2 class="step-label">
              <span class="step-number">2</span>
              Qual é o seu bairro / distrito?
            </h2>
            <div class="district-pills" role="group" aria-label="Filtrar por distrito">
              ${DISTRITOS_FILTROS.map((d) => {
                const isActive = this.distrito === d.id
                return html`
                  <button
                    type="button"
                    class="district-btn ${isActive ? 'active' : ''}"
                    aria-pressed=${isActive ? 'true' : 'false'}
                    @click=${() => this._selectDistrito(d.id)}
                  >
                    📍 ${d.label}
                  </button>
                `
              })}
            </div>
          </div>

          <!-- Busca por palavra-chave cotidiana -->
          <div>
            <h2 class="step-label">
              <span class="step-number">3</span>
              Ou digite o que procura (serviço, rua ou nome do local):
            </h2>
            <fzl-text-input
              placeholder="Ex: autismo, fono, vacina, BPC, dentista, cadeira de rodas, Metalúrgicos..."
              .value=${this.searchQuery}
              @fzl-input=${(e) => {
                this.searchQuery = e.detail.value
              }}
            ></fzl-text-input>

            <div class="quick-chips">
              <span class="quick-chips-label">Buscas rápidas:</span>
              ${SUGESTOES_RAPIDAS.map(
                (sug) => html`
                  <button
                    type="button"
                    class="quick-chip"
                    @click=${() => {
                      this.necessidadeId = sug.necessidadeId
                      this.searchQuery = sug.query
                    }}
                  >
                    ${sug.label}
                  </button>
                `
              )}
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Barra de Resumo dos Resultados -->
      <div class="results-bar">
        <div class="results-summary">
          <span class="count-pill">${filteredItems.length} locais encontrados</span>
          <span>
            Mostrando: <strong>${activeNec.label}</strong>
            ${this.distrito !== 'todos' ? html` em <strong>${this.distrito}</strong>` : ''}
            ${this.searchQuery ? html` para <strong>"${this.searchQuery}"</strong>` : ''}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <label class="filter-24h-label">
            <input
              type="checkbox"
              .checked=${this.apenas24h}
              @change=${(e) => {
                this.apenas24h = e.target.checked
              }}
            />
            🚨 Mostrar apenas locais 24 horas
          </label>

          ${this.necessidadeId !== 'todos' ||
          this.distrito !== 'todos' ||
          this.searchQuery ||
          this.apenas24h
            ? html`
                <fzl-lit-button
                  variant="secondary"
                  size="sm"
                  @fzl-click=${() => this._clearAllFilters()}
                >
                  Limpar filtros
                </fzl-lit-button>
              `
            : ''}
        </div>
      </div>

      <!-- 4. Área Principal: Mapa Interativo (<fzl-geo-map>) + Lista de Locais (<fzl-lit-card>) -->
      <div class="explorer-split">
        <!-- Coluna Esquerda: Mapa -->
        <div class="map-column">
          ${this.selectedEquipamento
            ? this._renderSelectedBanner(this.selectedEquipamento)
            : ''}

          <div class="map-card">
            <div class="map-toolbar">
              <div class="map-toolbar-title">
                🗺️ Mapa Interativo dos Equipamentos Públicos
              </div>

              <div class="map-toolbar-controls">
                <label style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
                  <input
                    type="checkbox"
                    .checked=${this.showDistritoBounds}
                    @change=${(e) => this._toggleDistritosPolygon(e)}
                  />
                  <span>Limites dos Bairros</span>
                </label>

                <select
                  class="map-select"
                  aria-label="Tipo de Mapa"
                  .value=${this.basemap}
                  @change=${(e) => {
                    this.basemap = e.target.value
                    this._getGeoMapEl()?.setBasemap(this.basemap)
                  }}
                >
                  <option value="osm">Mapa de Ruas (OpenStreetMap)</option>
                  <option value="carto-light">Mapa Claro Simplificado</option>
                  <option value="esri-satellite">Foto de Satélite</option>
                </select>
              </div>
            </div>

            <div class="map-viewport-box">
              <fzl-geo-map
                .center=${[-23.562, -46.406]}
                .zoom=${13}
                .basemap=${this.basemap}
                .showGrid=${false}
              ></fzl-geo-map>
            </div>

            <div class="map-footer-legend">
              <p class="legend-title">🎨 Cores dos Pinos no Mapa (toque em qualquer pino para ver os dados):</p>
              <fzl-geo-legend .items=${LEGEND_ITEMS_GUIA}></fzl-geo-legend>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Lista de Cartões Detalhados -->
        <div class="cards-column">
          ${filteredItems.length === 0
            ? html`
                <div class="empty-box">
                  <h3 style="margin: 0 0 8px;">Nenhum local encontrado com esses filtros</h3>
                  <p style="margin: 0 0 16px; color: #64748b;">
                    Tente limpar a busca ou escolher "Todos os Bairros / Distritos".
                  </p>
                  <fzl-lit-button
                    variant="primary"
                    @fzl-click=${() => this._clearAllFilters()}
                  >
                    Ver todos os 78 locais
                  </fzl-lit-button>
                </div>
              `
            : filteredItems.map((item) => this._renderEquipamentoCard(item))}
        </div>
      </div>
    `
  }

  _renderSelectedBanner(item) {
    const st = getVisualStyleForEquipamento(item)
    return html`
      <div class="selected-spot-banner" role="region" aria-label="Local selecionado no mapa">
        <div class="selected-spot-header">
          <div>
            <span class="tag-pill" style="background:${st.color};color:#fff;margin-bottom:4px;">
              ${st.icon} ${item.subtipo} • ${item.distrito}
            </span>
            <h3>${item.nome}</h3>
          </div>
          <button
            type="button"
            class="close-spot-btn"
            @click=${() => {
              this.selectedEquipamento = null
            }}
          >
            ✕ Fechar destaque
          </button>
        </div>

        <p style="margin: 4px 0 8px; font-size: 0.88rem;">
          🏠 <strong>Endereço:</strong> ${item.endereco_completo}
        </p>

        <div class="como-acessar-box" style="margin-bottom: 10px;">
          <strong>💡 Como ser atendido neste local:</strong>
          ${item.como_acessar}
        </div>

        <div class="card-actions-bar">
          ${(item.telefones || []).map(
            (tel) => html`
              <a class="action-link action-call" href=${formatPhoneHref(tel)}>
                📞 Ligar: ${tel}
              </a>
            `
          )}
          <a
            class="action-link action-maps"
            href=${getGoogleMapsUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
          >
            🧭 Como Chegar (Google Maps)
          </a>
          <a
            class="action-link action-whatsapp"
            href=${getWhatsAppShareUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
          >
            📲 Enviar no WhatsApp
          </a>
        </div>
      </div>
    `
  }

  _renderEquipamentoCard(item) {
    const st = getVisualStyleForEquipamento(item)
    const isSelected = this.selectedEquipamento?.id === item.id

    return html`
      <div class="equip-card-wrapper ${isSelected ? 'is-selected' : ''}">
        <fzl-lit-card
          .title=${`${st.icon} ${item.nome}`}
          .subtitle=${`${item.subtipo} • Bairro: ${item.bairro || item.distrito}`}
          .badge=${item.urgencia_24h ? '🚨 ABERTO 24H' : st.shortTag}
          .badgeVariant=${st.badgeVariant}
          body-max-height="none"
        >
          <div class="card-inner">
            <div class="badges-row">
              <span class="tag-pill tag-distrito">📍 Distrito: ${item.distrito}</span>
              ${item.urgencia_24h
                ? html`<span class="tag-pill tag-24h">⏰ Atendimento 24 Horas</span>`
                : ''}
            </div>

            <!-- Explicação simples para o usuário leigo -->
            <div class="como-acessar-box">
              <strong>💡 Para que serve e como acessar:</strong>
              ${item.como_acessar}
            </div>

            <!-- Endereço -->
            <div class="info-row">
              <span class="info-icon" aria-hidden="true">🏠</span>
              <div>
                <strong>Endereço:</strong> ${item.endereco_completo}
              </div>
            </div>

            <!-- Serviços oferecidos -->
            ${item.servicos_oferecidos
              ? html`
                  <div class="info-row">
                    <span class="info-icon" aria-hidden="true">🩺</span>
                    <div>
                      <strong>O que oferece:</strong> ${item.servicos_oferecidos}
                    </div>
                  </div>
                `
              : ''}

            <!-- Horário de funcionamento -->
            ${item.horario_funcionamento
              ? html`
                  <div class="info-row">
                    <span class="info-icon" aria-hidden="true">🕒</span>
                    <div>
                      <strong>Horário de atendimento:</strong> ${item.horario_funcionamento}
                    </div>
                  </div>
                `
              : ''}

            <!-- E-mail ou Observações importantes -->
            ${item.email
              ? html`
                  <div class="info-row">
                    <span class="info-icon" aria-hidden="true">✉️</span>
                    <div>
                      <strong>E-mail:</strong>
                      <a href="mailto:${item.email}" style="color:#0284c7;font-weight:600;">
                        ${item.email}
                      </a>
                    </div>
                  </div>
                `
              : ''}
            ${item.observacoes
              ? html`
                  <div class="info-row">
                    <span class="info-icon" aria-hidden="true">📌</span>
                    <div>
                      <strong>Observação:</strong> ${item.observacoes}
                    </div>
                  </div>
                `
              : ''}
          </div>

          <div slot="footer" class="card-actions-bar">
            ${(item.telefones || []).slice(0, 2).map(
              (tel) => html`
                <a class="action-link action-call" href=${formatPhoneHref(tel)}>
                  📞 Ligar: ${tel}
                </a>
              `
            )}
            ${(item.celulares_plantao || []).slice(0, 1).map(
              (cel) => html`
                <a class="action-link action-call-plantao" href=${formatPhoneHref(cel)}>
                  🚨 ${cel}
                </a>
              `
            )}

            <button
              type="button"
              class="action-link action-pin"
              @click=${() => this._focusEquipamentoOnMap(item)}
            >
              📍 Ver no Mapa
            </button>

            <a
              class="action-link action-maps"
              href=${getGoogleMapsUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
            >
              🧭 Como Chegar
            </a>

            <a
              class="action-link action-whatsapp"
              href=${getWhatsAppShareUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
            >
              📲 WhatsApp
            </a>
          </div>
        </fzl-lit-card>
      </div>
    `
  }
}

if (!customElements.get('guia-home-view')) {
  customElements.define('guia-home-view', GuiaHomeView)
}
