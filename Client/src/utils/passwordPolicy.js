export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "lower", label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "One number", test: (value) => /\d/.test(value) },
  {
    id: "special",
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function validatePasswordPolicy(password) {
  const value = String(password || "");
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
  if (failed) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  return { valid: true, message: "" };
}

export function getPasswordRuleStatus(password) {
  const value = String(password || "");
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(value),
  }));
}
