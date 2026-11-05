import { env } from "./env";

const BASE = "https://services.leadconnectorhq.com";

async function ghl<T>(path: string): Promise<T | null> {
  const res = await fetch(BASE + path, {
    headers: {
      Authorization: `Bearer ${env.ghlToken()}`,
      Version: "2021-07-28",
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GHL ${path.split("?")[0]} failed: ${res.status}`);
  return (await res.json()) as T;
}

type Contact = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  businessId?: string;
  assignedTo?: string;
  customFields?: { id: string; value?: unknown }[];
};

type Business = {
  id: string;
  name?: string;
  website?: string;
  domainname?: string;
  customFields?: { key: string; valueString?: string; valueArray?: string[] }[];
};

// Options of the company "Account Executive" field in GHL (key → name).
const AE_NAMES: Record<string, string> = {
  jawad_bushnaq: "Jawad Bushnaq",
  andrea_muoz: "Andrea Muñoz",
  keshav_gaur: "Keshav Gaur",
  ridhi_chhabra: "Ridhi Chhabra",
  trixie_balecueva: "Trixie Balecueva",
  aminah_rizwan: "Aminah Rizwan",
};

// Options of the company "Services" field in GHL. Only checked ones are ever shown.
export const SERVICE_LABELS: Record<string, string> = {
  seo: "SEO",
  website_project: "Website Project",
  paid_ads_google: "Paid Ads Google",
  paid_ads_meta: "Paid Ads Meta",
  email_marketing: "Email Marketing",
  pixel_portal: "Pixel Portal",
  automation_project: "Automation Project",
  media_shoot: "Media Shoot",
  custom_project: "Custom Project",
};

// Contact field "Current Website Platform".
const PLATFORM_FIELD_ID = "1mjJS6xhlkH133NtBYQH";

export type ClientProfile = {
  contactId: string;
  email: string;
  firstName: string;
  company: string;
  site: string | null; // bare domain, e.g. pixelthismarketing.com
  platform: string | null; // e.g. "Wordpress"
  services: string[]; // checked option keys from the company record
  ae: { key: string | null; name: string | null };
  assignedUser: { id: string | null; name: string | null };
  aeMismatch: boolean;
};

export function bareDomain(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const q = new URLSearchParams({ locationId: env.ghlLocationId(), email });
  const data = await ghl<{ contact?: Contact | null }>(`/contacts/search/duplicate?${q}`);
  return data?.contact ?? null;
}

export async function getContact(id: string): Promise<Contact | null> {
  const data = await ghl<{ contact?: Contact }>(`/contacts/${encodeURIComponent(id)}`);
  return data?.contact ?? null;
}

async function getBusiness(id: string): Promise<Business | null> {
  const data = await ghl<{ business?: Business }>(`/businesses/${encodeURIComponent(id)}`);
  return data?.business ?? null;
}

async function getUserName(id: string): Promise<string | null> {
  try {
    const u = await ghl<{ name?: string; firstName?: string; lastName?: string }>(`/users/${encodeURIComponent(id)}`);
    if (!u) return null;
    return u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
  } catch {
    return null;
  }
}

export function hasActiveTag(c: Contact): boolean {
  const want = norm(env.ghlActiveTag());
  return (c.tags ?? []).some((t) => norm(t) === want);
}

export async function buildProfile(c: Contact): Promise<ClientProfile> {
  const biz = c.businessId ? await getBusiness(c.businessId) : null;
  const field = (k: string) => biz?.customFields?.find((f) => f.key === k);
  const services = (field("services")?.valueArray ?? []).filter((k) => k in SERVICE_LABELS);
  const aeKey = field("account_executive")?.valueString ?? null;
  const aeName = aeKey ? AE_NAMES[aeKey] ?? aeKey.replace(/_/g, " ") : null;
  const assignedName = c.assignedTo ? await getUserName(c.assignedTo) : null;
  const platformRaw = c.customFields?.find((f) => f.id === PLATFORM_FIELD_ID)?.value;
  const aeMismatch = !!(aeName && assignedName && norm(aeName) !== norm(assignedName));

  return {
    contactId: c.id,
    email: (c.email ?? "").toLowerCase(),
    firstName: c.firstName ?? "",
    company: biz?.name ?? "",
    site: bareDomain(biz?.website || biz?.domainname),
    platform: typeof platformRaw === "string" ? platformRaw : null,
    services,
    ae: { key: aeKey, name: aeName },
    assignedUser: { id: c.assignedTo ?? null, name: assignedName },
    aeMismatch,
  };
}
