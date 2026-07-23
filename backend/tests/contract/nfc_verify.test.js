import { describe, it, expect } from 'vitest';
import { nfcService } from '../../src/services/nfcService.js';

describe('NFC Verification Contract & Logic Tests', () => {
  it('should verify registered valid NFC card tap', async () => {
    const result = await nfcService.verifyTap({
      cardUid: '04:A2:8B:12:FE:67:80',
      schoolId: '1001-tk-ceria-salatiga',
      studentId: '1111'
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.data.student.full_name).toBe('Ananda Bintang');
    expect(result.data.pickup_person.full_name).toBe('Budi Santoso');
  });

  it('should block unregistered NFC card tap', async () => {
    const result = await nfcService.verifyTap({
      cardUid: '00:00:00:00:00:00:00',
      schoolId: '1001-tk-ceria-salatiga'
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.code).toBe('CARD_UNREGISTERED');
  });

  it('should block lost/disabled NFC card tap', async () => {
    const result = await nfcService.verifyTap({
      cardUid: '99:99:99:99:99:99:99',
      schoolId: '1001-tk-ceria-salatiga'
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.code).toBe('CARD_DISABLED');
  });
});
