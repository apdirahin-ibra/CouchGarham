/**
 * Strips all non-digit characters from a phone number for use with WhatsApp URLs.
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits
}

/**
 * Generates a valid wa.me deep link for WhatsApp messaging.
 */
export function getWhatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizeWhatsAppNumber(phone)
  if (!normalized) return ''
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${normalized}${encodedText}`
}
