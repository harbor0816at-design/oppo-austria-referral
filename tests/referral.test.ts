import { describe, expect, it } from "vitest";
import { generateReferralCode } from "@/lib/referral/code";
import { isSelfReferral, maskEmail } from "@/lib/referral/privacy";
describe("referral helpers",()=>{
  it("generates codes without ambiguous characters",()=>{const c=generateReferralCode();expect(c).toHaveLength(7);expect(c).toMatch(/^[A-HJ-NP-Z2-9]+$/)});
  it("detects self referral case-insensitively",()=>expect(isSelfReferral("Test@Example.com"," test@example.com ")).toBe(true));
  it("masks referred email",()=>expect(maskEmail("max@example.com")).toBe("m***@example.com"));
});
