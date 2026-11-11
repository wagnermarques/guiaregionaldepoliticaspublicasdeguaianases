import { LitElement, html, css } from 'lit'
import '@fzl/webcomponents-lit'
import { navigate } from 'fzl-fund-appshell--lit'

const CAMINHOS_PRATICOS = [
  {
    icon: '🧩',
    title: '1. Suspeita de Autismo (TEA), Deficiência ou necessidade de Terapias (Fono, Psicólogo, TO, Fisio)',
    subtitle: 'Para bebês, crianças, adolescentes ou adultos que precisam de avaliação médica, laudo ou reabilitação pelo SUS',
    badge: 'Saúde e Reabilitação',
    badgeVariant: 'info',
    steps: [
      'Passo 1 — Vá até a UBS (Posto de Saúde) mais próxima da sua casa: leve RG/Certidão de Nascimento, Cartão SUS e comprovante de endereço. Marque consulta com o Pediatra ou Clínico Geral.',
      'Passo 2 — Peça o encaminhamento para o CER II (Centro Especializado em Reabilitação): a região conta com 3 unidades de CER II (CER II Cidade Tiradentes, CER II Guaianases e CER II Jardim Soares), que oferecem fonoaudiologia, terapia ocupacional, fisioterapia, psicologia e também órteses, próteses e cadeiras de rodas.',
      'Passo 3 — Em casos de sofrimento emocional intenso ou autismo (TEA) com necessidade de cuidado diário multiprofissional, você também pode procurar diretamente (Porta Aberta, sem precisar de encaminhamento) o CAPS Infantojuvenil II de Cidade Tiradentes ou de Guaianases.',
    ],
    documents: 'RG ou Certidão de Nascimento, CPF, Cartão SUS e Comprovante de Endereço.',
  },
  {
    icon: '🏫',
    title: '2. Apoio na Escola Municipal (Sala de Recursos / AEE, Auxiliar de Vida Escolar, CEFAI e NAAPA)',
    subtitle: 'Para estudantes matriculados em CEI (Creche), EMEI ou EMEF da Rede Municipal de Ensino',
    badge: 'Educação Inclusiva',
    badgeVariant: 'info',
    steps: [
      'Passo 1 — Converse com a Coordenação Pedagógica e com o(a) Professor(a) de Atendimento Educacional Especializado (PAAI / Sala de Recursos Multifuncionais - SRM) da escola do seu filho(a). O direito ao AEE NÃO depende de laudo médico fechado!',
      'Passo 2 — Se a escola precisar de suporte especializado, materiais adaptados, estagiário/AVE ou acompanhamento intersetorial, ela aciona o CEFAI (Centro de Apoio e Acompanhamento à Inclusão) da Diretoria Regional de Educação de Guaianases (DREG).',
      'Passo 3 — Quando a criança apresenta barreiras severas de aprendizagem ou vulnerabilidade emocional/social, a escola articula o atendimento junto ao NAAPA (Núcleo de Apoio e Acompanhamento para a Aprendizagem), ambos sediados na Rua Agapito Maluf, 58 — Vila Princesa Isabel (Tel: 3397-9200).',
    ],
    documents: 'Histórico/matrícula escolar e, se já tiver, relatórios de saúde ou de terapeutas.',
  },
  {
    icon: '💰',
    title: '3. Benefício BPC/LOAS (1 salário mínimo), Bolsa Família e Cadastro Único (CadÚnico)',
    subtitle: 'Para famílias de baixa renda ou pessoas com deficiência que precisam de apoio financeiro e social',
    badge: 'Assistência Social',
    badgeVariant: 'warning',
    steps: [
      'Passo 1 — Procure o CRAS (Centro de Referência de Assistência Social) do seu distrito: CRAS Cidade Tiradentes (Av. Nascer do Sol, 529) ou CRAS Guaianases (Rua Clarínia, 19).',
      'Passo 2 — Faça ou atualize o Cadastro Único (CadÚnico) de toda a família. Estar com o CadÚnico atualizado é obrigatório para solicitar o BPC/LOAS.',
      'Passo 3 — A equipe de assistentes sociais do CRAS orienta gratuitamente sobre como dar entrada no BPC/LOAS (Benefício de Prestação Continuada para pessoas com deficiência de qualquer idade em família de baixa renda), isenção tarifária de transporte e programas sociais.',
    ],
    documents: 'RG, CPF, Carteira de Trabalho e Comprovante de Residência de todas as pessoas que moram na casa.',
  },
  {
    icon: '🛡️',
    title: '4. Falta de Vaga em Escola/Creche, Recusa de Atendimento ou Violação de Direitos',
    subtitle: 'Quando um direito da criança, adolescente ou pessoa com deficiência não está sendo respeitado',
    badge: 'Defesa de Direitos',
    badgeVariant: 'danger',
    steps: [
      'Passo 1 — Crianças e Adolescentes: procure o Conselho Tutelar do seu distrito (Cidade Tiradentes I, Cidade Tiradentes II, Guaianases ou Lajeado). Todos contam com atendimento presencial em horário comercial e telefone de Plantão 24h.',
      'Passo 2 — Situações de violência doméstica, negligência ou abuso: procure também o CREAS (Centro de Referência Especializado de Assistência Social) em Cidade Tiradentes ou Guaianases.',
      'Passo 3 — Defesa coletiva e fiscalização de políticas públicas: acione a Promotoria de Direitos Humanos / Pessoa com Deficiência do Ministério Público de São Paulo (MPSP) pelo telefone (11) 3119-9052 ou pela internet.',
    ],
    documents: 'Documentos da criança/estudante e protocolo ou anotação do atendimento que foi negado.',
  },
  {
    icon: '💼',
    title: '5. Vagas de Emprego para Pessoas com Deficiência e Qualificação Profissional',
    subtitle: 'Para jovens e adultos com deficiência ou familiares em busca de trabalho e geração de renda',
    badge: 'Trabalho e Renda',
    badgeVariant: 'success',
    steps: [
      'Passo 1 — Vá até o CATE (Centro de Apoio ao Trabalho e Empreendedorismo) em Cidade Tiradentes (Rua Milagre dos Peixes, 357) ou em Guaianases (Rua Hipólito de Camargo, 479).',
      'Passo 2 — Você também pode enviar o currículo diretamente para o canal exclusivo de inclusão de Pessoas com Deficiência da Prefeitura: eficientes@prefeitura.sp.gov.br.',
    ],
    documents: 'RG, CPF, Carteira de Trabalho (física ou digital) e laudo médico/certificado de reabilitação (para vagas da Lei de Cotas).',
  },
]

export class GuiaComoComecarView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 1080px;
      margin: 0 auto;
      padding: 16px 16px 48px;
      font-family: var(--_fzl-font-family, system-ui, -apple-system, sans-serif);
      color: var(--md-sys-color-on-surface, #0f172a);
    }

    .hero {
      background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
      color: #ffffff;
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 24px;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: 1.55rem;
    }

    .hero p {
      margin: 0 0 16px;
      font-size: 0.98rem;
      line-height: 1.5;
      opacity: 0.95;
    }

    .cards-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .steps-list {
      margin: 0 0 12px;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .docs-box {
      background: #fefce8;
      border-left: 4px solid #ca8a04;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.86rem;
      color: #713f12;
    }
  `

  render() {
    return html`
      <section class="hero">
        <h1>🧭 Por Onde Começar? Passo a Passo para Famílias e Educadores</h1>
        <p>
          Sabemos que procurar atendimento de saúde, terapias, benefícios sociais ou apoio escolar pode parecer difícil.
          Por isso, resumimos abaixo o caminho mais simples para cada necessidade em
          <strong>Cidade Tiradentes, Guaianases e Lajeado</strong>.
        </p>
        <fzl-lit-button variant="secondary" @fzl-click=${() => navigate('/')}>
          ← Voltar para o Mapa e Busca de Locais
        </fzl-lit-button>
      </section>

      <div class="cards-stack">
        ${CAMINHOS_PRATICOS.map(
          (item) => html`
            <fzl-lit-card
              .title=${`${item.icon} ${item.title}`}
              .subtitle=${item.subtitle}
              .badge=${item.badge}
              .badgeVariant=${item.badgeVariant}
              body-max-height="none"
            >
              <div>
                <ul class="steps-list">
                  ${item.steps.map((st) => html`<li>${st}</li>`)}
                </ul>
                <div class="docs-box">
                  <strong>📋 Documentos que vale sempre levar:</strong> ${item.documents}
                </div>
              </div>
              <div slot="footer">
                <fzl-lit-button
                  variant="primary"
                  size="sm"
                  @fzl-click=${() => navigate('/')}
                >
                  🗺️ Localizar esses serviços no Mapa
                </fzl-lit-button>
              </div>
            </fzl-lit-card>
          `
        )}
      </div>
    `
  }
}

if (!customElements.get('guia-como-comecar-view')) {
  customElements.define('guia-como-comecar-view', GuiaComoComecarView)
}
