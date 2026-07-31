import { env } from '../config/env.js';

const buildPickupMessage = ({ studentName, pickupPersonName, timestamp }) => (
  `[JemputAman]\n\n`
  + `Yth. Orang Tua/Wali,\n`
  + `${studentName} telah dijemput oleh ${pickupPersonName} pada pukul ${timestamp} WIB.\n\n`
  + `Jika penjemputan ini tidak Anda kenali, segera hubungi guru piket sekolah.`
);

const buildOtpMessage = ({ studentName, pickupPersonName, otpCode, expiresInMinutes }) => (
  `[JemputAman]\n\n`
  + `Permintaan penjemputan darurat untuk ${studentName} oleh ${pickupPersonName}.\n`
  + `Kode OTP: ${otpCode}\n`
  + `Kode berlaku ${expiresInMinutes} menit. Jangan berikan kode jika Anda tidak mengenali penjemput.`
);

export const normalizeWhatsappPhone = value => {
  const compact = String(value || '').replace(/[^\d+]/g, '');
  if (/^08\d{8,12}$/.test(compact)) return `62${compact.slice(1)}`;
  if (/^\+628\d{8,12}$/.test(compact)) return compact.slice(1);
  if (/^628\d{8,12}$/.test(compact)) return compact;
  return '';
};

const sendMessage = async (recipientPhone, message) => {
  if (!env.WHATSAPP_API_TOKEN) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'Token gateway WhatsApp belum dikonfigurasi'
    };
  }
  const normalizedRecipient = normalizeWhatsappPhone(recipientPhone);
  if (!normalizedRecipient) {
    return {
      success: false,
      status: 'NO_RECIPIENT',
      message: 'Nomor WhatsApp orang tua tidak tersedia atau tidak valid'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: env.WHATSAPP_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: normalizedRecipient,
        message,
        countryCode: '0'
      }),
      signal: controller.signal
    });
    const rawBody = await response.text();
    let providerResponse;
    try {
      providerResponse = JSON.parse(rawBody);
    } catch {
      providerResponse = { detail: rawBody };
    }
    const accepted = response.ok && providerResponse.status !== false;
    if (!accepted) {
      return {
        success: false,
        status: 'FAILED',
        message: providerResponse.reason || providerResponse.detail || `Gateway HTTP ${response.status}`
      };
    }
    return {
      success: true,
      status: 'ACCEPTED',
      message: 'Pesan diterima oleh gateway WhatsApp',
      messageId: providerResponse.id?.[0] || providerResponse.message_id || null
    };
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      message: error.name === 'AbortError'
        ? 'Gateway WhatsApp tidak merespons dalam 8 detik'
        : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const whatsappService = {
  sendPickupNotification: async (recipientPhone, payload) => {
    return sendMessage(recipientPhone, buildPickupMessage(payload));
  },
  sendOtpNotification: async (recipientPhone, payload) => (
    sendMessage(recipientPhone, buildOtpMessage(payload))
  )
};
