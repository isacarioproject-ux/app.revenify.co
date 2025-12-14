// Mapa centralizado de tooltips para consistência
export const TOOLTIPS = {
  // Dashboard
  visitors: {
    title: 'Total de Visitantes',
    description: 'Visitantes únicos rastreados por session ID. Cada visitante é contado uma vez por sessão.',
  },
  pageViews: {
    title: 'Page Views',
    description: 'Total de páginas visualizadas. Um visitante pode gerar múltiplos page views.',
  },
  leads: {
    title: 'Leads Qualificados',
    description: 'Usuários que completaram um formulário de cadastro. Rastreados via trackLead() com email.',
  },
  revenue: {
    title: 'Receita Atribuída',
    description: 'Total de receita de pagamentos atribuídos a fontes de marketing específicas via Stripe.',
  },
  conversionRate: {
    title: 'Taxa de Conversão',
    description: 'Porcentagem de visitantes que se tornaram leads. Calculado como (Leads / Visitantes) × 100.',
  },

  // Project Settings
  projectKey: {
    title: 'Project Key',
    description: 'Identificador único para rastrear eventos. Adicione ao código do pixel no seu site.',
  },
  pixelCode: {
    title: 'Código do Pixel',
    description: 'Script JavaScript que coleta dados de visitantes. Cole antes da tag </head> em todas as páginas.',
  },
  domain: {
    title: 'Domínio',
    description: 'O domínio principal do seu site. Usado para gerar URLs de rastreamento.',
  },

  // Sources
  sourceName: {
    title: 'Nome da Fonte',
    description: 'Canal de marketing ou campanha que trouxe tráfego para seu site.',
  },
  utmSource: {
    title: 'UTM Source (Origem)',
    description: 'De onde vem o tráfego. Exemplos: google, facebook, instagram, newsletter, linkedin. É o canal principal que trouxe o visitante.',
  },
  utmMedium: {
    title: 'UTM Medium (Mídia)',
    description: 'Tipo de mídia ou canal. Exemplos: cpc (anúncio pago), organic (busca orgânica), email, social, referral (indicação), display (banner).',
  },
  utmCampaign: {
    title: 'UTM Campaign (Campanha)',
    description: 'Nome da sua campanha de marketing. Exemplos: black_friday_2024, lancamento_produto, webinar_janeiro. Use nomes descritivos para identificar facilmente.',
  },
  utmTerm: {
    title: 'UTM Term (Termo)',
    description: 'Palavra-chave usada em anúncios pagos (Google Ads, etc). Exemplos: sapatos_femininos, curso_marketing. Opcional para campanhas que não são de busca.',
  },
  utmContent: {
    title: 'UTM Content (Conteúdo)',
    description: 'Diferencia variações do mesmo anúncio para testes A/B. Exemplos: banner_azul, cta_comprar, video_curto. Útil para saber qual criativo performou melhor.',
  },
  roi: {
    title: 'Retorno sobre Investimento',
    description: 'Métrica de lucratividade: (Receita - Custo) / Custo × 100.',
  },

  // Short Links
  shortLink: {
    title: 'Link Curto',
    description: 'URL curta branded que redireciona para seu destino. Rastreável e compartilhável.',
  },
  clicks: {
    title: 'Total de Cliques',
    description: 'Número de vezes que este link curto foi clicado.',
  },
  qrCode: {
    title: 'QR Code',
    description: 'Código QR escaneável para campanhas offline. Gerado automaticamente.',
  },

  // Templates
  templateName: {
    title: 'Nome do Template',
    description: 'Nome amigável para identificar este template UTM facilmente.',
  },

  // Usage & Limits
  eventsUsage: {
    title: 'Uso de Eventos',
    description: 'Eventos rastreados este mês. O contador reseta no dia 1 de cada mês.',
  },
  linksUsage: {
    title: 'Links Curtos',
    description: 'Total de links curtos criados. Limite baseado no seu plano.',
  },
  projectsUsage: {
    title: 'Projetos',
    description: 'Número de projetos ativos. Faça upgrade para criar mais.',
  },

  // Journey
  touchpoint: {
    title: 'Touchpoint',
    description: 'Ponto de contato do visitante com sua marca. Cada visita com UTM cria um touchpoint.',
  },
  multiTouch: {
    title: 'Multi-Touch Attribution',
    description: 'Atribuição que considera todos os touchpoints da jornada, não apenas o primeiro ou último.',
  },

  // Integrations
  stripeConnect: {
    title: 'Stripe Connect',
    description: 'Conecte sua conta Stripe para rastrear receita automaticamente e atribuir a fontes.',
  },
}

// Helper para usar tooltips
export function getTooltip(key: keyof typeof TOOLTIPS) {
  return TOOLTIPS[key]
}
