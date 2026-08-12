// lib/analytics.ts
import { v4 as uuidv4 } from 'uuid';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let vid = localStorage.getItem('_mama_vid');
  if (!vid) {
    vid = 'v_' + uuidv4();
    localStorage.setItem('_mama_vid', vid);
  }
  return vid;
}

export async function trackEvent(
  eventType: string,
  eventData: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;
  
  // Filter out development environments
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    return;
  }

  // Filter out admin routes
  if (window.location.pathname.startsWith('/admin')) {
    return;
  }

  const payload = {
    visitorId: getOrCreateVisitorId(),
    eventType,
    path: window.location.pathname,
    referrer: document.referrer || 'Direct',
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.error('Analytics ping failed', err);
  }
}