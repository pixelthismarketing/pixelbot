// Reads server-only settings. Throws a clear message when one is missing,
// so a misconfigured deploy fails loudly instead of half-working.
function need(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing setting: ${name}. Add it in Vercel → Settings → Environment Variables.`);
  return v.trim();
}

export const env = {
  ghlToken: () => need("GHL_TOKEN"),
  ghlLocationId: () => process.env.GHL_LOCATION_ID?.trim() || "WffzVgo0YvPbiu494XPh",
  ghlActiveTag: () => process.env.GHL_ACTIVE_TAG?.trim() || "Active Client – Website",
  resendKey: () => need("RESEND_API_KEY"),
  emailFrom: () => process.env.EMAIL_FROM?.trim() || "PixelBot <verify@pixelthismarketing.com>",
  redisUrl: () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || need("KV_REST_API_URL"),
  redisToken: () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || need("KV_REST_API_TOKEN"),
  sessionSecret: () => {
    const s = need("SESSION_SECRET");
    if (s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
    return s;
  },
  otpPepper: () => {
    const s = need("OTP_PEPPER");
    if (s.length < 32) throw new Error("OTP_PEPPER must be at least 32 characters.");
    return s;
  },
};
