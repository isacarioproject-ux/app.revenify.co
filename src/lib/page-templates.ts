import { nanoid } from 'nanoid'
import { PageElement } from '@/components/docs/page-elements'
import { i18n } from './i18n'

export interface PageTemplate {
  id: string
  name: string
  description: string
  category: 'work' | 'personal' | 'education' | 'custom'
  icon: string
  elements: PageElement[]
}

// Função para obter templates traduzidos
export const getTranslatedTemplates = (): PageTemplate[] => {
  const t = (key: string) => i18n.translate(key)
  
  return [
    // Template: Notas de Reunião
    {
      id: 'meeting-notes',
      name: t('pages.templates.meetingnotes'),
      description: t('pages.templates.meetingnotesDesc'),
      category: 'work',
      icon: '📝',
      elements: [
        {
          id: nanoid(),
          type: 'h1',
          content: t('pages.templates.meetingnotes'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.placeholder.date') + ': [' + t('pages.templates.placeholder.insertDate') + ']\n' + t('pages.templates.placeholder.participants') + ': [' + t('pages.templates.placeholder.insertNames') + ']',
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.agenda'),
        },
        {
          id: nanoid(),
          type: 'list',
          content: [
            t('pages.templates.content.topic') + ' 1',
            t('pages.templates.content.topic') + ' 2',
            t('pages.templates.content.topic') + ' 3',
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.discussion'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.discussionPoints'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.nextSteps'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.action') + ' 1 - ' + t('pages.templates.content.responsible') + ': [' + t('pages.templates.placeholder.name') + ']', checked: false },
            { text: t('pages.templates.content.action') + ' 2 - ' + t('pages.templates.content.responsible') + ': [' + t('pages.templates.placeholder.name') + ']', checked: false },
            { text: t('pages.templates.content.action') + ' 3 - ' + t('pages.templates.content.responsible') + ': [' + t('pages.templates.placeholder.name') + ']', checked: false },
          ],
        },
      ],
    },
    // Template: Brief de Projeto
    {
      id: 'project-brief',
      name: t('pages.templates.projectbrief'),
      description: t('pages.templates.projectbriefDesc'),
      category: 'work',
      icon: '🎯',
      elements: [
        {
          id: nanoid(),
          type: 'h1',
          content: t('pages.templates.projectbrief'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.overview'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.projectDescription'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.objectives'),
        },
        {
          id: nanoid(),
          type: 'list',
          content: [
            t('pages.templates.content.objective') + ' 1',
            t('pages.templates.content.objective') + ' 2',
            t('pages.templates.content.objective') + ' 3',
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.scope'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.scopeDescription'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.stakeholders'),
        },
        {
          id: nanoid(),
          type: 'table',
          content: {
            headers: [t('pages.templates.content.name'), t('pages.templates.content.role'), t('pages.templates.content.contact')],
            rows: [
              ['[' + t('pages.templates.placeholder.name') + ']', '[' + t('pages.templates.content.role') + ']', '[' + t('pages.templates.placeholder.emailTel') + ']'],
              ['[' + t('pages.templates.placeholder.name') + ']', '[' + t('pages.templates.content.role') + ']', '[' + t('pages.templates.placeholder.emailTel') + ']'],
            ],
          },
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.timeline'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.phase') + ' 1: ' + t('pages.templates.content.planning') + ' - [' + t('pages.templates.placeholder.date') + ']', checked: false },
            { text: t('pages.templates.content.phase') + ' 2: ' + t('pages.templates.content.execution') + ' - [' + t('pages.templates.placeholder.date') + ']', checked: false },
            { text: t('pages.templates.content.phase') + ' 3: ' + t('pages.templates.content.delivery') + ' - [' + t('pages.templates.placeholder.date') + ']', checked: false },
          ],
        },
      ],
    },
    // Template: Lista de Tarefas
    {
      id: 'task-list',
      name: t('pages.templates.tasklist'),
      description: t('pages.templates.tasklistDesc'),
      category: 'personal',
      icon: '✅',
      elements: [
        {
          id: nanoid(),
          type: 'h1',
          content: t('pages.templates.content.myTasks'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.today'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.task') + ' 1', checked: false },
            { text: t('pages.templates.content.task') + ' 2', checked: false },
            { text: t('pages.templates.content.task') + ' 3', checked: false },
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.thisWeek'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.task') + ' 1', checked: false },
            { text: t('pages.templates.content.task') + ' 2', checked: false },
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.backlog'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.idea') + ' 1', checked: false },
            { text: t('pages.templates.content.idea') + ' 2', checked: false },
          ],
        },
      ],
    },
    // Template: Planejamento Semanal
    {
      id: 'weekly-plan',
      name: t('pages.templates.weeklyplan'),
      description: t('pages.templates.weeklyplanDesc'),
      category: 'personal',
      icon: '📅',
      elements: [
        {
          id: nanoid(),
          type: 'h1',
          content: t('pages.templates.weeklyplan'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.placeholder.weekLabel') + ': [' + t('pages.templates.placeholder.startDate') + '] a [' + t('pages.templates.placeholder.endDate') + ']',
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.weeklyGoals'),
        },
        {
          id: nanoid(),
          type: 'list',
          content: [
            t('pages.templates.content.goal') + ' 1',
            t('pages.templates.content.goal') + ' 2',
            t('pages.templates.content.goal') + ' 3',
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.monday'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.priorityTask'), checked: false },
            { text: t('pages.templates.content.meeting10am'), checked: false },
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.tuesday'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [{ text: t('pages.templates.content.addTasks'), checked: false }],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.reflection'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.reflectionQuestions'),
        },
      ],
    },
    // Template: Anotações de Estudo
    {
      id: 'study-notes',
      name: t('pages.templates.studynotes'),
      description: t('pages.templates.studynotesDesc'),
      category: 'education',
      icon: '📚',
      elements: [
        {
          id: nanoid(),
          type: 'h1',
          content: t('pages.templates.studynotes') + ': [' + t('pages.templates.placeholder.subjectName') + ']',
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.placeholder.date') + ': [' + t('pages.templates.placeholder.date') + ']\n' + t('pages.templates.placeholder.sourceLabel') + ': [' + t('pages.templates.placeholder.source') + ']',
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.mainConcepts'),
        },
        {
          id: nanoid(),
          type: 'list',
          content: [
            t('pages.templates.content.concept') + ' 1: ' + t('pages.templates.content.explanation'),
            t('pages.templates.content.concept') + ' 2: ' + t('pages.templates.content.explanation'),
            t('pages.templates.content.concept') + ' 3: ' + t('pages.templates.content.explanation'),
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.examples'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.exampleText'),
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.questions'),
        },
        {
          id: nanoid(),
          type: 'checklist',
          content: [
            { text: t('pages.templates.content.question') + ' 1', checked: false },
            { text: t('pages.templates.content.question') + ' 2', checked: false },
          ],
        },
        {
          id: nanoid(),
          type: 'h2',
          content: t('pages.templates.content.summary'),
        },
        {
          id: nanoid(),
          type: 'text',
          content: t('pages.templates.content.summaryText'),
        },
      ],
    },
    // Template: Página em Branco
    {
      id: 'blank',
      name: t('pages.templates.blank'),
      description: t('pages.templates.blankDesc'),
      category: 'work',
      icon: '📄',
      elements: [],
    },
  ]
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Notas de Reunião',
    description: 'Template estruturado para documentar reuniões',
    category: 'work',
    icon: '📝',
    elements: [
      {
        id: nanoid(),
        type: 'h1',
        content: 'Notas de Reunião',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Data: [Inserir data]\nParticipantes: [Inserir nomes]',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Agenda',
      },
      {
        id: nanoid(),
        type: 'list',
        content: ['Tópico 1', 'Tópico 2', 'Tópico 3'],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Discussão',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Principais pontos discutidos...',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Próximos Passos',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Ação 1 - Responsável: [Nome]', checked: false },
          { text: 'Ação 2 - Responsável: [Nome]', checked: false },
          { text: 'Ação 3 - Responsável: [Nome]', checked: false },
        ],
      },
    ],
  },
  {
    id: 'project-brief',
    name: 'Brief de Projeto',
    description: 'Defina objetivos, escopo e requisitos do projeto',
    category: 'work',
    icon: '🎯',
    elements: [
      {
        id: nanoid(),
        type: 'h1',
        content: 'Brief do Projeto',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Visão Geral',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Descrição breve do projeto e contexto...',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Objetivos',
      },
      {
        id: nanoid(),
        type: 'list',
        content: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Escopo',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'O que está incluído no escopo do projeto...',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Stakeholders',
      },
      {
        id: nanoid(),
        type: 'table',
        content: {
          headers: ['Nome', 'Papel', 'Contato'],
          rows: [
            ['[Nome]', '[Papel]', '[Email/Tel]'],
            ['[Nome]', '[Papel]', '[Email/Tel]'],
          ],
        },
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Cronograma',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Fase 1: Planejamento - [Data]', checked: false },
          { text: 'Fase 2: Execução - [Data]', checked: false },
          { text: 'Fase 3: Entrega - [Data]', checked: false },
        ],
      },
    ],
  },
  {
    id: 'task-list',
    name: 'Lista de Tarefas',
    description: 'Organize e acompanhe suas tarefas',
    category: 'personal',
    icon: '✅',
    elements: [
      {
        id: nanoid(),
        type: 'h1',
        content: 'Minhas Tarefas',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Hoje',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Tarefa 1', checked: false },
          { text: 'Tarefa 2', checked: false },
          { text: 'Tarefa 3', checked: false },
        ],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Esta Semana',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Tarefa 1', checked: false },
          { text: 'Tarefa 2', checked: false },
        ],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Backlog',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Ideia 1', checked: false },
          { text: 'Ideia 2', checked: false },
        ],
      },
    ],
  },
  {
    id: 'weekly-plan',
    name: 'Planejamento Semanal',
    description: 'Organize sua semana com metas e prioridades',
    category: 'personal',
    icon: '📅',
    elements: [
      {
        id: nanoid(),
        type: 'h1',
        content: 'Planejamento Semanal',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Semana de: [Data início] a [Data fim]',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Metas da Semana',
      },
      {
        id: nanoid(),
        type: 'list',
        content: ['Meta 1', 'Meta 2', 'Meta 3'],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Segunda-feira',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Tarefa prioritária', checked: false },
          { text: 'Reunião às 10h', checked: false },
        ],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Terça-feira',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [{ text: 'Adicionar tarefas', checked: false }],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Reflexão',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'O que funcionou bem esta semana?\nO que pode melhorar?',
      },
    ],
  },
  {
    id: 'study-notes',
    name: 'Anotações de Estudo',
    description: 'Template para organizar conteúdo de estudos',
    category: 'education',
    icon: '📚',
    elements: [
      {
        id: nanoid(),
        type: 'h1',
        content: 'Anotações: [Nome do Assunto]',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Data: [Data]\nFonte: [Livro/Curso/Artigo]',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Conceitos Principais',
      },
      {
        id: nanoid(),
        type: 'list',
        content: ['Conceito 1: Explicação', 'Conceito 2: Explicação', 'Conceito 3: Explicação'],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Exemplos',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Exemplo prático 1...\n\nExemplo prático 2...',
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Dúvidas',
      },
      {
        id: nanoid(),
        type: 'checklist',
        content: [
          { text: 'Dúvida 1', checked: false },
          { text: 'Dúvida 2', checked: false },
        ],
      },
      {
        id: nanoid(),
        type: 'h2',
        content: 'Resumo',
      },
      {
        id: nanoid(),
        type: 'text',
        content: 'Em poucas palavras, este conteúdo trata de...',
      },
    ],
  },
  {
    id: 'blank',
    name: 'Página em Branco',
    description: 'Comece do zero',
    category: 'work',
    icon: '📄',
    elements: [],
  },
]

export const getCategoryLabel = (category: PageTemplate['category']): string => {
  const labels = {
    work: 'Trabalho',
    personal: 'Pessoal',
    education: 'Educação',
    custom: 'Customizado',
  }
  return labels[category]
}

export const getTemplatesByCategory = (category?: PageTemplate['category']) => {
  if (!category) return PAGE_TEMPLATES
  return PAGE_TEMPLATES.filter((t) => t.category === category)
}
