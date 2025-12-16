import { supabase } from '@/lib/supabase'

export interface CheckoutParams {
  planId: string
  interval: 'monthly' | 'yearly'
  userId: string
  userEmail: string
}

export interface CheckoutResult {
  type: 'checkout' | 'pix'
  url?: string
  pix?: {
    qr_code: string
    qr_code_base64: string
    ticket_url: string
  }
  payment_id?: string
}

// Usar Mercado Pago como gateway principal
export async function redirectToCheckout(params: CheckoutParams): Promise<CheckoutResult | void> {
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
    console.error('Checkout error:', response.error)
    throw new Error(response.error.message || 'Failed to create checkout session')
  }

  const data = response.data
  
  // Se retornou URL, redirecionar
  if (data.url) {
    window.location.href = data.url
    return
  }
  
  // Se retornou PIX, retornar os dados
  if (data.type === 'pix' && data.pix) {
    return data as CheckoutResult
  }

  throw new Error('No checkout URL or PIX data returned')
}

// Stripe checkout (backup)
export async function redirectToStripeCheckout(params: CheckoutParams): Promise<void> {
  const response = await supabase.functions.invoke('create-checkout', {
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
    console.error('Stripe checkout error:', response.error)
    throw new Error(response.error.message || 'Failed to create checkout session')
  }

  const { url } = response.data
  if (url) {
    window.location.href = url
  } else {
    throw new Error('No checkout URL returned')
  }
}

export async function redirectToPortal(userId: string): Promise<void> {
  const response = await supabase.functions.invoke('create-portal', {
    body: {
      userId,
      returnUrl: `${window.location.origin}/settings/billing`,
    },
  })

  if (response.error) {
    console.error('Portal error:', response.error)
    throw new Error(response.error.message || 'Failed to create portal session')
  }

  const { url } = response.data
  if (url) {
    window.location.href = url
  } else {
    throw new Error('No portal URL returned')
  }
}

export * from './plans'
