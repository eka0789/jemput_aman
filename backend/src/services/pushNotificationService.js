export const pushNotificationService = {
  sendPushAlert: async (schoolId, { studentName, pickupPersonName, timestamp }) => {
    console.log(`[PUSH NOTIFICATION DISPATCH] School: ${schoolId} | Student: ${studentName} picked up by ${pickupPersonName} at ${timestamp}`);
    return { success: true };
  }
};
