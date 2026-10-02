import { z } from "zod";

export const referralAdminPatchSchema = z.object({
  status: z.enum(["pending", "qualified", "rejected", "cancelled"]),
  reason: z.string().trim().max(500).optional(),
  productId: z.string().uuid().optional(),
  orderNumber: z.string().trim().max(120).optional(),
});

export const rewardAdminPatchSchema = z.object({
  status: z.enum(["approved", "available", "redeemed", "cancelled", "expired"]),
});
