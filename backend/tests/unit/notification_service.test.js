import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { whatsappService } from '../../src/services/whatsappService.js';
import { pushNotificationService } from '../../src/services/pushNotificationService.js';

describe('Notification services', () => {
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

  it('reports Web Push as not configured', async () => {
    const result = await pushNotificationService.sendPushAlert();

    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_CONFIGURED');
  });
});
