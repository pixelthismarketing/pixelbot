import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/crypto";
import { checkCode } from "@/lib/otp";
import { getContact, hasActiveTag, buildProfile } from "@/lib/ghl";
import { createSession } from "@/lib/session";
import { clientIp, overLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: unknown; code?: unknown } = {};
  try {
    body = await req.json();
  } catch {}
  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (!email || code.length !== 6) {
    return NextResponse.json({ ok: false, message: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  try {
    if (await overLimit("verify-ip", clientIp(req), 40, 3600)) {
      return NextResponse.json({ ok: false, message: "Too many attempts. Try again in an hour." }, { status: 429 });
    }
    const result = await checkCode(email, code);
    if (!result.ok) {
      const message =
        result.reason === "locked"
          ? "Too many wrong tries. Sign-in is locked for 15 minutes."
          : result.triesLeft !== undefined
            ? `That code doesn't match. ${result.triesLeft} ${result.triesLeft === 1 ? "try" : "tries"} left.`
            : "That code doesn't match or has expired. Request a new one.";
      return NextResponse.json({ ok: false, message }, { status: 401 });
    }

    // Re-check the client is still active before letting them in.
    const contact = await getContact(result.contactId);
    if (!contact || !hasActiveTag(contact)) {
      return NextResponse.json({ ok: false, message: "This account doesn't have access. Contact your account executive." }, { status: 403 });
    }
    const profile = await buildProfile(contact);
    // The session is locked to this client's own site.
    await createSession({ contactId: contact.id, email, site: profile.site });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/verify]", err);
    return NextResponse.json({ ok: false, message: "Something went wrong on our side. Try again in a minute." }, { status: 500 });
  }
}
