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
    title: 'UTM Source',
    description: 'De onde vem o tráfego (ex: google, facebook, newsletter).',
  },
  utmMedium: {
    title: 'UTM Medium',
    description: 'Meio de marketing (ex: cpc, email, social, referral).',
  },
  utmCampaign: {
    title: 'UTM Campaign',
    description: 'Identificador da campanha nos links (utm_campaign=). Usado para atribuição automática.',
  },
  utmTerm: {
    title: 'UTM Term',
    description: 'Palavras-chave de busca paga (opcional). Usado para campanhas PPC.',
  },
  utmContent: {
    title: 'UTM Content',
    description: 'Diferencia conteúdo similar (ex: logo-link vs text-link).',
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
