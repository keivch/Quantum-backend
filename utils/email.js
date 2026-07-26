const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

module.exports = { EMAIL_REGEX, normalizeEmail, isValidEmail };
