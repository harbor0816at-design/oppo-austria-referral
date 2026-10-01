export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}
export function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
export function isSelfReferral(referrerEmail: string, referredEmail: string): boolean {
  return normalizeEmail(referrerEmail) === normalizeEmail(referredEmail);
}
