import { models } from '../models/schema.js';

export const cardManagementService = {
  updateCardStatus: async (cardUid, status, schoolId) => {
    const card = await models.nfcCards.updateStatus(cardUid, status, schoolId);
    return card;
  },
  bindCardToPerson: async (cardUid, pickupPersonId, schoolId) => {
    const newCard = await models.nfcCards.create({
      school_id: schoolId,
      pickup_person_id: pickupPersonId,
      card_uid: cardUid,
      status: 'ACTIVE'
    });
    return newCard;
  }
};
