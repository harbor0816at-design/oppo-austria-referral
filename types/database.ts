export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id:string; email:string; first_name:string|null; last_name:string|null; phone:string|null; country:string; language:string; status:string; created_at:string; updated_at:string } };
      referrers: { Row: { id:string; user_id:string; referral_code:string; referral_slug:string; referral_link:string; successful_referrals:number; pending_referrals:number; total_reward_amount:number; current_tier:string; created_at:string; updated_at:string } };
      referrals: { Row: { id:string; referrer_id:string; referral_code:string; referred_email:string|null; referred_user_id:string|null; visitor_session_id:string; status:string; created_at:string; registered_at:string|null; qualified_at:string|null; rewarded_at:string|null; source:string|null; utm_source:string|null; utm_medium:string|null; utm_campaign:string|null; rejection_reason:string|null; fraud_score:number; fraud_status:string; fraud_reason:string|null } };
      rewards: { Row: { id:string; user_id:string; referral_id:string|null; reward_type:string; reward_amount:number; currency:string; status:string; created_at:string; approved_at:string|null; redeemed_at:string|null; expires_at:string|null } };
      referral_rules: { Row: { id:string; name:string; referrer_reward:number; friend_reward:number; currency:string; minimum_order_value:number|null; eligible_products:Json; active:boolean; valid_from:string; valid_until:string|null; created_at:string } };
      referral_tiers: { Row: { id:string; name:string; minimum_referrals:number; reward_description:string|null; active:boolean; sort_order:number; created_at:string } };
      audit_logs: { Row: { id:string; admin_user_id:string; action:string; entity_type:string; entity_id:string|null; old_value:Json|null; new_value:Json|null; created_at:string } };
      consent_logs: { Row: { id:string; user_id:string; consent_type:string; consent_version:string; granted:boolean; created_at:string } };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
