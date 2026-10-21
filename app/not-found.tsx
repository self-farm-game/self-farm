"use client";
/**
 * 404 — не технічна сторінка, а місце в грі.
 *
 * Гравець не «отримав помилку», а зайшов за край саду: заросла стежка,
 * туман, світлячки й Бомбом, який бурчить, що тут нічого немає. Та сама
 * мова темного скла, що й у вкладках, тільки без острова позаду — сюди
 * 3D-сцена не дотягується, тому атмосферу малюємо CSS-ом.
 *
 * Next рендерить цей файл для будь-якого невідомого шляху, тож тут
 * видно і сам шлях — як напис на вказівнику.
 */
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { t } from "@/lib/mock-data/i18n";
import { play } from "@/lib/sound/sound";
import dynamic from "next/dynamic";

const BombomScene = dynamic(() => import("@/components/garden3d/BombomScene"), {
  ssr: false,
  loading: () => <div className="sf-bombom3d" />,
});

const LINE_KEYS = ["nf.line1", "nf.line2", "nf.line3", "nf.line4", "nf.line5"];

/** Світлячки: детерміновані позиції, щоб SSR і клієнт не розходились. */
function Fireflies({ n = 14 }: { n?: number }) {
  const bugs = useMemo(() => {
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: n }, () => ({
      x: rnd() * 100,
      y: 12 + rnd() * 76,
      d: 5 + rnd() * 7,
      delay: rnd() * 6,
      size: rnd() < 0.7 ? 3 : 4,
      drift: (rnd() - 0.5) * 60,
    }));
  }, [n]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {bugs.map((b, i) => (
        <span
          key={i}
          className="nf-bug"
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: "#f4e3a0",
            boxShadow: "0 0 10px 2px rgba(244,227,160,.55)",
            // @ts-expect-error — своя CSS-змінна для горизонтального дрейфу
            "--drift": `${b.drift}px`,
            animation: `nf-float ${b.d}s ease-in-out ${b.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useGame();
  const L = state.lang;

  // Репліку беремо один раз на показ: вона не має стрибати при ререндері.
  const [lineKey, setLineKey] = useState(LINE_KEYS[0]);
  useEffect(() => {
    setLineKey(LINE_KEYS[Math.floor(Math.random() * LINE_KEYS.length)]);
  }, []);

  const goHome = () => {
    play("tap");
    router.push("/garden");
  };

  return (
    <div className="nf-wrap">
      {/* далекі пагорби й туман — глибина без жодної картинки */}
      <div className="nf-sky" />
      <div className="nf-hills" />
      <div className="nf-fog" />
      <Fireflies />

      <div className="nf-panel">
        <div className="l3-crumb" style={{ marginBottom: 14 }}>
          <b>⌁ SELF-FARM</b> <span>/</span> {t(L, "nf.crumb")}
        </div>

        {/* вказівник: похилений стовп із номером помилки */}
        <div className="nf-sign">
          <div className="nf-sign-board">
            <span className="nf-404">404</span>
          </div>
          <div className="nf-sign-post" />
        </div>

        <h1 className="nf-title">{t(L, "nf.title")}</h1>
        <p className="nf-sub">{t(L, "nf.sub")}</p>

        <div className="nf-path">
          <span className="nf-path-cap">{t(L, "nf.signpost")}</span>
          <code>{pathname}</code>
        </div>

        <div className="nf-bombom">
          <BombomScene />
          <div className="nf-say">
            <div className="nf-who">{t(L, "bombom.name")}</div>
            {t(L, lineKey)}
          </div>
        </div>

        <button className="l3-btn" onClick={goHome} style={{ marginTop: 20, width: "100%" }}>
          {t(L, "nf.back")}
        </button>

        <div className="nf-note">{t(L, "nf.note")}</div>
      </div>
    </div>
  );
}
