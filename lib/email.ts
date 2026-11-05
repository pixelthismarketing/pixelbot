import { Resend } from "resend";
import { env } from "./env";

export async function sendCodeEmail(to: string, firstName: string, code: string): Promise<void> {
  const resend = new Resend(env.resendKey());
  const hello = firstName ? `Hi ${firstName},` : "Hi,";
  const spaced = code.split("").join(" ");
  const html = `<!doctype html><html><body style="margin:0;background:#040705;font-family:Museo,Trebuchet MS,Arial,sans-serif;color:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#040705;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0a120c;border:1px solid #1e3a22;border-radius:20px;padding:32px;text-align:center">
<tr><td style="font-size:22px;font-weight:700;color:#ffffff;padding-bottom:4px">PixelBot</td></tr>
<tr><td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#61ce70;padding-bottom:24px">by Pixel This Marketing</td></tr>
<tr><td style="font-size:15px;color:#c9cfca;padding-bottom:20px">${hello} here is your sign-in code.</td></tr>
<tr><td style="font-size:36px;font-weight:700;letter-spacing:6px;color:#61ce70;padding-bottom:20px">${spaced}</td></tr>
<tr><td style="font-size:13px;color:#a3a8a4;line-height:1.6">It expires in 10 minutes and works once.<br>If you didn't ask for this, you can ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${hello}\n\nYour PixelBot sign-in code is ${code}\n\nIt expires in 10 minutes and works once. If you didn't ask for this, ignore this email.`;

  const { error } = await resend.emails.send({
    from: env.emailFrom(),
    to,
    subject: `${code} is your PixelBot code`,
    html,
    text,
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
