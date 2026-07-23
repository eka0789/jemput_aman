export class WebNfcService {
  constructor() {
    this.reader = null;
    this.isReading = false;
  }

  isSupported() {
    return 'NDEFReader' in window;
  }

  async startScan(onCardRead, onError) {
    if (!this.isSupported()) {
      onError?.('Web NFC API tidak didukung pada peramban ini. Gunakan Android Chrome 89+ atau gunakan Simulator Tap.');
      return false;
    }

    try {
      this.reader = new window.NDEFReader();
      await this.reader.scan();
      this.isReading = true;

      this.reader.addEventListener('reading', ({ serialNumber, message }) => {
        const formattedUid = serialNumber ? serialNumber.toUpperCase() : 'UNKNOWN_UID';
        onCardRead?.({ serialNumber: formattedUid, records: message?.records || [] });
      });

      this.reader.addEventListener('readingerror', () => {
        onError?.('Gagal membaca kartu NFC. Silakan dekatkan kembali kartu ke sensor NFC.');
      });

      return true;
    } catch (err) {
      this.isReading = false;
      onError?.(`Izin Web NFC Ditolak / Gagal: ${err.message}`);
      return false;
    }
  }
}

export const webNfc = new WebNfcService();
