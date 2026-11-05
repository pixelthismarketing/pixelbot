// Line icons used in pills, as one hidden sprite.
export function IconSprite() {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-web" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></symbol>
      <symbol id="i-crm" viewBox="0 0 24 24" {...s}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.2c2.5.2 4.3 2 4.9 4.8" /></symbol>
      <symbol id="i-mail" viewBox="0 0 24 24" {...s}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5 12 13l8.5-6.5" /></symbol>
      <symbol id="i-social" viewBox="0 0 24 24" {...s}><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="6" r="2.6" /><circle cx="18" cy="18" r="2.6" /><path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6" /></symbol>
      <symbol id="i-seo" viewBox="0 0 24 24" {...s}><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></symbol>
      <symbol id="i-ads" viewBox="0 0 24 24" {...s}><path d="M4 10v4l11 5V5L4 10z" /><path d="M18 9.5a3.5 3.5 0 0 1 0 5" /></symbol>
      <symbol id="i-bolt" viewBox="0 0 24 24" {...s}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z" /></symbol>
      <symbol id="i-cam" viewBox="0 0 24 24" {...s}><rect x="3" y="7" width="13" height="11" rx="2" /><path d="m16 11 5-3v9l-5-3" /></symbol>
      <symbol id="i-portal" viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 4v5" /></symbol>
      <symbol id="i-star" viewBox="0 0 24 24" {...s}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" /></symbol>
    </svg>
  );
}

export const SERVICE_ICON: Record<string, string> = {
  website_project: "i-web",
  seo: "i-seo",
  paid_ads_google: "i-ads",
  paid_ads_meta: "i-ads",
  email_marketing: "i-mail",
  pixel_portal: "i-portal",
  automation_project: "i-bolt",
  media_shoot: "i-cam",
  custom_project: "i-star",
};

export function Icon({ id }: { id: string }) {
  return <svg><use href={`#${id}`} /></svg>;
}
