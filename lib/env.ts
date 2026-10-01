function requireEnv(name:string):string{const value=process.env[name];if(!value)throw new Error(`Missing required environment variable: ${name}`);return value}
export const env={
  get supabaseUrl(){return requireEnv("NEXT_PUBLIC_SUPABASE_URL")},
  get publishableKey(){return requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")},
  get siteUrl(){return requireEnv("NEXT_PUBLIC_SITE_URL")},
  get referralCookieDays(){return Number(process.env.REFERRAL_COOKIE_DAYS??"30")}
};
