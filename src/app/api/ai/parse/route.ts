import { NextResponse } from "next/server";
import { parseRequest } from "@/lib/ai";
import { aiAllowed } from "@/lib/store-sync";

// POST multipart (field "audio") or JSON { text } → a filled-in request.
export async function POST(req: Request) {
  if (!(await aiAllowed())) {
    return NextResponse.json({ error: "The demo's AI limit for this hour is used up. Please fill it in by hand." }, { status: 429 });
  }
  try {
    let input: Parameters<typeof parseRequest>[0];
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("audio");
      if (!(file instanceof Blob) || file.size === 0) {
        return NextResponse.json({ error: "No audio received" }, { status: 400 });
      }
      if (file.size > 8_000_000) return NextResponse.json({ error: "Recording too long" }, { status: 413 });
      const mimeType = (file.type || "audio/webm").split(";")[0];
      input = { audio: { data: Buffer.from(await file.arrayBuffer()).toString("base64"), mimeType } };
    } else {
      const { text } = await req.json();
      if (typeof text !== "string" || !text.trim()) {
        return NextResponse.json({ error: "No text received" }, { status: 400 });
      }
      input = { text: text.slice(0, 1000) };
    }
    return NextResponse.json(await parseRequest(input));
  } catch (e) {
    console.error("[ai/parse]", e);
    return NextResponse.json({ error: "Couldn't understand that. Try again or fill it in by hand." }, { status: 502 });
  }
}
