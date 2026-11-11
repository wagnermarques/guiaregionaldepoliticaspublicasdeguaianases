# Guia Regional de Políticas Públicas — Zona Leste SP (Cidade Tiradentes, Guaianases e Lajeado)

Aplicação web progressiva (PWA) e banco de dados georreferenciado contendo os **78 equipamentos públicos** extraídos da dissertação de Mestrado em Educação de **Elifas Trindade de Paula** (*"A inclusão escolar de estudantes com deficiência em situação de vulnerabilidade social: fatores intervenientes na atividade do professor de Atendimento Educacional Especializado"*, FCT/UNESP — Presidente Prudente, 2022, especificamente o **Apêndice D — Guia Regional de Políticas Públicas**, p. 112 e p. 125–133).

---

## 🚀 Como Executar a Aplicação Web

O aplicativo utiliza o monorepo de componentes **`fzl-fund-ui`** (`fzl-fund-appshell--lit` e `@fzl/webcomponents-lit`):

```bash
# Servidor de desenvolvimento interativo (Vite)
npm run dev

# Build de produção (PWA + Service Worker offline)
npm run build

# Visualizar build de produção
npm run preview
```

---

## 🧩 Componentes do `fzl-fund-ui` Utilizados e Experiência para o Usuário Leigo

A interface foi projetada especificamente para **usuários leigos** (mães, pais, responsáveis por estudantes com deficiência, moradores e educadores do AEE nos distritos de Cidade Tiradentes, Guaianases e Lajeado):

1. **AppShell Acessível (`fzl-fund-appshell--lit`)**:
   - Suporte nativo às fontes de acessibilidade **Atkinson Hyperlegible** (baixa visão) e **OpenDyslexic** (dislexia), temas Claro/Escuro/Alto Contraste e ampliação da escala de texto (`1x` a `2x`).
   - Navegação simplificada no menu lateral e botão de urgência `🚨 24h` fixo no cabeçalho.
2. **Mapa Interativo (`<fzl-geo-map>` e `<fzl-geo-legend>`)**:
   - Polígonos oficiais dos 3 distritos (**Cidade Tiradentes**, **Guaianases** e **Lajeado**) em `src/data/distritos.geojson`.
   - Pinos coloridos por área de atendimento, popups com botões de ligação imediata (`tel:`) e rota no Google Maps.
3. **Filtros por Necessidade Cotidiana + Dicionário de Sinônimos (`<fzl-text-input>`)**:
   - Traduz siglas técnicas (`CER II`, `CAPS ij`, `CEFAI`, `NAAPA`, `CRAS`, `CREAS`, `CEO II`, `CATE`) em botões claros (*"Postos de Saúde"*, *"Terapias, CER e Autismo"*, *"Emergência 24h"*, *"CRAS / CREAS / BPC"*, *"Educação Inclusiva"*).
   - Permite buscar por termos do dia a dia como `autismo`, `fono`, `vacina`, `bpc`, `loas`, `dentista`, `cadeira de rodas`, `vaga escolar`, `emprego`.
4. **Cartões de Equipamentos (`<fzl-lit-card>` e `<fzl-lit-button>`)**:
   - Cada local traz um quadro explicativo **"💡 Para que serve e como acessar"** em linguagem simples, além de botões de 1 toque para **Ligar**, **Ver no Mapa**, **Como Chegar (Google Maps)** e **Compartilhar no WhatsApp**.
5. **Guia Passo a Passo ("Por Onde Começar?") e Grade Completa (`<fzl-data-grid>`)**:
   - Orientações passo a passo sobre como conseguir terapias/reabilitação pelo SUS, apoio na escola municipal, benefício BPC/LOAS e defesa de direitos.

---

## 🗂️ Arquivos de Dados e Banco SQLite

1. **`equipamentos.json` / `src/data/equipamentos.json`**: Todos os **78 equipamentos públicos** com coordenadas (`lat`, `lng`), flag `urgencia_24h`, guia em linguagem simples (`como_acessar`), endereço, CEP, telefones e serviços.
2. **`equipamentos_saude.json`**: Recorte exclusivo com os **49 equipamentos de Saúde** (25 UBS, 5 CAPS, 3 CER II, 4 AMAs, 2 Hospitais, 2 UPAs, 1 PA, 2 CEO II, 2 Centros de Práticas Naturais, 1 Casa SER, 2 Supervisões Técnicas).
3. **`equipamentos.sqlite`**: Banco de dados relacional SQLite gerado por `build_database.py`.
