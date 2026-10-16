import React from 'react';

/**
 * Converts a string to Pascal Case.
 * Strips numbers, lowercases everything first, then capitalises each word.
 * E.g. "JOHN DOE123" → "John Doe"
 */
export const toPascalCase = (value: string): string => {
  if (!value) return '';
  const noNumbers = value.replace(/\d+/g, '');
  return noNumbers
    .split(' ')
    .map((word) =>
      word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : ''
    )
    .join(' ');
};

/** Blocks numeric key presses (attach to onKeyDown). */
export const blockNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (/\d+/.test(e.key)) e.preventDefault();
};

/** Blocks non-alphabetic key presses — allows spaces (attach to onKeyDown). */
export const blockNonAlpha = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (!/[a-zA-Z\s]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
    e.preventDefault();
  }
};

/**
 * Formats a phone number with a space between country code and number.
 * E.g. "+911234567890" → "+91 1234567890"
 */
export const formatPhoneWithSpace = (value: string): string => {
  if (!value) return '—';
  // Remove all existing spaces and non-digit chars except leading +
  const cleaned = value.replace(/\s+/g, '');
  const digitsOnly = cleaned.replace(/^\+/, '');


  // 10 digits — no country code, return as-is
  if (digitsOnly.length === 10) return  `+91 ${digitsOnly}`;

  // 11 digits — 1 digit country code (e.g. +1 for US)
  if (digitsOnly.length === 11) {
    return `+${digitsOnly.slice(0, 1)} ${digitsOnly.slice(1)}`;
  }

  // 12 digits — 2 digit country code (e.g. +91 for India)
  if (digitsOnly.length === 12) {
     return `+${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
  }

  // 13 digits — 3 digit country code (e.g. +971 for UAE)
  if (digitsOnly.length === 13) {
    return `+${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
  }

  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// utils/validation/profileDateValidation.ts

export const validateProfileSharedDate = (
  sourceDate?: string,
  profileDate?: string
): string => {
  if (!sourceDate || !profileDate) return "";

  const source = new Date(sourceDate);
  const profile = new Date(profileDate);

  // ❌ profile date should NOT be less than source date
  if (profile < source) {
    return "Profile Shared Date cannot be earlier than Source Date";
  }

  return "";
};

/**
 * Parses "Mar-29-2026" or "Mar-29-2026 - Apr-02-2026" → timestamp for sorting.
 * Takes the first date in a range.
 */
export const parseDateForSort = (value: string): number => {
  if (!value) return 0;
  const first = value.split(' - ')[0].trim();
  const parsed = new Date(first);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};