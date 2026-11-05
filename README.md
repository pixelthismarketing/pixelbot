# PixelBot

PixelBot is the client assistant for Pixel This Marketing. Clients sign in with an email code and ask for website changes in plain English.

## What's built so far (stage 1: sign-in)

- **Email check.** The client enters their email. PixelBot looks it up in the Pixel This GHL sub-account. They get in only if their contact has the tag **Active Client – Website**.
- **Code by email.** A 6-digit code goes to the email on file in GHL, from verify@pixelthismarketing.com. The screen always shows the same message, whether or not the email matched.
- **Code rules.** A code expires in 10 minutes and works once. Five wrong tries locks sign-in for 15 minutes. A client can get at most 3 codes an hour. Codes are stored scrambled (hashed), never as the plain number.
- **Sessions.** A sign-in lasts 7 days on that device. Every page load re-checks GHL, so removing the tag ends access right away. Each session is locked to that client's own site.
- **What the client sees.** The services checked on their company record in GHL (and only those), their site, and their account executive.
- **Account executive check.** The AE comes from the company's Account Executive field. If it doesn't match the contact's Assigned User, a warning goes to the server logs. Stage 4 sends it to Slack.

## Where the data comes from in GHL

| What | Where in GHL |
| --- | --- |
| Who can sign in | Contact tag "Active Client – Website" |
| Website address | Company record → Website |
| Services pills | Company record → Services (checked boxes only) |
| Account executive | Company record → Account Executive |
| Platform (WordPress, Framer…) | Contact → Current Website Platform |

## Settings

Every setting goes in Vercel → your project → Settings → Environment Variables. The list of names is in `.env.example`. Never put real keys in this repo.

## Coming next

- Stage 2: chat, with draft → preview → publish and undo on the client's WordPress site
- Stage 3: quotes, AE hand-offs, GHL notes and Slack summaries

Live preview: https://pixelbot-lac.vercel.app
