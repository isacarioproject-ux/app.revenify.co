/**
 * Helper de Geolocalização
 * 
 * Funções utilitárias para gerenciar permissões e acesso
 * à localização do usuário de forma segura.
 * 
 * REGRAS:
 * - Nunca pedir localização automaticamente
 * - Sempre após ação explícita do usuário
 * - Tratar navegadores/dispositivos sem suporte
 */

// Tipos
export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number // metros
  timestamp: number
}

export type GeolocationResult = 
  | { success: true; position: GeoPosition }
  | { success: false; error: 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'unknown' }

// Storage key para salvar locais favoritos
const SAVED_LOCATIONS_KEY = 'isacar_saved_locations'

/**
 * Verifica se o navegador/dispositivo suporta Geolocation API
 */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * Obtém a posição atual do usuário
 * 
 * IMPORTANTE: Só chamar após ação explícita do usuário
 * 
 * @param options Opções de geolocalização
 * @returns Promise com resultado da geolocalização
 */
export async function getCurrentPosition(
  options?: PositionOptions
): Promise<GeolocationResult> {
  // Verificar suporte
  if (!isGeolocationSupported()) {
    console.warn('[Geolocation] Browser does not support Geolocation API')
    return { success: false, error: 'unsupported' }
  }

  // Opções padrão
  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 segundos
    maximumAge: 60000, // Cache de 1 minuto
    ...options,
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      // Sucesso
      (position) => {
        console.log('[Geolocation] Position obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        resolve({
          success: true,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
        })
      },
      // Erro
      (error) => {
        console.error('[Geolocation] Error:', error.message)
        
        let errorType: GeolocationResult['error'] = 'unknown'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorType = 'unavailable'
            break
          case error.TIMEOUT:
            errorType = 'timeout'
            break
        }
        
        resolve({ success: false, error: errorType })
      },
      defaultOptions
    )
  })
}

/**
 * Calcula a distância entre dois pontos em metros (fórmula de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distância em metros
}

/**
 * Verifica se um ponto está dentro de um raio de outro ponto
 */
export function isWithinRadius(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon)
  return distance <= radiusMeters
}

// ===== Locais Salvos (para uso futuro) =====

export interface SavedLocation {
  id: string
  label: string
  latitude: number
  longitude: number
  radius: number // metros
  createdAt: string
}

/**
 * Obtém locais salvos do localStorage
 */
export function getSavedLocations(): SavedLocation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(SAVED_LOCATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Salva um novo local
 */
export function saveLocation(location: Omit<SavedLocation, 'id' | 'createdAt'>): SavedLocation {
  const locations = getSavedLocations()
  
  const newLocation: SavedLocation = {
    ...location,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  
  locations.push(newLocation)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations))
  }
  
  return newLocation
}

/**
 * Remove um local salvo
 */
export function removeLocation(id: string): void {
  const locations = getSavedLocations().filter((loc) => loc.id !== id)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations))
  }
}
