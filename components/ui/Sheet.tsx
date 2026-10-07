"use client";
/**
 * Спливаюче вікно вкладки.
 *
 * Вкладки більше не окремі сторінки з власним фоном: сад лишається живим
 * позаду, а вкладка — напівпрозора панель над ним. Закриття завжди веде
 * до Саду, бо він і є «домівка».
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { play } from "@/lib/sound/sound";

export default function Sheet({
  crumb,
  title,
  sub,
  wide,
  foot,
  note,
  children,
}: {
  crumb: string;
  title: string;
  sub?: string;
  wide?: boolean;
  foot?: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const close = () => {
    play("tap");
    router.push("/garden");
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="l3-scrim" onClick={close}>
      <div className={"l3-modal" + (wide ? " l3-wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="l3-modal-head">
          <div className="l3-crumb">
            <b>⌁ SELF-FARM</b> <span>/</span> {crumb}
          </div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
          <div className="l3-x" onClick={close}>✕</div>
        </div>
        <div className="l3-modal-body">{children}</div>
        {foot && <div className="l3-modal-foot">{foot}</div>}
        {note && <div className="l3-foot-note">{note}</div>}
      </div>
    </div>
  );
}
