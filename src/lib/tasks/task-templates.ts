import { TaskTemplate } from '@/types/tasks';

/**
 * Templates de tarefas pré-definidos
 * Estes templates ajudam usuários a criar tarefas rapidamente com estruturas comuns
 */
export const taskTemplates: TaskTemplate[] = [
  {
    id: 'template-1',
    name: 'Tarefa Geral',
    description: 'Template básico para qualquer tipo de tarefa',
    icon: '📝',
    category: 'geral',
    task: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      custom_fields: [],
      subtasks: [],
    },
  },
  {
    id: 'template-2',
    name: 'Bug',
    description: 'Reportar e rastrear bugs',
    icon: '🐛',
    category: 'ti',
    task: {
      title: 'Bug: ',
      description: '**Descrição do problema:**\n\n**Passos para reproduzir:**\n1. \n2. \n3. \n\n**Comportamento esperado:**\n\n**Comportamento atual:**\n',
      status: 'todo',
      priority: 'high',
      custom_fields: [
        { id: 'field-1', name: 'Ambiente', type: 'select', value: 'produção', options: ['desenvolvimento', 'staging', 'produção'] },
        { id: 'field-2', name: 'Navegador', type: 'text', value: '' },
      ],
      subtasks: [
        { title: 'Reproduzir o bug', status: 'todo', priority: 'high' },
        { title: 'Identificar causa raiz', status: 'todo', priority: 'high' },
        { title: 'Implementar correção', status: 'todo', priority: 'medium' },
        { title: 'Testar correção', status: 'todo', priority: 'medium' },
      ],
    },
  },
  {
    id: 'template-3',
    name: 'Feature',
    description: 'Nova funcionalidade ou melhoria',
    icon: '✨',
    category: 'ti',
    task: {
      title: 'Feature: ',
      description: '**Objetivo:**\n\n**Requisitos:**\n- \n\n**Critérios de aceitação:**\n- [ ] \n- [ ] \n',
      status: 'todo',
      priority: 'medium',
      custom_fields: [
        { id: 'field-3', name: 'Estimativa', type: 'text', value: '' },
        { id: 'field-4', name: 'Sprint', type: 'text', value: '' },
      ],
      checklists: [
        {
          id: 'checklist-1',
          title: 'Definition of Done',
          items: [
            { id: 'item-1', text: 'Código revisado', checked: false },
            { id: 'item-2', text: 'Testes unitários escritos', checked: false },
            { id: 'item-3', text: 'Documentação atualizada', checked: false },
            { id: 'item-4', text: 'Design aprovado', checked: false },
          ],
        },
      ],
    },
  },
  {
    id: 'template-4',
    name: 'Reunião',
    description: 'Organizar e preparar reuniões',
    icon: '📅',
    category: 'trabalho',
    task: {
      title: 'Reunião: ',
      description: '**Objetivo:**\n\n**Participantes:**\n- \n\n**Agenda:**\n1. \n2. \n3. \n\n**Preparação Necessária:**\n',
      status: 'todo',
      priority: 'medium',
      custom_fields: [
        { id: 'field-5', name: 'Local', type: 'text', value: '' },
        { id: 'field-6', name: 'Duração', type: 'text', value: '1 hora' },
      ],
      subtasks: [
        { title: 'Enviar convite', status: 'todo', priority: 'high' },
        { title: 'Preparar apresentação', status: 'todo', priority: 'medium' },
        { title: 'Enviar ata após reunião', status: 'todo', priority: 'low' },
      ],
    },
  },
  {
    id: 'template-5',
    name: 'Pesquisa',
    description: 'Template para tarefas de pesquisa e análise',
    icon: '🔍',
    category: 'pessoal',
    task: {
      title: 'Pesquisa: ',
      description: '**Tópico:**\n\n**Objetivos:**\n- \n\n**Fontes:**\n- \n\n**Conclusões:**\n',
      status: 'todo',
      priority: 'low',
      custom_fields: [],
      subtasks: [
        { title: 'Definir escopo', status: 'todo', priority: 'medium' },
        { title: 'Coletar informações', status: 'todo', priority: 'medium' },
        { title: 'Analisar dados', status: 'todo', priority: 'medium' },
        { title: 'Documentar resultados', status: 'todo', priority: 'low' },
      ],
    },
  },
  {
    id: 'template-6',
    name: 'Onboarding',
    description: 'Checklist para integração de novos membros',
    icon: '👋',
    category: 'trabalho',
    task: {
      title: 'Onboarding: ',
      description: '**Nome do novo membro:**\n\n**Cargo:**\n\n**Data de início:**\n',
      status: 'todo',
      priority: 'high',
      checklists: [
        {
          id: 'checklist-2',
          title: 'Checklist de Onboarding',
          items: [
            { id: 'item-5', text: 'Configurar conta de email', checked: false },
            { id: 'item-6', text: 'Dar acesso aos sistemas', checked: false },
            { id: 'item-7', text: 'Apresentar à equipe', checked: false },
            { id: 'item-8', text: 'Tour pelo escritório', checked: false },
            { id: 'item-9', text: 'Explicar processos internos', checked: false },
            { id: 'item-10', text: 'Atribuir primeiro projeto', checked: false },
          ],
        },
      ],
    },
  },
  {
    id: 'template-7',
    name: 'Code Review',
    description: 'Template para revisão de código',
    icon: '👀',
    category: 'ti',
    task: {
      title: 'Review: ',
      description: '**Pull Request:**\n\n**Mudanças principais:**\n- \n\n**Pontos de atenção:**\n- \n',
      status: 'review',
      priority: 'high',
      custom_fields: [
        { id: 'field-7', name: 'PR Link', type: 'text', value: '' },
      ],
      checklists: [
        {
          id: 'checklist-3',
          title: 'Checklist de Review',
          items: [
            { id: 'item-11', text: 'Código segue padrões do projeto', checked: false },
            { id: 'item-12', text: 'Não há código duplicado', checked: false },
            { id: 'item-13', text: 'Testes foram adicionados', checked: false },
            { id: 'item-14', text: 'Documentação atualizada', checked: false },
            { id: 'item-15', text: 'Sem vulnerabilidades de segurança', checked: false },
          ],
        },
      ],
    },
  },
  {
    id: 'template-8',
    name: 'Deploy',
    description: 'Checklist para deploy em produção',
    icon: '🚀',
    category: 'ti',
    task: {
      title: 'Deploy: ',
      description: '**Versão:**\n\n**Mudanças:**\n- \n\n**Rollback plan:**\n',
      status: 'todo',
      priority: 'urgent',
      custom_fields: [
        { id: 'field-8', name: 'Ambiente', type: 'select', value: 'produção', options: ['staging', 'produção'] },
      ],
      checklists: [
        {
          id: 'checklist-4',
          title: 'Checklist de Deploy',
          items: [
            { id: 'item-16', text: 'Testes passando', checked: false },
            { id: 'item-17', text: 'Code review aprovado', checked: false },
            { id: 'item-18', text: 'Backup realizado', checked: false },
            { id: 'item-19', text: 'Notificar equipe', checked: false },
            { id: 'item-20', text: 'Deploy executado', checked: false },
            { id: 'item-21', text: 'Smoke tests', checked: false },
            { id: 'item-22', text: 'Monitorar logs', checked: false },
          ],
        },
      ],
    },
  },
];
