import QRCode from 'qrcode';

/**
 * Calculates CRC-16 / CCITT-FALSE checksum for EMVCo QR Code standard.
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Helper to encode an EMVCo tag: Tag (2 digits) + Length (2 digits) + Value
 */
function emvTag(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Generates an authentic Indonesian QRIS standard EMVCo payload string.
 * Compatible with Bank Indonesia QRIS & national scanning standards.
 */
export function generateQrisPayload(options: {
  merchantName?: string;
  merchantCity?: string;
  nmid?: string;
  amount?: number;
  invoiceId?: string;
}): string {
  const merchantName = (options.merchantName || 'NOTO KREATIF DIGITAL').toUpperCase().slice(0, 25);
  const merchantCity = (options.merchantCity || 'JAKARTA PUSAT').toUpperCase().slice(0, 15);
  const nmid = options.nmid || 'ID10293847561';
  const postalCode = '10110';

  // Tag 26: Merchant Account Information (Standard National QRIS)
  const tag26Val =
    emvTag('00', 'ID.LINKAJA.WWW') +
    emvTag('01', nmid) +
    emvTag('02', '01') +
    emvTag('03', 'UMI'); // Usaha Mikro / Kecil

  // Tag 51: Secondary National Operator (Interchangeable)
  const tag51Val =
    emvTag('00', 'IDS.QRIS.WWW') +
    emvTag('01', nmid) +
    emvTag('02', '02');

  let raw =
    emvTag('00', '01') + // Payload Format Indicator
    emvTag('01', options.amount ? '12' : '11') + // 12 = Dynamic (with fixed amount), 11 = Static
    emvTag('26', tag26Val) +
    emvTag('51', tag51Val) +
    emvTag('52', '5812') + // Merchant Category Code (Digital Services / Software)
    emvTag('53', '360'); // Transaction Currency (360 = IDR Rupiah)

  // Tag 54: Transaction Amount if dynamic
  if (options.amount && options.amount > 0) {
    raw += emvTag('54', String(options.amount));
  }

  raw +=
    emvTag('58', 'ID') + // Country Code
    emvTag('59', merchantName) + // Merchant Name
    emvTag('60', merchantCity) + // Merchant City
    emvTag('61', postalCode); // Postal Code

  // Tag 62: Additional Data Field (Invoice / Reference ID)
  if (options.invoiceId) {
    const tag62Val = emvTag('01', options.invoiceId.slice(0, 25));
    raw += emvTag('62', tag62Val);
  }

  // Tag 63: CRC16 Checksum placeholder
  const rawWithCrcTag = raw + '6304';
  const checksum = crc16Ccitt(rawWithCrcTag);

  return rawWithCrcTag + checksum;
}

/**
 * Generates a real scannable QR Code Data URL (PNG base64)
 */
export async function generateQrCodeDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1B1C1A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    throw err;
  }
}
