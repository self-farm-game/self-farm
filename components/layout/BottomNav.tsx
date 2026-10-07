"use client";
/** Нижня навігація на телефоні — те саме темне скло. */
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/mock-data/content";
import { useGame } from "@/lib/store/game";
import { t } from "@/lib/mock-data/i18n";
import { play } from "@/lib/sound/sound";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useGame();
  const L = state.lang;
  const active = NAV.find((n) => pathname.startsWith(n.href))?.id ?? "garden";

  return (
    <div className="sf-bottomnav">
      {NAV.map((n) => {
        const on = active === n.id;
        return (
          <div
            key={n.id}
            onClick={() => {
              play("tap");
              router.push(n.href);
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              userSelect: "none",
              transition: "transform .12s",
              transform: on ? "translateY(-2px)" : "none",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                fontSize: 18,
                background: on ? "rgba(134,198,124,.22)" : "rgba(0,0,0,.26)",
                border: "1px solid " + (on ? "rgba(134,198,124,.42)" : "var(--g-line-soft)"),
                boxShadow: on ? "0 0 16px rgba(134,198,124,.3)" : "none",
              }}
            >
              {n.icon}
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: on ? "var(--g-ink)" : "var(--g-ink-3)",
                fontWeight: 600,
                letterSpacing: 0.4,
              }}
            >
              {t(L, "tab." + n.id)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
