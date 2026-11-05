"use client";
import { useEffect, useRef, useState } from "react";
import Network from "@/components/Network";
import { Icon, IconSprite, SERVICE_ICON } from "@/components/Icons";

type Me = {
  signedIn: boolean;
  message?: string;
  firstName?: string;
  company?: string;
  site?: string | null;
  platform?: string | null;
  services?: { key: string; label: string }[];
  ae?: string | null;
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok !== false, data };
}

function Brand() {
  return (
    <div className="brand">
      <img src="/logo.png" alt="Pixel This Marketing" />
      <div><b>PixelBot</b><span>by Pixel This Marketing</span></div>
    </div>
  );
}

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);

  const loadMe = async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      setMe(await r.json());
    } catch {
      setMe({ signedIn: false, message: "We couldn't reach PixelBot. Check your connection and refresh." });
    }
  };
  useEffect(() => { loadMe(); }, []);

  return (
    <>
      <IconSprite />
      <Network />
      <div className="stage">
        {me === null ? null : me.signedIn ? <SignedIn me={me} onSignOut={async () => { await post("/api/auth/logout", {}); loadMe(); }} /> : <Login notice={me.message} onDone={loadMe} />}
      </div>
    </>
  );
}

function Login({ notice, onDone }: { notice?: string; onDone: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(notice ?? null);
  const codeRef = useRef<HTMLInputElement>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await post("/api/auth/start", { email });
    setBusy(false);
    if (!r.ok) { setErr(r.data.message || "Enter a valid email address."); return; }
    setMsg(r.data.message);
    setStep("code");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = async (value = code) => {
    if (busy || value.length !== 6) return;
    setErr(null);
    setBusy(true);
    const r = await post("/api/auth/verify", { email, code: value });
    setBusy(false);
    if (!r.ok) { setErr(r.data.message || "That code doesn't match."); setCode(""); return; }
    (window as unknown as { __netBoost: number }).__netBoost = 3;
    onDone();
  };

  return (
    <section id="login" aria-label="Sign in">
      <div className="login-wrap">
        <Brand />
        <div className="hero">
          <h1>Get things done on your account, <em>just by asking.</em></h1>
          <p>Ask PixelBot in plain English. It shows you a preview first and only makes the change when you approve it.</p>
        </div>
        <div className="pills" aria-label="What PixelBot can do">
          <span className="pill on"><Icon id="i-web" />Website<span className="badge">Live</span></span>
          <span className="pill soon"><Icon id="i-crm" />CRM<span className="badge">Coming soon</span></span>
          <span className="pill soon"><Icon id="i-mail" />Email marketing<span className="badge">Coming soon</span></span>
          <span className="pill soon"><Icon id="i-social" />Social media posts<span className="badge">Coming soon</span></span>
        </div>
        <form className="card glass" onSubmit={step === "email" ? send : (e) => { e.preventDefault(); verify(); }} noValidate>
          {step === "email" ? (
            <div>
              <label htmlFor="email">Your email</label>
              <input type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button className="btn" type="submit" disabled={busy || !email}>{busy ? "Checking…" : "Send me a code"}</button>
              <p className="note">Codes only go to the email we have on file.</p>
            </div>
          ) : (
            <div>
              <p className="note ok">{msg}</p>
              <label htmlFor="code">Enter the 6-digit code</label>
              <input
                ref={codeRef}
                type="text"
                id="code"
                className="codebox"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={12}
                placeholder="••••••"
                value={code}
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(d); if (d.length === 6) verify(d); }}
              />
              <button className="btn" type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify and continue"}</button>
              <div className="row-c">
                <button type="button" className="textlink" onClick={() => send()} disabled={busy}>Send a new code</button>
                <button type="button" className="textlink" onClick={() => { setStep("email"); setCode(""); setErr(null); }}>Use a different email</button>
              </div>
            </div>
          )}
          {err && <p className="note err" role="alert">{err}</p>}
        </form>
        <div className="foot"><span>assistant.pixelthismarketing.com</span><span>Sessions last 7 days on this device</span></div>
      </div>
    </section>
  );
}

function SignedIn({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const services = me.services ?? [];
  const isWordPress = !me.platform || /wordpress/i.test(me.platform);
  return (
    <section id="app" aria-label="PixelBot">
      <header className="topbar">
        <Brand />
        <div className="pills" aria-label="Your services with Pixel This">
          {services.length ? services.map((s) => (
            <span key={s.key} className="pill"><Icon id={SERVICE_ICON[s.key] ?? "i-star"} />{s.label}</span>
          )) : <span className="svc-empty">No services on file yet</span>}
        </div>
      </header>

      <div className="chat glass">
        <div className="chat-head">
          <div className="avatar"><img src="/logo.png" alt="" /></div>
          <b>PixelBot</b>
          <small><span className="dot" />{me.site ? `Connected to ${me.site}` : "No website on file"}</small>
        </div>
        <div className="feed">
          <div className="msg bot"><div className="av"><img src="/logo.png" alt="" /></div><div className="stack">
            <div className="bubble">Hi{me.firstName ? ` ${me.firstName}` : ""}! You’re signed in to {me.company || "your account"}.</div>
            <div className="bubble">
              {!me.site
                ? "We don’t have a website on file for your company yet. Your account executive can add it."
                : !isWordPress
                  ? `Your site runs on ${me.platform}. Your account executive will handle website changes for you.`
                  : "Website changes through chat are coming in the next update. For now, this confirms your sign-in works."}
            </div>
          </div></div>
        </div>
        <form className="composer" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="ask" style={{ position: "absolute", left: -9999 }}>Message PixelBot</label>
          <textarea id="ask" placeholder="Chat opens in the next update" disabled />
          <button className="btn send" type="submit" aria-label="Send" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" /></svg>
          </button>
        </form>
      </div>

      <div className="cards">
        <div className="panel glass">
          <h3>Your site</h3>
          <div className="facts">
            <div><small>Company</small><span>{me.company || "—"}</span></div>
            <div><small>Site</small><span>{me.site || "None on file"}</span></div>
            <div><small>Platform</small><span>{me.platform || "Not set"}</span></div>
            <div><small>Account executive</small><span>{me.ae || "Not set"}</span></div>
          </div>
        </div>
        <div className="panel glass">
          <h3>Your services</h3>
          <div className="pills" style={{ gap: 6 }}>
            {services.length ? services.map((s) => (
              <span key={s.key} className="pill sm"><Icon id={SERVICE_ICON[s.key] ?? "i-star"} />{s.label}</span>
            )) : <span className="svc-empty">None on file</span>}
          </div>
        </div>
        <div className="panel glass">
          <h3>How it works</h3>
          <div className="lanes">
            <div><b>Small edits</b>Draft, preview, you publish</div>
            <div><b>Bigger work</b>A fixed price you can approve</div>
            <div><b>Sensitive items</b>Prices, phones, booking and legal go to your AE</div>
          </div>
        </div>
      </div>
      <button className="signout" onClick={onSignOut}>Sign out</button>
    </section>
  );
}
