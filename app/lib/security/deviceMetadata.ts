import type { DeviceMetadata, DeviceType } from './types';

function inferDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|android(?!.*mobile)/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) return 'mobile';
  return 'desktop';
}

function buildBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server-side';

  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];

  let hash = 0;
  const raw = parts.join('|');
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `FP-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export function collectDeviceMetadata(ipAddress = '127.0.0.1'): DeviceMetadata {
  const deviceType = inferDeviceType();
  const browserFingerprint = buildBrowserFingerprint();

  return {
    deviceType,
    browserFingerprint,
    ipAddress,
    isTrustedHardware:
      deviceType === 'desktop' &&
      typeof window !== 'undefined' &&
      !/headless|bot|crawler/i.test(navigator.userAgent),
  };
}
