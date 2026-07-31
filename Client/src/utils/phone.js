export const PHONE_LENGTH = 10;

export const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

export const sanitizePhoneInput = (value = "") =>
  digitsOnly(value).slice(0, PHONE_LENGTH);

export const isValidPhone10 = (value = "") =>
  digitsOnly(value).length === PHONE_LENGTH;

export const isOptionalPhone10 = (value = "") => {
  const digits = digitsOnly(value);
  return digits.length === 0 || digits.length === PHONE_LENGTH;
};

export const normalizePhone10 = (value = "") => {
  const digits = digitsOnly(value);
  return digits.length === PHONE_LENGTH ? digits : null;
};
