import { describe, expect, it } from 'vitest';
import { whatsappService } from '../../src/services/whatsappService.js';
import { pushNotificationService } from '../../src/services/pushNotificationService.js';

describe('Notification services', () => {
  it('does not claim WhatsApp delivery when the gateway token is missing', async () => {
    const result = await whatsappService.sendPickupNotification('081234567890', {
      studentName: 'Ananda Bintang',
      pickupPersonName: 'Budi Santoso (Ayah Kandung)',
      timestamp: '12.00'
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_CONFIGURED');
  });

  it('reports Web Push as not configured', async () => {
    const result = await pushNotificationService.sendPushAlert();

    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_CONFIGURED');
  });
});
