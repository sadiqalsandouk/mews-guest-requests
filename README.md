# Guest Requests

**Live demo: [mews-guest-requests.vercel.app](https://mews-guest-requests.vercel.app/staff)**

A live tracker for hotel guest requests: guests ask once, in any language, and follow their request like a food delivery. Staff log phone and in-person requests by voice in seconds, and the board escalates anything that's late.

A concept prototype exploring how a hotel platform like Mews could close the loop with guests. It isn't an official Mews product. The hotel ("Hotel Run Well"), staff names and requests are fictional mock data.

## Live demo

**https://mews-guest-requests.vercel.app/staff** (staff board) · **[/staff/qr](https://mews-guest-requests.vercel.app/staff/qr)** (scan to be the guest, with voice on your phone)

Shared demo data: it resets itself after an hour with no changes, or with "Reset demo data" in the staff menu (☰). AI calls are capped per hour on the public link.

## Try it

| Page | Who it's for | What it shows |
|---|---|---|
| `/staff` | Front desk, managers | Request board (list or week timeline), new request with voice, ⌘K search |
| `/staff/requests/[id]` | Staff | One request: status, details, activity, internal notes |
| `/staff/settings` | Admin | Escalation time limits per department |
| `/staff/qr` | Demo | **QR code for the guest page**, built from whatever address you opened it on |
| `/guest?room=1601` | Guests | What a guest sees after scanning the room's QR code |

On the guest page (laptop only), a small panel steps through every stage of a request, and **Esc** goes back to the staff view. **Reset demo data** is in the staff menu (☰).

## Run it

```bash
npm install
GEMINI_API_KEY=your-key npm run dev   # voice and AI need a Gemini API key
```

Open http://localhost:3000. Without a Gemini key everything works except voice and AI auto-fill (requests fall back to keyword routing).

## Scan it on a phone (end to end, with the mic)

Phones only allow the microphone on **https** pages, so a plain Wi-Fi address (`http://192.168…:3000`) works for typing but hides the mic. For a full end-to-end demo with voice:

1. Start a temporary secure link to your laptop (needs [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   It prints an `https://….trycloudflare.com` address.
2. Open that address + `/staff/qr` on the laptop. Scan the code with a phone: the guest page opens with the mic.
3. Stop the tunnel (Ctrl+C) when you're done. The link is public while it runs, so only share it during the demo.

On the same Wi-Fi without voice: open `http://<laptop-ip>:3000/staff/qr` instead.

## How it works

- **Next.js 16** (app and a thin server in one), **Tailwind CSS v4** with tokens matched to Mews's look, **shadcn/ui** components, a custom icon set.
- **Gemini** takes the voice note directly: one call transcribes it (any language) and fills in the room, request (in English), department, preset and urgency. Thinking is off for speed (about 3 s).
- **Safety words** (gas, fire, smoke, flood… in English and Arabic) are checked on the server before and after the AI, so emergencies are never left to the model alone.
- **No real database, on purpose.** It runs on mock data. Locally that lives in server memory; on the live link (serverless hosting, many short-lived servers) the same mock data is kept in a small Upstash Redis cache so the guest's phone and the staff board stay in sync (`src/lib/store-sync.ts`). Screens poll every 1.5 s, refresh instantly after a change in the same tab, and alert staff when a new request arrives.

### Going to production

- A small database for each request's full status history, mirrored to a Mews Task (Mews tasks are only open or closed).
- Live push (webhooks or a socket) instead of polling.
- A personal guest link per stay that expires at checkout, and staff sign-in.
- Escalation as a scheduled job that sends each alert exactly once.

## Project map

- `src/app/` pages and API routes (`api/requests`, `api/ai/parse`, `api/settings`, `api/reset`)
- `src/lib/requests.ts` request model, mock data, escalation and repeat rules
- `src/lib/ai.ts` the Gemini call and safety words
- `src/components/` staff board, timeline, request detail, guest app, voice input
- `docs/` prompts used to generate the icon set with Codex
