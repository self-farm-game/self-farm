"use client";
/**
 * Іконки Self-Farm.
 *
 * Чому не емодзі: вони виглядають по-різному на кожній системі (на Windows
 * одне, на iPhone інше), тягнуть за собою чужу кольорову гаму й ніяк не
 * вписуються в темне скло.
 *
 * Чому не three.js: на сторінці буває 20–30 іконок одночасно, і стільки ж
 * WebGL-полотен поклали б її намертво — острів уже тримає одне. Тому той
 * самий низькополігональний вигляд намальований як SVG: ті ж гранчасті
 * форми, те ж пласке затінення, світло згори-зліва, але чітко на будь-якому
 * розмірі й невагомо.
 *
 * Кожна іконка — кілька багатокутників у сітці 24×24 з трьома тонами:
 *   --i1  освітлена грань (верх, ліво)
 *   --i2  основна
 *   --i3  тіньова грань (низ, право)
 *   --ia  акцент — те, на що має впасти око
 * Тони задає `tone`, тож одна й та сама форма може бути камʼяною, зеленою
 * чи золотою, не змінюючи геометрії.
 */
import { ICONS, type IconName } from "./paths";

export type { IconName };

export type IconTone = "sage" | "gold" | "green" | "stone" | "water" | "flame" | "plum" | "rose";

export default function Icon({
  name,
  size = 22,
  tone,
  className,
  style,
}: {
  name: IconName | string;
  size?: number;
  tone?: IconTone;
  className?: string;
  style?: React.CSSProperties;
}) {
  const def = ICONS[name as IconName];
  if (!def) {
    // Невідома назва не має ламати екран: лишаємо порожнє місце рівно
    // такого ж розміру, щоб ряд не стрибнув.
    return <span className="sf-ico" style={{ width: size, height: size, ...style }} aria-hidden />;
  }
  const [parts, defTone] = def;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`sf-ico sf-ico-${tone || defTone}${className ? " " + className : ""}`}
      style={style}
      aria-hidden
      focusable="false"
    >
      {parts.map((p, i) => (
        <path key={i} d={p[0]} fill={`var(--i${p[1]})`} />
      ))}
    </svg>
  );
}
