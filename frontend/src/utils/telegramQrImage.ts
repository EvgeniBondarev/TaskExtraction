/** Изображение QR для tg://login?token=… (сканировать в Telegram, не открывать ссылку). */
export function telegramQrImageUrl(loginUrl: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(loginUrl)}&margin=10`;
}
