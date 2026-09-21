/** Shared attributes that discourage browser and password-manager autofill on portal logins. */
export const LOGIN_FORM_AUTOCOMPLETE = 'off' as const;

export const LOGIN_IDENTIFIER_INPUT_PROPS = {
  autoComplete: 'off' as const,
  autoCorrect: 'off' as const,
  autoCapitalize: 'off' as const,
  spellCheck: false as const,
  'data-1p-ignore': true,
  'data-lpignore': 'true',
} as const;

export const LOGIN_PASSWORD_INPUT_PROPS = {
  autoComplete: 'new-password' as const,
  autoCorrect: 'off' as const,
  autoCapitalize: 'off' as const,
  spellCheck: false as const,
  'data-1p-ignore': true,
  'data-lpignore': 'true',
} as const;
