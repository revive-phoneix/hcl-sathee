const PHONE_LENGTH = 10;

const digitsOnly = (value = "") => String(value ?? "").replace(/\D/g, "");

const isValidPhone10 = (value = "") => digitsOnly(value).length === PHONE_LENGTH;

const isOptionalPhone10 = (value = "") => {
  const digits = digitsOnly(value);
  return digits.length === 0 || digits.length === PHONE_LENGTH;
};

const normalizePhone10 = (value = "") => {
  const digits = digitsOnly(value);
  return digits.length === PHONE_LENGTH ? digits : null;
};

module.exports = {
  PHONE_LENGTH,
  digitsOnly,
  isValidPhone10,
  isOptionalPhone10,
  normalizePhone10,
};
