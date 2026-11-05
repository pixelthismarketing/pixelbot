import { NextResponse } from "next/server";
import { readSession, destroySession } from "@/lib/session";
import { getContact, hasActiveTag, buildProfile, SERVICE_LABELS } from "@/lib/ghl";

export const runtime = "nodejs";

// Called on every page load. Checks GHL live, so removing the tag
// ends access on the client's very next request.
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ signedIn: false });

  try {
    const contact = await getContact(session.contactId);
    if (!contact || !hasActiveTag(contact)) {
      await destroySession();
      return NextResponse.json({ signedIn: false, message: "Your access has ended. Contact your account executive." });
    }
    const p = await buildProfile(contact);
    if (p.aeMismatch) {
      // Stage 4 sends this to Slack and as a GHL note. For now it goes to the logs.
      console.warn(`[ae-mismatch] contact ${p.contactId}: company AE "${p.ae.name}" vs assigned user "${p.assignedUser.name}"`);
    }
    return NextResponse.json({
      signedIn: true,
      firstName: p.firstName,
      company: p.company,
      site: session.site, // the site this session is locked to
      platform: p.platform,
      services: p.services.map((key) => ({ key, label: SERVICE_LABELS[key] })),
      ae: p.ae.name,
    });
  } catch (err) {
    console.error("[me]", err);
    return NextResponse.json({ signedIn: false, message: "We couldn't check your account just now. Refresh to try again." }, { status: 503 });
  }
}
