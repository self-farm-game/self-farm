"use client";
/** Бічна навігація — те саме темне скло, що й спливаючі вікна. */
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/mock-data/content";
import { useGame } from "@/lib/store/game";
import { t } from "@/lib/mock-data/i18n";
import { levelInfo } from "@/lib/utils/xp";
import { play } from "@/lib/sound/sound";
import Icon from "@/components/icons/Icon";

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useGame();
  const L = state.lang;
  const lvl = levelInfo(state.totalXp, L);
  const active = NAV.find((n) => pathname.startsWith(n.href))?.id ?? "garden";

  return (
    <aside className="sf-side">
      <div style={{ padding: "2px 4px 16px", borderBottom: "1px solid var(--g-line-soft)", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.3, color: "var(--g-ink)" }}>
          <Icon name="tree" size={22} style={{ marginRight: 7 }} />
          Self-Farm
        </div>
        <div style={{ fontSize: 10.5, color: "var(--g-ink-3)", letterSpacing: 1.2, marginTop: 4, textTransform: "uppercase" }}>
          {t(L, "side.tagline")}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "11px 12px",
          borderRadius: 14,
          marginBottom: 16,
          background: "var(--g-card)",
          border: "1px solid var(--g-line-soft)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            fontSize: 19,
            background: "var(--g-green-dim)",
            border: "1px solid var(--g-line-soft)",
          }}
        >
          <Icon name={lvl.levelNum >= 3 ? "tree" : "sprout"} size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.15, color: "var(--g-ink)" }}>{lvl.name}</div>
          <div className="l3-xp" style={{ marginTop: 6 }}>
            <i style={{ width: `${Math.round(lvl.pct * 100)}%` }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--g-ink-3)", marginTop: 4 }}>
            {lvl.isMax ? `${lvl.total} XP` : `${lvl.inLevel} / ${lvl.target} XP`}
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        {NAV.map((n) => (
          <div
            key={n.id}
            className={"g-nav-item" + (active === n.id ? " on" : "")}
            onClick={() => {
              play("tap");
              router.push(n.href);
            }}
          >
            <span className="g-nav-ico"><Icon name={n.icon} size={19} tone={active === n.id ? "green" : "sage"} /></span>
            {t(L, "tab." + n.id)}
          </div>
        ))}
      </nav>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Mini label={t(L, "side.day")} value={String(state.day)} />
        <Mini label={t(L, "side.streak")} value={String(state.streak)} icon="flame" />
      </div>
    </aside>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "9px 6px",
        borderRadius: 12,
        background: "var(--g-card)",
        border: "1px solid var(--g-line-soft)",
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 1.4, color: "var(--g-ink-3)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, color: "var(--g-ink)", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        {icon && <Icon name={icon} size={15} />}
        {value}
      </div>
    </div>
  );
}
