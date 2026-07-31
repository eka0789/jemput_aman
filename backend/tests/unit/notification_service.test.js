import { describe, expect, it, vi } from 'vitest';
import { env } from '../../src/config/env.js';
import { normalizeWhatsappPhone, whatsappService } from '../../src/services/whatsappService.js';
import { pushNotificationService } from '../../src/services/pushNotificationService.js';

describe('Notification services', () => {
  it('normalizes Indonesian mobile numbers for the WhatsApp gateway', () => {
    expect(normalizeWhatsappPhone('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsappPhone('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsappPhone('021123456')).toBe('');
  });
  it('does not claim WhatsApp delivery when the gateway token is missing', async () => {
    const configuredToken = env.WHATSAPP_API_TOKEN;
    env.WHATSAPP_API_TOKEN = '';
    let result;
    try {
      result = await whatsappService.sendPickupNotification('081234567890', {
        studentName: 'Ananda Bintang',
        pickupPersonName: 'Budi Santoso (Ayah Kandung)',
        timestamp: '12.00'
      });
    } finally {
      env.WHATSAPP_API_TOKEN = configuredToken;
    }

    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_CONFIGURED');
  });

  it('sends a normalized full number without applying a second country code', async () => {
    const configuredToken = env.WHATSAPP_API_TOKEN;
    env.WHATSAPP_API_TOKEN = 'test-token';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: true, id: ['message-1'] })
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const result = await whatsappService.sendOtpNotification('0812-3456-7890', {
        studentName: 'Anak', pickupPersonName: 'Ayah', otpCode: '123456', expiresInMinutes: 10
      });
      const request = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(request.target).toBe('6281234567890');
      expect(request.countryCode).toBe('0');
      expect(result.status).toBe('ACCEPTED');
    } finally {
      env.WHATSAPP_API_TOKEN = configuredToken;
      vi.unstubAllGlobals();
    }
  });

  it('reports Web Push as not configured', async () => {
    const result = await pushNotificationService.sendPushAlert();

    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_CONFIGURED');
  });
});
