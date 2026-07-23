export const whatsappService = {
  sendPickupNotification: async (recipientPhone, { studentName, pickupPersonName, timestamp }) => {
    const message = `[JemputAman Alert] 🛡️\n\nYth. Orang Tua,\nAnak Anda *${studentName}* telah selesai dijemput oleh *${pickupPersonName}* pada pukul ${timestamp} WIB di PAUD/TK Ceria Salatiga.\n\nJika ini bukan penjemputan resmi yang disetujui, segera hubungi Guru Piket Sekolah!`;
    
    console.log(`\n========================================`);
    console.log(`[WHATSAPP DISPATCH] To: ${recipientPhone}`);
    console.log(message);
    console.log(`========================================\n`);

    return { success: true, messageId: `wa-${Date.now()}` };
  }
};
