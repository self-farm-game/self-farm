"use client";
/**
 * Бомбом.
 *
 * Був растровим спрайтом в іншій манері, ніж острів, і помітно з нього
 * випадав. Тепер намальований тією ж гранчастою мовою, що й сад та
 * іконки: пласкі грані, світло згори-зліва, жодних градієнтів. SVG, тож
 * лишається чітким на будь-якому розмірі й важить кілька кілобайт.
 */
export default function Bombom({
  size = 110,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 120 162"
      width={size}
      height={(size * 162) / 120}
      className={className}
      style={style}
      role="img"
      aria-label="Бомбом"
    >
      <path d="M30 144 L53 142 L56 160 L26 160 Z" fill="#473425"/>
      <path d="M67 142 L90 144 L93 160 L64 160 Z" fill="#35271b"/>
      <path d="M30 106 L90 102 L98 150 L22 154 Z" fill="#3f7a46"/>
      <path d="M30 106 L60 104 L60 152 L22 154 Z" fill="#57965b"/>
      <path d="M22 154 L98 150 L96 157 L24 160 Z" fill="#2c5934"/>
      <path d="M18 110 L33 105 L30 140 L13 143 Z" fill="#2f5e37"/>
      <path d="M87 102 L102 108 L105 140 L88 141 Z" fill="#2f5e37"/>
      <path d="M86 136 L104 136 L104 154 L86 154 Z" fill="#b8892f"/>
      <path d="M89 139 L101 139 L101 151 L89 151 Z" fill="#ffe9a8"/>
      <path d="M88 130 L102 130 L102 136 L88 136 Z" fill="#8a6520"/>
      <path d="M85 133 L100 133 L100 142 L85 142 Z" fill="#2f5e37"/>
      <path d="M80 8 L14 70 L50 76 Z" fill="#cf5248"/>
      <path d="M80 8 L50 76 L104 62 Z" fill="#9c342e"/>
      <path d="M80 8 L50 76 L66 44 Z" fill="#b84239"/>
      <path d="M80 2 L88 9 L80 16 L72 9 Z" fill="#f3f7f3"/>
      <path d="M12 62 L108 56 L110 78 L10 84 Z" fill="#7d2a2a"/>
      <path d="M12 62 L60 59 L60 81 L10 84 Z" fill="#9c342e"/>
      <path d="M34 78 L86 75 L84 97 L36 100 Z" fill="#f0c9a8"/>
      <path d="M34 78 L60 76.5 L60 98.5 L36 100 Z" fill="#fadcc0"/>
      <path d="M39 81 L48 80 L48 88 L39 89 Z" fill="#33291f"/>
      <path d="M72 79 L81 78 L81 86 L72 87 Z" fill="#33291f"/>
      <path d="M53 84 L71 82 L69 101 L55 102 Z" fill="#e3a87c"/>
      <path d="M22 90 L98 84 L88 130 L58 148 L30 128 Z" fill="#e4eae4"/>
      <path d="M60 87 L98 84 L88 130 L58 148 Z" fill="#b9c6bb"/>
      <path d="M30 128 L58 148 L46 132 Z" fill="#cfd8d0"/>
      <path d="M38 88 L82 85 L75 102 L44 105 Z" fill="#f6faf6"/>
    </svg>
  );
}
