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
}

export function setWorkspaceMode(workspaceId: string) {
  localStorage.setItem('currentWorkspaceId', workspaceId);
}

export function getCurrentMode(): string | null {
  const mode = localStorage.getItem('currentWorkspaceId');
  if (mode === 'null') {
    return null;
  }
  return mode;
}

// Para usar no console:
// import { setPersonalMode, getCurrentMode } from '@/utils/fix-workspace-mode'
// setPersonalMode()
// getCurrentMode()
