import { NextResponse } from "next/server";
import { analyzeChannel } from "@/lib/analyzeChannel";

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { channelUrl?: string; rangeDays?: 7 | 30 };
    const channelUrl = typeof body?.channelUrl === "string" ? body.channelUrl.trim() : "";
    const rangeDaysRaw = body?.rangeDays;

    if (!channelUrl) {
      return NextResponse.json({ error: "Missing `channelUrl`." }, { status: 400 });
    }

    const rangeDays: 7 | 30 =
      rangeDaysRaw === 7 || rangeDaysRaw === 30 ? rangeDaysRaw : 30;

    const apiKey = process.env.YOUTUBE_API_KEY;
    const result = await analyzeChannel({ channelUrl, rangeDays, apiKey });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message.slice(0, 300) : "Failed to analyze channel.";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}

