// Зберегти (чи прибрати) підписку браузера на нагадування.
//
// Викликається з Хатини, коли людина вмикає або вимикає нагадування, і з
// service worker, коли браузер сам прокрутив ключі підписки.

import { NextResponse } from "next/server";
import { adminClient, parseHHMM } from "@/lib/push/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  times?: string[];
  tz?: string;
  lang?: string;
  enabled?: boolean;
  rotatedFrom?: string | null;
  userId?: string | null;
};

export async function POST(req: Request) {
  const db = adminClient();
  if (!db) {
    return NextResponse.json({ ok: false, error: "push_not_configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "bad_subscription" }, { status: 400 });
  }

  // Браузер замінив підписку — стару прибираємо, щоб не слати в нікуди.
  if (body.rotatedFrom && body.rotatedFrom !== endpoint) {
    await db.from("push_subs").delete().eq("endpoint", body.rotatedFrom);
  }

  if (body.enabled === false) {
    const { error } = await db.from("push_subs").delete().eq("endpoint", endpoint);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, removed: true });
  }

  const times = (body.times || ["20:00"]).filter((t) => parseHHMM(t) !== null).sort();
  if (!times.length) {
    return NextResponse.json({ ok: false, error: "bad_times" }, { status: 400 });
  }

  const { error } = await db.from("push_subs").upsert(
    {
      endpoint,
      p256dh,
      auth,
      times,
      tz: body.tz || "Europe/Kiev",
      lang: body.lang === "en" ? "en" : "uk",
      user_id: body.userId || null,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, times });
}
