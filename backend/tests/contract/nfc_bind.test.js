import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindNfcCard } from '../../src/controllers/managementController.js';
import { models } from '../../src/models/schema.js';
import { cardManagementService } from '../../src/services/cardManagementService.js';

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  };
  response.status.mockReturnValue(response);
  return response;
};

describe('NFC card registration contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new pickup person and authorizes them for the selected student', async () => {
    const student = {
      id: 'student-1',
      school_id: 'school-1',
      parent_id: 'parent-1',
      status: 'ACTIVE'
    };
    const pickupPerson = {
      id: 'pickup-1',
      full_name: 'Siti Aminah',
      relationship: 'Ibu Kandung',
      status: 'ACTIVE'
    };
    const card = {
      id: 'card-1',
      card_uid: '04:A2:8B:12',
      pickup_person_id: pickupPerson.id,
      status: 'ACTIVE'
    };

    vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue(null);
    vi.spyOn(models.students, 'findById').mockResolvedValue(student);
    vi.spyOn(models.pickupPersons, 'create').mockResolvedValue(pickupPerson);
    vi.spyOn(models.authorizations, 'createOrActivate').mockResolvedValue({
      id: 'auth-1',
      student_id: student.id,
      pickup_person_id: pickupPerson.id,
      is_active: true
    });
    vi.spyOn(cardManagementService, 'bindCardToPerson').mockResolvedValue(card);

    const req = {
      schoolId: 'school-1',
      body: {
        card_uid: '04:a2:8b:12',
        student_id: student.id,
        new_pickup_person: {
          full_name: 'Siti Aminah',
          relationship: 'Ibu Kandung',
          phone_number: '081234567890'
        }
      }
    };
    const res = createResponse();
    const next = vi.fn();

    await bindNfcCard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(models.pickupPersons.create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-1',
      parent_id: 'parent-1',
      full_name: 'Siti Aminah',
      phone_number: '081234567890'
    }));
    expect(models.authorizations.createOrActivate).toHaveBeenCalledWith(student.id, pickupPerson.id);
    expect(cardManagementService.bindCardToPerson).toHaveBeenCalledWith(
      '04:A2:8B:12',
      pickupPerson.id,
      'school-1'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        pickup_person: pickupPerson,
        student
      })
    }));
  });

  it('does not create another pickup person when an existing one is selected', async () => {
    const student = { id: 'student-1', status: 'ACTIVE' };
    const pickupPerson = {
      id: 'pickup-existing',
      full_name: 'Budi',
      relationship: 'Ayah Kandung',
      status: 'ACTIVE'
    };

    vi.spyOn(models.nfcCards, 'findByUid').mockResolvedValue(null);
    vi.spyOn(models.students, 'findById').mockResolvedValue(student);
    vi.spyOn(models.pickupPersons, 'findById').mockResolvedValue(pickupPerson);
    vi.spyOn(models.pickupPersons, 'create');
    vi.spyOn(models.authorizations, 'createOrActivate').mockResolvedValue({ id: 'auth-1' });
    vi.spyOn(cardManagementService, 'bindCardToPerson').mockResolvedValue({
      id: 'card-1',
      card_uid: '04:A2:8B:13',
      status: 'ACTIVE'
    });

    const req = {
      schoolId: 'school-1',
      body: {
        card_uid: '04:A2:8B:13',
        student_id: student.id,
        pickup_person_id: pickupPerson.id
      }
    };
    const res = createResponse();

    await bindNfcCard(req, res, vi.fn());

    expect(models.pickupPersons.create).not.toHaveBeenCalled();
    expect(models.authorizations.createOrActivate).toHaveBeenCalledWith(student.id, pickupPerson.id);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
