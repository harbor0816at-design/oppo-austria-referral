import { randomInt } from "node:crypto";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateReferralCode(length = 7): string {
  return Array.from({ length }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join("");
}
export function normalizeReferralCode(code: string): string { return code.trim().toUpperCase(); }
