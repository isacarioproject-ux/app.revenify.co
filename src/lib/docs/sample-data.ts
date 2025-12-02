import { createDocument } from './storage';

export function createSampleDocuments(projectId: string) {
  // Check if we already have sample data
  const existing = localStorage.getItem('docs-system');
  if (existing) {
    const docs = JSON.parse(existing);
    if (docs.length > 0) return; // Don't recreate if data exists
  }

  // Create sample pages
  const welcomePage = createDocument({
    name: 'Bem-vindo ao Sistema de Documentos',
    file_type: 'page',
    file_size: 0,
    parent_id: null,
    icon: '👋',
    project_id: projectId,
    page_data: {
      title: 'Bem-vindo ao Sistema de Documentos',
      elements: [
        { id: '1', type: 'h1', content: 'Bem-vindo ao Sistema de Documentos' },
        { id: '2', type: 'text', content: 'Este é um sistema completo de gerenciamento de documentos com páginas editáveis, templates, hierarquia e muito mais!' },
        { id: '3', type: 'h2', content: '✨ Recursos Principais' },
        { id: '4', type: 'list', content: [
          'Páginas editáveis com diversos tipos de conteúdo',
          'Hierarquia de documentos (páginas e subpáginas)',
          'Templates pré-definidos para começar rápido',
          'Drag & drop para reordenar elementos',
          'Auto-save automático',
          'Exportação para PDF, Markdown, HTML e texto',
          'Estatísticas do documento',
        ]},
        { id: '5', type: 'h2', content: '🚀 Como Começar' },
        { id: '6', type: 'checklist', content: [
          { id: 'c1', text: 'Explore esta página de exemplo', checked: true },
          { id: 'c2', text: 'Crie uma nova página em branco', checked: false },
          { id: 'c3', text: 'Experimente os templates', checked: false },
          { id: 'c4', text: 'Adicione elementos à sua página', checked: false },
          { id: 'c5', text: 'Organize com subpáginas', checked: false },
        ]},
        { id: '7', type: 'h2', content: '📚 Tipos de Elementos' },
        { id: '8', type: 'text', content: 'Você pode adicionar vários tipos de elementos às suas páginas:' },
        { id: '9', type: 'table', content: {
          headers: ['Elemento', 'Descrição', 'Uso'],
          rows: [
            ['Título 1', 'Cabeçalho grande', 'Seções principais'],
            ['Título 2', 'Cabeçalho médio', 'Subseções'],
            ['Parágrafo', 'Texto normal', 'Conteúdo geral'],
            ['Lista', 'Lista com bullets', 'Itens não ordenados'],
            ['Checklist', 'Lista de tarefas', 'To-dos'],
            ['Tabela', 'Dados tabulares', 'Informações estruturadas'],
          ],
        }},
      ],
      iconEmoji: '👋',
    },
  });

  createDocument({
    name: 'Guia Rápido',
    file_type: 'page',
    file_size: 0,
    parent_id: welcomePage.id,
    icon: '📖',
    project_id: projectId,
    page_data: {
      title: 'Guia Rápido',
      elements: [
        { id: '1', type: 'h1', content: 'Guia Rápido' },
        { id: '2', type: 'text', content: 'Dicas rápidas para usar o sistema com eficiência.' },
        { id: '3', type: 'h2', content: 'Atalhos de Teclado' },
        { id: '4', type: 'list', content: [
          'Ctrl + S - Salvar manualmente',
          'Ctrl + M - Abrir/fechar comentários',
          'ESC - Voltar para lista',
        ]},
        { id: '5', type: 'h2', content: 'Dicas' },
        { id: '6', type: 'list', content: [
          'Arraste elementos para reordenar',
          'Clique no emoji para mudá-lo',
          'Use templates para começar rápido',
          'Organize com subpáginas',
        ]},
      ],
      iconEmoji: '📖',
    },
  });

  createDocument({
    name: 'Meus Projetos',
    file_type: 'page',
    file_size: 0,
    parent_id: null,
    icon: '💼',
    project_id: projectId,
    page_data: {
      title: 'Meus Projetos',
      elements: [
        { id: '1', type: 'h1', content: 'Meus Projetos' },
        { id: '2', type: 'text', content: 'Lista de projetos em andamento e planejados.' },
        { id: '3', type: 'h2', content: 'Em Andamento' },
        { id: '4', type: 'checklist', content: [
          { id: 'p1', text: 'Sistema de Documentos', checked: false },
          { id: 'p2', text: 'Dashboard Analytics', checked: false },
        ]},
        { id: '5', type: 'h2', content: 'Planejados' },
        { id: '6', type: 'checklist', content: [
          { id: 'p3', text: 'App Mobile', checked: false },
          { id: 'p4', text: 'API Integration', checked: false },
        ]},
      ],
      iconEmoji: '💼',
    },
  });
}
