import { models } from '../models/schema.js';

export const cardManagementService = {
  updateCardStatus: (cardUid, status) => {
    const card = models.nfcCards.updateStatus(cardUid, status);
    return card;
  },
  bindCardToPerson: (cardUid, pickupPersonId, schoolId) => {
    const newCard = models.nfcCards.create({
      school_id: schoolId,
      pickup_person_id: pickupPersonId,
      card_uid: cardUid,
      status: 'ACTIVE'
    });
    return newCard;
  }
};
