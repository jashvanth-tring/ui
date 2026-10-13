export const EMAIL_VALIDATION_REGEX = {
  CONTAINS_AT: /^(?=.*@).*$/,
  CONTAINS_DOT: /^(?=.*\.).*$/,
  VALID_CHARS: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
} as const;
