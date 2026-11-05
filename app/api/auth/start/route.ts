import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/crypto";
import { findContactByEmail, hasActiveTag } from "@/lib/ghl";
import { issueCode } from "@/lib/otp";
import { sendCodeEmail } from "@/lib/email";
import { clientIp, overLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Same answer every time, whether or not the email belongs to a client,
// so nobody can use this screen to test which emails are clients.
const NEUTRAL = {
  ok: true,
  message: "If that email belongs to an active client, a 6-digit code is on its way. It expires in 10 minutes.",
};
const MIN_MS = 1200; // also keeps response time the same either way

export async function POST(req: Request) {
  const started = Date.now();
  const pad = async () => {
    const left = MIN_MS - (Date.now() - started);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
  };

  let body: { email?: unknown } = {};
  try {
    body = await req.json();
  } catch {}
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  }

  try {
    if (await overLimit("start-ip", clientIp(req), 20, 3600)) {
      await pad();
      return NextResponse.json(NEUTRAL);
    }
    const contact = await findContactByEmail(email);
    if (contact && hasActiveTag(contact) && contact.email) {
      const code = await issueCode(email, contact.id);
      // Only ever sent to the email on file in GHL.
      if (code) await sendCodeEmail(contact.email, contact.firstName ?? "", code);
    }
  } catch (err) {
    console.error("[auth/start]", err);
  }
  await pad();
  return NextResponse.json(NEUTRAL);
}
