import { supabase } from '@/lib/supabase'

export interface MercadoPagoCheckoutParams {
  planId: string
  interval: 'monthly' | 'yearly'
  userId: string
  userEmail: string
}

export async function redirectToMercadoPagoCheckout(params: MercadoPagoCheckoutParams): Promise<void> {
  const response = await supabase.functions.invoke('mercadopago-checkout', {
    body: {
      planId: params.planId,
      interval: params.interval,
      userId: params.userId,
      userEmail: params.userEmail,
      successUrl: `${window.location.origin}/dashboard?upgraded=true`,
      cancelUrl: `${window.location.origin}/settings/billing`,
    },
  })

  if (response.error) {
    console.error('MercadoPago checkout error:', response.error)
    throw new Error(response.error.message || 'Failed to create checkout session')
  }

  const { url } = response.data
  if (url) {
    window.location.href = url
  } else {
    throw new Error('No checkout URL returned')
  }
}

// Preços em BRL
export const MERCADOPAGO_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: {
    monthly: 39,
    yearly: 349,
  },
  pro: {
    monthly: 99,
    yearly: 949,
  },
  business: {
    monthly: 249,
    yearly: 2390,
  },
}

export function formatMercadoPagoPrice(planId: string, interval: 'monthly' | 'yearly'): string {
  const prices = MERCADOPAGO_PRICES[planId]
  if (!prices) return 'Free'
  const price = prices[interval]
  return `R$ ${price}`
}
