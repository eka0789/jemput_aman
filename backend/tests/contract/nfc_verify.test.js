import { beforeEach, describe, expect, it, vi } from 'vitest';
import { models } from '../../src/models/schema.js';
import { pickupLogModel } from '../../src/models/pickupLog.js';
import { nfcService } from '../../src/services/nfcService.js';
import { storageService } from '../../src/services/storageService.js';
import { scheduleModel } from '../../src/models/schedule.js';

const schoolId = '1001-tk-ceria-salatiga';
const activeCard = {
  id: 'card-001',
  school_id: schoolId,
  pickup_person_id: '2222',
  card_uid: '04:A2:8B:12:FE:67:80',
  status: 'ACTIVE'
};
const pickupPerson = {
  id: '2222',
  school_id: schoolId,
  full_name: 'Budi Santoso',
  relationship: 'Ayah Kandung',
  phone_number: '081234567890',
  photo_url: 'pickup.jpg',
  status: 'ACTIVE'
};
const student = {
  id: '1111',
  school_id: schoolId,
  parent_id: 'usr-parent-1',
  full_name: 'Ananda Bintang',
  class_name: 'TK-A1',
  photo_url: 'student.jpg'
};

const mockSuccessfulLookup = () => {
  vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue(activeCard);
  vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue(pickupPerson);
  vi.spyOn(models.authorizations, 'findByPickupPerson').mockResolvedValue([
    { id: 'auth-1', student_id: student.id, pickup_person_id: pickupPerson.id, is_active: true }
  ]);
  vi.spyOn(models.students, 'findById').mockResolvedValue(student);
  vi.spyOn(models.users, 'findById').mockResolvedValue({
    id: 'usr-parent-1',
    full_name: 'Ibu Dewi',
    phone_number: '081234567890'
  });
  vi.spyOn(scheduleModel, 'findByStudent').mockResolvedValue([]);
  vi.spyOn(pickupLogModel, 'create').mockImplementation(async data => ({
    id: 'log-test',
    timestamp: '2026-07-24T12:00:00.000Z',
    ...data
  }));
};

describe('NFC Verification Contract & Logic Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should keep a valid NFC tap pending until a face photo is stored', async () => {
    mockSuccessfulLookup();
    const result = await nfcService.verifyTap({
      cardUid: activeCard.card_uid,
      schoolId,
      studentId: student.id
    });

    expect(result.status).toBe('PENDING_PHOTO');
    expect(result.data.student.full_name).toBe('Ananda Bintang');
    expect(result.data.pickup_person.full_name).toBe('Budi Santoso');
    expect(result.data.parent.phone_number).toBe('081234567890');
  });

  it('should block unregistered NFC card tap', async () => {
    vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue(null);
    vi.spyOn(pickupLogModel, 'create').mockResolvedValue({ id: 'log-blocked' });

    const result = await nfcService.verifyTap({
      cardUid: '00:00:00:00:00:00:00',
      schoolId
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.code).toBe('CARD_UNREGISTERED');
  });

  it('should block lost/disabled NFC card tap', async () => {
    vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue({ ...activeCard, status: 'LOST' });
    vi.spyOn(pickupLogModel, 'create').mockResolvedValue({ id: 'log-blocked' });

    const result = await nfcService.verifyTap({
      cardUid: activeCard.card_uid,
      schoolId
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.code).toBe('CARD_DISABLED');
  });

  it('should attach a face photo to an existing successful verification', async () => {
    vi.spyOn(storageService, 'uploadVerificationPhoto').mockResolvedValue({
      path: `${schoolId}/verification/log-test/photo.jpg`
    });
    vi.spyOn(pickupLogModel, 'finalizeVerificationPhoto').mockResolvedValue({
      id: 'log-test',
      student_id: student.id,
      student_name: student.full_name,
      pickup_person_id: pickupPerson.id,
      pickup_person_name: pickupPerson.full_name,
      timestamp: '2026-07-24T12:00:00.000Z',
      status: 'VERIFIED',
      verification_photo: `${schoolId}/verification/log-test/photo.jpg`
    });
    vi.spyOn(storageService, 'getSignedUrl').mockResolvedValue(
      'https://project.supabase.co/storage/v1/object/sign/images/photo.jpg'
    );

    const result = await nfcService.attachVerificationPhoto({
      pickupLogId: 'log-test',
      schoolId,
      facePhoto: 'data:image/jpeg;base64,ZmFjZS1zYW1wbGUtZGF0YQ=='
    });

    expect(storageService.uploadVerificationPhoto).toHaveBeenCalled();
    expect(pickupLogModel.finalizeVerificationPhoto).toHaveBeenCalledWith(
      'log-test',
      schoolId,
      `${schoolId}/verification/log-test/photo.jpg`
    );
    expect(result.status).toBe('VERIFIED');
    expect(result.verification_photo).toContain('/storage/v1/object/sign/images/');
  });

});
