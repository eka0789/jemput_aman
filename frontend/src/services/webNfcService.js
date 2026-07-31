const normalizeSerialNumber = value => {
  const compact = String(value || '').trim().replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (!compact || compact.length % 2 !== 0 || compact.length < 8 || compact.length > 20) {
    return '';
  }
  return compact.match(/.{2}/g).join(':');
};

export class WebNfcService {
  constructor() {
    this.reader = null;
    this.isReading = false;
    this.abortController = null;
  }

  isSupported() {
    return 'NDEFReader' in window;
  }

  stopScan() {
    this.abortController?.abort();
    this.abortController = null;
    this.reader = null;
    this.isReading = false;
  }

  async startScan(onCardRead, onError, { once = false } = {}) {
    if (!this.isSupported()) {
      onError?.('Web NFC API tidak didukung pada peramban ini. Gunakan Android Chrome 89+ atau gunakan Simulator Tap.');
      return false;
    }

    try {
      this.stopScan();
      this.reader = new window.NDEFReader();
      this.abortController = new AbortController();
      await this.reader.scan({ signal: this.abortController.signal });
      this.isReading = true;

      this.reader.addEventListener('reading', ({ serialNumber, message }) => {
        const formattedUid = normalizeSerialNumber(serialNumber);
        if (!formattedUid) {
          onError?.(
            'Tag NFC terdeteksi, tetapi UID kartu kosong atau tidak tersedia. '
            + 'Coba lepaskan lalu tempelkan kembali kartu, atau gunakan kartu NFC yang menampilkan serial number.'
          );
          return;
        }
        onCardRead?.({ serialNumber: formattedUid, records: message?.records || [] });
        if (once) this.stopScan();
      });

      this.reader.addEventListener('readingerror', () => {
        onError?.('Gagal membaca kartu NFC. Silakan dekatkan kembali kartu ke sensor NFC.');
      });

      return true;
    } catch (err) {
      this.isReading = false;
      if (err.name === 'AbortError') return false;
      onError?.(`Izin Web NFC Ditolak / Gagal: ${err.message}`);
      return false;
    }
  }
}

export const webNfc = new WebNfcService();
