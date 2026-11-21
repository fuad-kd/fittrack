export const PASSWORD_RULES = [
  {
    key: 'minLength',
    label: 'Minimum 8 characters',
    test: (password) => typeof password === 'string' && password.length >= 8,
  },
  {
    key: 'hasUpperCase',
    label: 'At least 1 uppercase letter (A-Z)',
    test: (password) => typeof password === 'string' && /[A-Z]/.test(password),
  },
  {
    key: 'hasSpecialChar',
    label: 'At least 1 special character (!@#$%^&*)',
    test: (password) => typeof password === 'string' && /[^A-Za-z0-9\s]/.test(password),
  },
];

export function evaluatePasswordRules(password = '') {
  const results = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    met: rule.test(password),
  }));
  const allMet = results.every((r) => r.met);
  return { results, allMet };
}
