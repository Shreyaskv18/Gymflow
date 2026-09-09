import { formatDateLongIndian, getDaysRemaining } from './formatters';

/**
 * Normalizes phone numbers for WhatsApp click-to-chat.
 * Specifically handles Indian 10-digit mobile numbers by prepending country code 91.
 * Strips all spaces, hyphens, parentheses, and plus symbols.
 */
export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // Standard 10-digit Indian mobile number (e.g. 98765 11001)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 11-digit number with leading 0 (e.g. 09876511001)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  // 12-digit number already prefixed with 91 (e.g. +91 98765 11001)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // Fallback if international format or custom length >= 10
  if (digits.length >= 10) {
    return digits;
  }

  return '';
};

/**
 * Validates if the phone number has sufficient digits for WhatsApp chat.
 */
export const isValidPhoneNumber = (phone?: string): boolean => {
  const cleaned = cleanPhoneNumber(phone);
  return Boolean(cleaned && cleaned.length >= 10);
};

export interface ReminderMessageParams {
  memberName: string;
  planName?: string;
  expiryDate: string;
  gymName: string;
  isExpired?: boolean;
}

/**
 * Dynamically generates a friendly, professional renewal reminder message
 * personalized with the member's first name, plan, expiry date, and gym name.
 */
export const generateRenewalReminderMessage = ({
  memberName,
  planName,
  expiryDate,
  gymName,
  isExpired,
}: ReminderMessageParams): string => {
  const trimmedName = (memberName || '').trim();
  const firstName = trimmedName.split(/\s+/)[0] || 'Member';
  const effectivePlanName = planName ? ` (${planName})` : '';
  const formattedDate = formatDateLongIndian(expiryDate) || expiryDate;
  const effectiveGymName = gymName || 'GymFlow Fitness Center';

  if (isExpired) {
    return [
      `Hi ${firstName},`,
      ``,
      `This is a friendly reminder from ${effectiveGymName}.`,
      ``,
      `Your gym membership${effectivePlanName} expired on ${formattedDate}.`,
      ``,
      `Please renew your membership to continue your access.`,
      ``,
      `Thank you,`,
      `${effectiveGymName}`,
    ].join('\n');
  }

  return [
    `Hi ${firstName},`,
    ``,
    `This is a friendly reminder from ${effectiveGymName}.`,
    ``,
    `Your gym membership${effectivePlanName} is expiring on ${formattedDate}.`,
    ``,
    `Please renew your membership before it expires to continue your access.`,
    ``,
    `Thank you,`,
    `${effectiveGymName}`,
  ].join('\n');
};

/**
 * Generates WhatsApp click-to-chat URL with pre-filled encoded message.
 * Returns null if no valid phone number exists.
 */
export const generateWhatsAppClickToChatUrl = (
  phone: string | undefined,
  message: string
): string | null => {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
};
