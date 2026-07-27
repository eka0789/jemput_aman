import { beforeEach, describe, expect, it, vi } from 'vitest';
import { models } from '../../src/models/schema.js';
import { pickupLogModel } from '../../src/models/pickupLog.js';
import { scheduleModel } from '../../src/models/schedule.js';
import { nfcService } from '../../src/services/nfcService.js';

describe('weekly pickup schedule enforcement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns OUT_OF_SCHEDULE when a different person is assigned that day', async () => {
    vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue({
      id: 'card-1',
      pickup_person_id: 'person-father',
      status: 'ACTIVE'
    });
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue({
      id: 'person-father',
      full_name: 'Ayah',
      relationship: 'Ayah',
      status: 'ACTIVE'
    });
    vi.spyOn(models.authorizations, 'findByPickupPerson').mockResolvedValue([
      { student_id: 'student-1' }
    ]);
    vi.spyOn(models.students, 'findById').mockResolvedValue({
      id: 'student-1',
      parent_id: 'parent-1',
      full_name: 'Anak',
      class_name: 'A'
    });
    vi.spyOn(scheduleModel, 'findByStudent').mockResolvedValue([
      { day_of_week: 'THU', pickup_person_id: 'person-driver' }
    ]);
    vi.spyOn(pickupLogModel, 'create').mockImplementation(async value => value);

    const result = await nfcService.verifyTap({
      cardUid: '04:AA:BB:CC',
      schoolId: 'school-1',
      studentId: 'student-1',
      verificationDate: new Date('2026-07-30T05:00:00.000Z')
    });

    expect(result.status).toBe('OUT_OF_SCHEDULE');
    expect(pickupLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'OUT_OF_SCHEDULE' })
    );
  });
});

