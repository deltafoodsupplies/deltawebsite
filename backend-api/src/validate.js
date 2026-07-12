// Dependency-free request validation (unit-testable anywhere).

const MAX = { short: 200, message: 4000 };

const clean = (value, max = MAX.short) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const INQUIRY_TYPES = ["contact", "account-application"];

/**
 * Validate an inquiry payload. Returns { ok, errors, isBot, data }.
 * Honeypot: if the hidden "_honey" field is filled, the route pretends
 * success but never stores the submission (bot trap).
 */
export function validateInquiry(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};

  const type = INQUIRY_TYPES.includes(b.type) ? b.type : "contact";
  const businessName = clean(b.businessName);
  const contactName = clean(b.contactName);
  const email = clean(b.email);
  const phone = clean(b.phone, 40);
  const city = clean(b.city);
  const businessType = clean(b.businessType, 80);
  const message = clean(b.message, MAX.message);
  const honeypot = clean(b._honey, 80);

  if (!businessName) errors.push("businessName is required");
  if (!email) errors.push("email is required");
  else if (!EMAIL_RE.test(email)) errors.push("email is invalid");
  if (type === "account-application" && !contactName) errors.push("contactName is required");

  return {
    ok: errors.length === 0,
    errors,
    isBot: honeypot.length > 0,
    data: { type, businessName, contactName, email, phone, city, businessType, message },
  };
}
