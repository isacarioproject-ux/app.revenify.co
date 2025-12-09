/**
 * Revenify Tracking Pixel v1.0
 * https://revenify.co
 * 
 * Usage:
 * <script>
 *   window.revenify = { projectKey: 'YOUR_PROJECT_KEY' };
 * </script>
 * <script src="https://cdn.revenify.co/pixel.js" async></script>
 */
(function() {
  'use strict';

  // Configuração
  var config = window.revenify || {};
  var API_URL = 'https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/track-event';
  
  // Gerar IDs únicos
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Obter ou criar visitor_id (persistente)
  function getVisitorId() {
    var key = 'rvfy_vid';
    var vid = localStorage.getItem(key);
    if (!vid) {
      vid = 'vid_' + generateId();
      localStorage.setItem(key, vid);
    }
    return vid;
  }

  // Obter ou criar session_id (por sessão)
  function getSessionId() {
    var key = 'rvfy_sid';
    var sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = 'sid_' + generateId();
      sessionStorage.setItem(key, sid);
    }
    return sid;
  }

  // Parsear UTM params da URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null
    };
  }

  // Detectar tipo de dispositivo
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Enviar evento
  function track(eventType, extraData) {
    if (!config.projectKey) {
      console.warn('[Revenify] Missing projectKey');
      return;
    }

    var utm = getUtmParams();
    var payload = {
      project_key: config.projectKey,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer || null,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_term: utm.utm_term,
      utm_content: utm.utm_content,
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language
    };

    // Merge extra data
    if (extraData && typeof extraData === 'object') {
      for (var key in extraData) {
        if (extraData.hasOwnProperty(key)) {
          payload[key] = extraData[key];
        }
      }
    }

    // Enviar via Beacon API (não bloqueia)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, JSON.stringify(payload));
    } else {
      // Fallback para fetch
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
  }

  // API pública
  window.revenify = window.revenify || {};
  window.revenify.track = track;
  window.revenify.getVisitorId = getVisitorId;
  window.revenify.getSessionId = getSessionId;

  // Identificar lead
  window.revenify.identify = function(email, name) {
    track('identify', { email: email, name: name });
  };

  // Rastrear signup
  window.revenify.signup = function(email, name) {
    track('signup', { email: email, name: name });
  };

  // Rastrear purchase
  window.revenify.purchase = function(amount, currency, orderId, customerEmail) {
    track('purchase', {
      amount: amount,
      currency: currency || 'BRL',
      order_id: orderId,
      customer_email: customerEmail
    });
  };

  // Auto-track page view
  if (config.autoTrack !== false) {
    // Track inicial
    track('page_view');

    // Track em SPA (history changes)
    var originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      track('page_view');
    };

    window.addEventListener('popstate', function() {
      track('page_view');
    });
  }

  // Log de inicialização
  if (config.debug) {
    console.log('[Revenify] Initialized', {
      projectKey: config.projectKey,
      visitorId: getVisitorId(),
      sessionId: getSessionId()
    });
  }
})();
