// Розсилка нагадувань. Сюди стукає планувальник — байдуже який:
// Supabase Cron, Vercel Cron, GitHub Actions чи cron-job.org.
//
// Маршрут сам вирішує, кому зараз час: у кожної підписки свій час і свій
// часовий пояс. Тож планувальнику досить смикати це раз на кілька хвилин,
// нічого не знаючи про розклад.
//
// Захист — заголовок Authorization: Bearer <CRON_SECRET>. Без нього
// будь-хто міг би дзвонити людям у двері скільки завгодно разів.

import { NextResponse } from "next/server";
import webpush from "web-push";
import { adminClient, isDue, pickLine, type PushSub } from "@/lib/push/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-cron-secret") ||
    "";
  // порівняння однакової довжини, щоб не зливати секрет по часу відповіді
  if (given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const db = adminClient();
  if (!pub || !priv || !db) {
    return NextResponse.json({ ok: false, error: "push_not_configured" }, { status: 503 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:self.farm.game@gmail.com",
    pub,
    priv,
  );

  const { data, error } = await db
    .from("push_subs")
    .select("endpoint,p256dh,auth,times,tz,lang,last_sent")
    .eq("enabled", true);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const now = new Date();
  const all = (data as PushSub[] | null) ?? [];
  const due = all.filter((s) => isDue(s, now));

  let sent = 0;
  let gone = 0;
  const failed: string[] = [];

  await Promise.all(
    due.map(async (s) => {
      const payload = JSON.stringify({
        title: "Self-Farm",
        body: pickLine(s.lang),
        url: "/garden",
        tag: "self-farm-reminder",
      });
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 3600, urgency: "low" },
        );
        sent++;
        await db
          .from("push_subs")
          .update({ last_sent: now.toISOString() })
          .eq("endpoint", s.endpoint);
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        // 404/410 — підписки більше немає: людина знесла застосунок або
        // почистила дані. Тримати її далі немає сенсу.
        if (code === 404 || code === 410) {
          gone++;
          await db.from("push_subs").delete().eq("endpoint", s.endpoint);
        } else {
          failed.push(String(code || "err"));
        }
      }
    }),
  );

  return NextResponse.json({
    ok: true,
    at: now.toISOString(),
    checked: all.length,
    due: due.length,
    sent,
    pruned: gone,
    failed,
  });
}

export const POST = handle;
export const GET = handle; // деякі планувальники вміють лише GET
