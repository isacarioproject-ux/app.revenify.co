/**
 * Utilitário para garantir que o modo "Pessoal" seja ativado corretamente
 * 
 * Use isso no console do navegador se precisar resetar para modo Pessoal:
 * 
 * ```
 * localStorage.setItem('currentWorkspaceId', 'null')
 * window.location.reload()
 * ```
 */

export function setPersonalMode() {
  localStorage.setItem('currentWorkspaceId', 'null');
  console.log('✅ Modo Pessoal ativado (workspace_id = null)');
}

export function setWorkspaceMode(workspaceId: string) {
  localStorage.setItem('currentWorkspaceId', workspaceId);
  console.log(`✅ Workspace ${workspaceId} ativado`);
}

export function getCurrentMode(): string | null {
  const mode = localStorage.getItem('currentWorkspaceId');
  if (mode === 'null') {
    console.log('📍 Modo atual: PESSOAL (sem workspace)');
    return null;
  }
  console.log(`📍 Modo atual: WORKSPACE ${mode}`);
  return mode;
}

// Para usar no console:
// import { setPersonalMode, getCurrentMode } from '@/utils/fix-workspace-mode'
// setPersonalMode()
// getCurrentMode()
