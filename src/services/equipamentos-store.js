import equipamentosData from '../data/equipamentos.json'
import distritosGeoJson from '../data/distritos.geojson?raw'
import { supabase } from './supabase-client.js'

export const DISTRITOS_GEOJSON = JSON.parse(distritosGeoJson)

// Lista reativa em memória com mesclagem de dados estáticos + atualizações em nuvem
let dynamicEquipamentos = [...equipamentosData]
const storeListeners = new Set()

export function subscribeEquipamentos(callback) {
  storeListeners.add(callback)
  callback(dynamicEquipamentos)
  return () => storeListeners.delete(callback)
}

function notifyStoreChange() {
  storeListeners.forEach((fn) => {
    try {
      fn(dynamicEquipamentos)
    } catch (err) {
      console.warn('Erro ao notificar listener do store:', err)
    }
  })
}

/**
 * Carrega alterações do banco Supabase em tempo real (se online)
 * e mescla com os 78 equipamentos do JSON base.
 */
export async function syncEquipamentosFromCloud() {
  if (!supabase) return dynamicEquipamentos
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .order('id', { ascending: true })

    if (error || !data || data.length === 0) return dynamicEquipamentos

    // Mapeia atualizações da nuvem sobre os dados estáticos
    const map = new Map(equipamentosData.map((e) => [Number(e.id), { ...e }]))
    data.forEach((cloudItem) => {
      const id = Number(cloudItem.id)
      const existing = map.get(id) || {}
      map.set(id, {
        ...existing,
        ...cloudItem,
        telefones: Array.isArray(cloudItem.telefones) ? cloudItem.telefones : (existing.telefones || []),
        celulares_plantao: Array.isArray(cloudItem.celulares_plantao) ? cloudItem.celulares_plantao : (existing.celulares_plantao || []),
      })
    })

    dynamicEquipamentos = Array.from(map.values())
    notifyStoreChange()
    return dynamicEquipamentos
  } catch (err) {
    console.warn('Falha ao sincronizar equipamentos da nuvem (mantendo cache local):', err)
    return dynamicEquipamentos
  }
}

// Inicia busca em background se configurado
if (typeof window !== 'undefined' && supabase) {
  setTimeout(() => {
    syncEquipamentosFromCloud()
  }, 100)
}

/**
 * Salva ou atualiza um equipamento no Supabase (restrito a 'guia_admin' via RLS).
 */
export async function saveEquipamentoCloud(equipamentoData) {
  if (!supabase) throw new Error('Supabase não configurado')
  const id = Number(equipamentoData.id)
  if (!id) throw new Error('ID do equipamento inválido')

  const payload = {
    id,
    nome: equipamentoData.nome,
    categoria: equipamentoData.categoria,
    subtipo: equipamentoData.subtipo,
    distrito: equipamentoData.distrito,
    regiao: equipamentoData.regiao || 'Zona Leste',
    endereco_completo: equipamentoData.endereco_completo,
    bairro: equipamentoData.bairro || '',
    cep: equipamentoData.cep || '',
    telefones: Array.isArray(equipamentoData.telefones) ? equipamentoData.telefones : [],
    celulares_plantao: Array.isArray(equipamentoData.celulares_plantao) ? equipamentoData.celulares_plantao : [],
    email: equipamentoData.email || '',
    horario_funcionamento: equipamentoData.horario_funcionamento || '',
    servicos_oferecidos: equipamentoData.servicos_oferecidos || '',
    observacoes: equipamentoData.observacoes || '',
    como_acessar: equipamentoData.como_acessar || '',
    urgencia_24h: Boolean(equipamentoData.urgencia_24h),
    lat: equipamentoData.lat ? Number(equipamentoData.lat) : null,
    lng: equipamentoData.lng ? Number(equipamentoData.lng) : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('equipamentos')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Erro ao salvar equipamento no Supabase')
  }

  // Atualiza cache em memória
  const index = dynamicEquipamentos.findIndex((e) => Number(e.id) === id)
  if (index >= 0) {
    dynamicEquipamentos[index] = { ...dynamicEquipamentos[index], ...data }
  } else {
    dynamicEquipamentos.push(data)
  }
  notifyStoreChange()
  return data
}

/**
 * Grupos pensados para o usuário leigo (mães, pais, responsáveis, moradores e educadores),
 * traduzindo siglas técnicas em necessidades reais do dia a dia.
 */
export const NECESSIDADES_FILTROS = [
  {
    id: 'todos',
    label: 'Todos os Locais',
    shortLabel: 'Todos',
    icon: '📍',
    color: '#0284c7',
    description: 'Todos os 78 equipamentos públicos de Saúde, Educação, Assistência, Direitos, Cultura, Esporte e Trabalho.',
    match: () => true,
  },
  {
    id: 'ubs-atencao-basica',
    label: 'Postos de Saúde (UBS e AMA)',
    shortLabel: 'Postos de Saúde (UBS)',
    icon: '🩺',
    color: '#0284c7',
    description: 'Consultas médicas, vacinas, pediatria, pré-natal, retirada de remédios e encaminhamentos para especialistas.',
    match: (e) =>
      e.subtipo.includes('UBS') ||
      e.subtipo.includes('Assistência Médica Ambulatorial') ||
      e.subtipo.includes('AMA Especialidades'),
  },
  {
    id: 'reabilitacao-autismo',
    label: 'Reabilitação, Terapias e Autismo (CER e CAPS Infantil)',
    shortLabel: 'Terapias, CER e Autismo',
    icon: '🧩',
    color: '#7c3aed',
    description: 'Fonoaudiologia, terapia ocupacional, fisioterapia, psicologia, cadeira de rodas/órteses (CER II) e saúde mental infantil (CAPS Infantojuvenil).',
    match: (e) =>
      e.subtipo.includes('CER') ||
      e.nome.toLowerCase().includes('infantojuvenil'),
  },
  {
    id: 'urgencia-24h',
    label: 'Emergência 24h (Hospitais, UPA e Pronto Socorro)',
    shortLabel: 'Emergência 24h',
    icon: '🚨',
    color: '#dc2626',
    description: 'Atendimento médico imediato 24 horas para urgências, emergências, febre alta, acidentes ou crises agudas.',
    match: (e) =>
      e.subtipo.includes('Hospital') ||
      e.subtipo.includes('UPA') ||
      e.subtipo.includes('Pronto Atendimento'),
  },
  {
    id: 'saude-mental-odonto',
    label: 'Saúde Mental Adulto, Dentista (CEO) e Saúde Integral',
    shortLabel: 'CAPS, Dentista e Outros',
    icon: '🦷',
    color: '#0d9488',
    description: 'CAPS Adulto, CAPS Álcool e Drogas, Dentista Especializado para Pessoas com Deficiência (CEO II), Casa SER e Práticas Naturais.',
    match: (e) =>
      (e.subtipo.includes('CAPS') && !e.nome.toLowerCase().includes('infantojuvenil')) ||
      e.subtipo.includes('CEO') ||
      e.subtipo.includes('Sexual') ||
      e.subtipo.includes('Práticas Naturais') ||
      e.subtipo.includes('Supervisão Técnica de Saúde'),
  },
  {
    id: 'educacao-inclusiva',
    label: 'Educação Inclusiva e Apoio Escolar (CEFAI, NAAPA e DREG)',
    shortLabel: 'Educação Inclusiva',
    icon: '🏫',
    color: '#2563eb',
    description: 'Apoio à inclusão escolar (CEFAI), dificuldades de aprendizagem (NAAPA) e Diretoria Regional de Educação de Guaianases (DREG).',
    match: (e) => e.categoria === 'Educação',
  },
  {
    id: 'assistencia-social',
    label: 'Benefícios Sociais, BPC/LOAS e CadÚnico (CRAS e CREAS)',
    shortLabel: 'CRAS / CREAS / BPC',
    icon: '🤝',
    color: '#ea580c',
    description: 'Cadastro Único (CadÚnico), Bolsa Família, Benefício de Prestação Continuada (BPC/LOAS para pessoa com deficiência) e proteção a famílias.',
    match: (e) => e.categoria === 'Assistência Social',
  },
  {
    id: 'direitos',
    label: 'Conselho Tutelar e Defesa de Direitos (MPSP)',
    shortLabel: 'Conselho Tutelar e Direitos',
    icon: '🛡️',
    color: '#b91c1c',
    description: 'Defesa dos direitos da criança, adolescente e pessoa com deficiência, falta de vaga escolar ou recusa de atendimento.',
    match: (e) => e.categoria === 'Proteção dos Direitos',
  },
  {
    id: 'cultura-esporte-trabalho',
    label: 'Cultura, Esporte, Lazer e Vagas de Emprego (CATE)',
    shortLabel: 'Cultura, Lazer e Trabalho',
    icon: '🎭',
    color: '#16a34a',
    description: 'Oficinas culturais gratuitas, Fábrica de Cultura, Casas de Cultura, Clubes Esportivos (CEL/CDC) e vagas de emprego para PcD (CATE).',
    match: (e) =>
      e.categoria === 'Cultura' ||
      e.categoria === 'Esporte e Lazer' ||
      e.categoria === 'Trabalho',
  },
]

export const DISTRITOS_FILTROS = [
  { id: 'todos', label: 'Todos os Bairros / Distritos', center: [-23.562, -46.406], zoom: 13 },
  { id: 'Cidade Tiradentes', label: 'Cidade Tiradentes', center: [-23.584, -46.399], zoom: 14 },
  { id: 'Guaianases', label: 'Guaianases', center: [-23.546, -46.413], zoom: 14 },
  { id: 'Lajeado', label: 'Lajeado', center: [-23.535, -46.406], zoom: 14 },
]

/**
 * Dicionário de sinônimos do cotidiano para ajudar o usuário leigo a encontrar
 * o serviço certo mesmo usando palavras informais.
 */
const SINONIMOS_BUSCA = [
  {
    palavras: ['autismo', 'tea', 'autista', 'fono', 'fonoaudiologo', 'fonoaudiologia', 'terapia', 'psicologo', 'psicologia', 'to', 'terapia ocupacional', 'fisioterapia', 'cadeira de rodas', 'ortese', 'protese', 'reabilitacao', 'deficiencia', 'laudo', 'neuro'],
    matchEquipamento: (e) =>
      e.subtipo.includes('CER') ||
      e.subtipo.includes('CAPS') ||
      e.categoria === 'Educação' ||
      e.subtipo.includes('AMA Especialidades'),
  },
  {
    palavras: ['bpc', 'loas', 'beneficio', 'auxilio', 'bolsa familia', 'cadunico', 'cadastro unico', 'cesta basica', 'assistente social', 'vulnerabilidade', 'pobreza', 'renda'],
    matchEquipamento: (e) => e.categoria === 'Assistência Social',
  },
  {
    palavras: ['dentista', 'dente', 'odonto', 'odontologico', 'boca'],
    matchEquipamento: (e) => e.subtipo.includes('CEO') || e.subtipo.includes('UBS'),
  },
  {
    palavras: ['vacina', 'vacinacao', 'posto', 'postinho', 'pediatra', 'pre-natal', 'gravidez', 'gestante', 'remedio', 'farmacia', 'pressao', 'diabetes'],
    matchEquipamento: (e) => e.subtipo.includes('UBS'),
  },
  {
    palavras: ['emergencia', 'urgencia', 'pronto socorro', 'ps', 'hospital', 'upa', '24h', '24 horas', 'febre', 'acidente', 'internacao'],
    matchEquipamento: (e) => e.urgencia_24h || e.subtipo.includes('AMA'),
  },
  {
    palavras: ['escola', 'escolar', 'creche', 'cei', 'emei', 'emef', 'aee', 'sala de recursos', 'srm', 'inclusao', 'professor', 'aprendizagem', 'vaga escolar'],
    matchEquipamento: (e) => e.categoria === 'Educação' || e.subtipo.includes('Conselho Tutelar'),
  },
  {
    palavras: ['emprego', 'trabalho', 'vaga', 'curriculo', 'carteira de trabalho', 'curso profissionalizante'],
    matchEquipamento: (e) => e.categoria === 'Trabalho',
  },
  {
    palavras: ['violencia', 'abuso', 'maus tratos', 'agressao', 'abandono', 'denuncia', 'direito', 'conselho'],
    matchEquipamento: (e) => e.categoria === 'Proteção dos Direitos' || e.subtipo === 'CREAS',
  },
  {
    palavras: ['esporte', 'futebol', 'ginastica', 'lazer', 'oficina', 'musica', 'teatro', 'danca', 'cultura', 'hip hop', 'capoeira', 'karate', 'biblioteca'],
    matchEquipamento: (e) => e.categoria === 'Cultura' || e.categoria === 'Esporte e Lazer',
  },
]

function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function getVisualStyleForEquipamento(e) {
  const sub = e.subtipo || ''
  if (sub.includes('Hospital') || sub.includes('UPA') || sub.includes('Pronto Atendimento')) {
    return { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: '🚨', shortTag: 'Urgência 24h', badgeVariant: 'danger' }
  }
  if (sub.includes('CER')) {
    return { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', icon: '🧩', shortTag: 'Reabilitação (CER)', badgeVariant: 'info' }
  }
  if (sub.includes('CAPS')) {
    return { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: '🧠', shortTag: 'Saúde Mental (CAPS)', badgeVariant: 'info' }
  }
  if (sub.includes('CEO')) {
    return { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: '🦷', shortTag: 'Odontologia (CEO)', badgeVariant: 'success' }
  }
  if (sub.includes('AMA')) {
    return { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: '🏥', shortTag: 'AMA / Pronto Atend.', badgeVariant: 'info' }
  }
  if (sub.includes('UBS')) {
    return { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', icon: '🩺', shortTag: 'Posto de Saúde (UBS)', badgeVariant: 'info' }
  }
  if (e.categoria === 'Educação') {
    return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🏫', shortTag: 'Educação Inclusiva', badgeVariant: 'info' }
  }
  if (e.categoria === 'Assistência Social') {
    return { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: '🤝', shortTag: e.subtipo, badgeVariant: 'warning' }
  }
  if (e.categoria === 'Proteção dos Direitos') {
    return { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: '🛡️', shortTag: e.subtipo, badgeVariant: 'danger' }
  }
  if (e.categoria === 'Trabalho') {
    return { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: '💼', shortTag: 'Emprego (CATE)', badgeVariant: 'success' }
  }
  if (e.categoria === 'Cultura') {
    return { color: '#ca8a04', bg: '#fefce8', border: '#fde047', icon: '🎭', shortTag: 'Cultura', badgeVariant: 'warning' }
  }
  if (e.categoria === 'Esporte e Lazer') {
    return { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '⚽', shortTag: 'Esporte e Lazer', badgeVariant: 'success' }
  }
  return { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: '🏛️', shortTag: e.categoria, badgeVariant: 'default' }
}

export function getAllEquipamentos() {
  return dynamicEquipamentos
}

export function getEquipamentoById(id) {
  return dynamicEquipamentos.find((e) => Number(e.id) === Number(id)) || null
}

export function filterEquipamentos({
  necessidadeId = 'todos',
  distrito = 'todos',
  query = '',
  apenas24h = false,
} = {}) {
  const nec = NECESSIDADES_FILTROS.find((n) => n.id === necessidadeId) || NECESSIDADES_FILTROS[0]
  const cleanQuery = normalizeText(query)

  return dynamicEquipamentos.filter((e) => {
    if (!nec.match(e)) return false

    if (distrito !== 'todos') {
      const distItem = e.distrito || ''
      if (!distItem.includes(distrito) && distItem !== 'Sé / Central') {
        return false
      }
      // Só mostra Sé/Central no filtro de distrito específico se a pessoa buscou por direitos ou todos
      if (distItem === 'Sé / Central' && necessidadeId !== 'direitos') {
        return false
      }
    }

    if (apenas24h && !e.urgencia_24h) {
      return false
    }

    if (cleanQuery) {
      const haystack = normalizeText(
        [
          e.nome,
          e.categoria,
          e.subtipo,
          e.distrito,
          e.bairro,
          e.endereco_completo,
          e.cep,
          e.servicos_oferecidos,
          e.como_acessar,
          e.observacoes,
          ...(e.telefones || []),
        ].join(' ')
      )

      const directMatch = haystack.includes(cleanQuery)
      const synonymMatch = SINONIMOS_BUSCA.some(
        (rule) =>
          rule.palavras.some((p) => cleanQuery.includes(p) || p.includes(cleanQuery)) &&
          rule.matchEquipamento(e)
      )

      if (!directMatch && !synonymMatch) {
        return false
      }
    }

    return true
  })
}

export function formatPhoneHref(phoneStr) {
  const digits = String(phoneStr || '').replace(/\D/g, '')
  if (!digits) return ''
  return `tel:+55${digits}`
}

export function getGoogleMapsUrl(equipamento) {
  const query = encodeURIComponent(`${equipamento.nome}, ${equipamento.endereco_completo}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function getWhatsAppShareUrl(equipamento) {
  const phones = [...(equipamento.telefones || []), ...(equipamento.celulares_plantao || [])].join(' / ')
  const lines = [
    `📍 *${equipamento.nome}*`,
    `🏷️ ${equipamento.subtipo} (${equipamento.distrito})`,
    `🏠 *Endereço:* ${equipamento.endereco_completo}`,
    phones ? `📞 *Telefone:* ${phones}` : '',
    equipamento.horario_funcionamento ? `🕒 *Horário:* ${equipamento.horario_funcionamento}` : '',
    `💡 *Como acessar:* ${equipamento.como_acessar}`,
    `🗺️ *Ver no Google Maps:* ${getGoogleMapsUrl(equipamento)}`,
  ].filter(Boolean)
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}

export const LEGEND_ITEMS_GUIA = [
  { label: 'Postos de Saúde (UBS e AMA)', color: '#0284c7', id: 'ubs' },
  { label: 'Reabilitação (CER II) e Saúde Mental (CAPS)', color: '#7c3aed', id: 'cer' },
  { label: 'Emergência 24h (Hospitais, UPA e PA)', color: '#dc2626', id: 'urgencia' },
  { label: 'Odontologia Especializada (CEO II)', color: '#0d9488', id: 'ceo' },
  { label: 'Educação Inclusiva (CEFAI, NAAPA, DREG)', color: '#2563eb', id: 'edu' },
  { label: 'Assistência Social (CRAS e CREAS / BPC)', color: '#ea580c', id: 'assistencia' },
  { label: 'Conselho Tutelar e Direitos (MPSP)', color: '#b91c1c', id: 'direitos' },
  { label: 'Cultura, Esporte, Lazer e Trabalho (CATE)', color: '#16a34a', id: 'cultura' },
]
