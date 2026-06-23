"use client";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/mock-data/content";
import { play } from "@/lib/sound/sound";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = NAV.find((n) => pathname.startsWith(n.href))?.id ?? "garden";

  return (
    <div
      className="sf-bottomnav"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 74,
        zIndex: 30,
        background: "linear-gradient(180deg,#5d3f24,#3a2410)",
        boxShadow: "inset 0 3px 0 rgba(255,220,160,.25), 0 -2px 0 #2a1a0e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
      }}
    >
      {NAV.map((n) => {
        const isActive = active === n.id;
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
              transform: isActive ? "translateY(-3px)" : "none",
              transition: "transform .12s",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                background: isActive
                  ? "radial-gradient(circle,#7bbf5a,#3f6a2a)"
                  : "radial-gradient(circle,#5a3f24,#3a2410)",
                boxShadow: isActive
                  ? "inset 0 1px 0 rgba(255,255,255,.3), 0 0 0 2px #2a1a0e, 0 0 12px rgba(120,200,90,.5)"
                  : "inset 0 1px 0 rgba(255,220,160,.2), 0 0 0 2px #2a1a0e",
                color: isActive ? "#fff" : "#c9a878",
              }}
            >
              {n.icon}
            </div>
            <div
              style={{
                fontSize: 10,
                color: isActive ? "#ffe6b8" : "#9a7f5a",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {n.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
