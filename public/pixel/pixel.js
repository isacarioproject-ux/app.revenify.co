/**
 * Revenify Tracking Pixel
 * Version: 2.0.0
 * 
 * Features:
 * - One-line installation
 * - UTM Campaign Tracking
 * - Multi-touch Attribution
 * - Lead Tracking
 * - Revenue Attribution
 * - GDPR/LGPD Compliant
 * 
 * Usage:
 * <script>
 *   window.revenify = { projectKey: 'pk_live_...' };
 * </script>
 * <script src="https://cdn.revenify.co/pixel.js" async></script>
 */

(function() {
  'use strict';

  // Config
  const config = window.revenify || {};
  const projectKey = config.projectKey;
  
  if (!projectKey) {
    console.error('[Revenify] Project key não encontrado');
    return;
  }

  const API_URL = config.apiUrl || 'https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/track-event';
  const CONSENT_KEY = 'rv_consent';
  const VISITOR_KEY = 'rv_visitor_id';
  
  // ===================================
  // GDPR/LGPD CONSENT
  // ===================================
  
  function hasConsent() {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      // Se não tem consent salvo, verificar se é necessário
      // Por padrão, rastrear apenas dados essenciais (sem PII)
      return config.requireConsent === false ? true : 'pending';
    }
    return consent === 'true';
  }
  
  function setConsent(given) {
    localStorage.setItem(CONSENT_KEY, given ? 'true' : 'false');
    if (given) {
      // Se deu consent, enviar evento de consent
      trackConsent(true);
    }
  }
  
  function trackConsent(given) {
    const payload = {
      project_key: projectKey,
      visitor_id: getOrCreateVisitorId(),
      consent_given: given,
      consent_analytics: given,
      consent_marketing: given,
    };
    
    fetch(API_URL.replace('track-event', 'track-consent'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  
  // ===================================
  // VISITOR ID (persistente entre sessões)
  // ===================================
  
  function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_KEY);
    
    if (!visitorId) {
      // Criar novo visitor ID único
      visitorId = 'rv_v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    
    return visitorId;
  }
  
  // ===================================
  // FINGERPRINTING & SESSION ID
  // ===================================
  
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Revenify', 2, 2);
    
    return canvas.toDataURL().slice(-50);
  }
  
  function getOrCreateSessionId() {
    const COOKIE_NAME = 'rv_session';
    const STORAGE_KEY = 'rv_session_id';
    
    // Tentar recuperar de cookie
    let sessionId = getCookie(COOKIE_NAME);
    
    if (!sessionId) {
      // Tentar recuperar de localStorage
      sessionId = localStorage.getItem(STORAGE_KEY);
    }
    
    if (!sessionId) {
      // Criar novo session ID
      const fingerprint = generateFingerprint();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      
      sessionId = `rv_${timestamp}_${fingerprint}_${random}`;
      
      // Salvar em ambos
      setCookie(COOKIE_NAME, sessionId, 30);
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  }
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  // ===================================
  // CROSS-DOMAIN TRACKING
  // ===================================
  
  function setupCrossDomainTracking(sessionId) {
    const mainDomain = window.location.hostname;
    
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;
      
      try {
        const url = new URL(link.href, window.location.href);
        
        // Verificar se é mesmo domínio raiz mas subdomínio diferente
        if (url.hostname !== mainDomain && isSameDomainFamily(url.hostname, mainDomain)) {
          // Adicionar session_id na URL
          url.searchParams.set('_rv_sid', sessionId);
          link.href = url.toString();
        }
      } catch (e) {
        // URL inválida, ignorar
      }
    });
  }
  
  function isSameDomainFamily(domain1, domain2) {
    const root1 = domain1.split('.').slice(-2).join('.');
    const root2 = domain2.split('.').slice(-2).join('.');
    return root1 === root2;
  }
  
  function recoverSessionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('_rv_sid');
    
    if (urlSessionId) {
      // Salvar session ID recuperado
      setCookie('rv_session', urlSessionId, 30);
      localStorage.setItem('rv_session_id', urlSessionId);
      
      // Limpar URL (remover parâmetro)
      params.delete('_rv_sid');
      const newUrl = window.location.pathname + 
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
      
      return urlSessionId;
    }
    
    return null;
  }
  
  // ===================================
  // UTM PARAMETERS
  // ===================================
  
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
    };
  }
  
  // ===================================
  // DEVICE & BROWSER INFO
  // ===================================
  
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    
    // Detecção básica de device type
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = /iPad/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    return {
      device_type: deviceType,
      user_agent: ua,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
    };
  }
  
  // ===================================
  // TRACKING
  // ===================================
  
  function track(eventType, data = {}) {
    // Verificar consent para eventos não-essenciais
    const consent = hasConsent();
    if (consent === false && eventType !== 'page_view') {
      return; // Não rastrear sem consent
    }
    
    const sessionId = recoverSessionFromURL() || getOrCreateSessionId();
    const visitorId = getOrCreateVisitorId();
    const utm = getUtmParams();
    const device = getDeviceInfo();
    
    const payload = {
      project_key: projectKey,
      session_id: sessionId,
      visitor_id: visitorId,
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer || null,
      ...utm,
      ...device,
      ...data,
    };
    
    // Enviar via beacon (não bloqueia página)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
    } else {
      // Fallback para fetch
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => {
        console.error('[Revenify] Tracking error:', err);
      });
    }
  }
  
  // ===================================
  // AUTO-TRACKING
  // ===================================
  
  // Track page view automaticamente
  function trackPageView() {
    track('page_view');
  }
  
  // Track session start
  function trackSessionStart() {
    const SESSION_KEY = 'rv_session_start';
    const lastStart = localStorage.getItem(SESSION_KEY);
    const now = Date.now();
    
    // Nova sessão se passou mais de 30 min
    if (!lastStart || (now - parseInt(lastStart)) > 30 * 60 * 1000) {
      track('session_start');
      localStorage.setItem(SESSION_KEY, now.toString());
    }
  }
  
  // ===================================
  // PUBLIC API
  // ===================================
  
  window.revenify = {
    projectKey: projectKey,
    
    // Obter session ID atual
    getSessionId: function() {
      return getOrCreateSessionId();
    },
    
    // Obter visitor ID (persistente)
    getVisitorId: function() {
      return getOrCreateVisitorId();
    },
    
    // Track lead (signup)
    trackLead: function(data) {
      track('signup', {
        email: data.email,
        name: data.name || null,
      });
    },
    
    // Track purchase/payment (Revenue Attribution)
    trackPurchase: function(data) {
      track('purchase', {
        amount: data.amount,
        currency: data.currency || 'BRL',
        order_id: data.orderId || null,
        customer_email: data.email || null,
      });
    },
    
    // Track custom event
    track: function(eventName, data) {
      track(eventName, data);
    },
    
    // GDPR/LGPD Consent
    setConsent: function(given) {
      setConsent(given);
    },
    
    hasConsent: function() {
      return hasConsent();
    },
  };
  
  // ===================================
  // INITIALIZATION
  // ===================================
  
  function init() {
    const sessionId = getOrCreateSessionId();
    
    // Setup cross-domain
    setupCrossDomainTracking(sessionId);
    
    // Track session start
    trackSessionStart();
    
    // Track page view
    trackPageView();
    
    console.log('[Revenify] Initialized', { sessionId, projectKey });
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
