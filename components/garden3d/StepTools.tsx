"use client";
/**
 * Інструменти кроку: поле для письма й відлік часу.
 *
 * Головне правило продукту тут не порушується: писати НІКОЛИ не
 * обовʼязково. Поле просто є, кнопка «Зробив» не чекає на нього, а
 * написане не зникає — воно лягає в запис журналу наприкінці стежки.
 *
 * Таймер так само нічого не блокує: можна дочекатись, можна не
 * дочікуватись, можна взагалі не вмикати.
 */
import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/mock-data/i18n";
import { mmss } from "@/lib/utils/quest-steps";
import Icon from "@/components/icons/Icon";
import { play } from "@/lib/sound/sound";

export function StepWrite({
  L,
  value,
  onChange,
}: {
  L: Lang;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="l3-tool">
      <div className="l3-tool-cap">
        <Icon name="note" size={14} />
        {t(L, "step.write_cap")}
      </div>
      <textarea
        className="l3-tool-area"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(L, "step.write_ph")}
      />
      <div className="l3-tool-note">{t(L, "step.write_note")}</div>
    </div>
  );
}

export function StepTimer({ L, seconds }: { L: Lang; seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Нова тривалість — новий крок: скидаємо все.
  useEffect(() => {
    setLeft(seconds);
    setRunning(false);
    setDone(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          if (tick.current) clearInterval(tick.current);
          setRunning(false);
          setDone(true);
          try {
            play("reward");
          } catch {}
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  const pct = seconds > 0 ? 1 - left / seconds : 0;

  return (
    <div className="l3-tool">
      <div className="l3-tool-cap">
        <Icon name="timer" size={14} />
        {t(L, "step.timer_cap")}
      </div>
      <div className="l3-timer">
        <div className={"l3-timer-num" + (done ? " l3-on" : "")}>{mmss(left)}</div>
        <button
          className={"l3-btn l3-sm" + (running ? " l3-btn-soft" : "")}
          onClick={() => {
            play("select");
            if (done) {
              setLeft(seconds);
              setDone(false);
              setRunning(true);
            } else {
              setRunning((r) => !r);
            }
          }}
        >
          {done ? t(L, "step.timer_again") : running ? t(L, "step.timer_pause") : t(L, "step.timer_start")}
        </button>
      </div>
      <div className="l3-bar">
        <i style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <div className="l3-tool-note">{done ? t(L, "step.timer_done") : t(L, "step.timer_note")}</div>
    </div>
  );
}
