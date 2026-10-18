"use client";
/**
 * Бомбом.
 *
 * Був растровим спрайтом в іншій манері, ніж острів, і помітно з нього
 * випадав. Намальований наново тією ж гранчастою мовою, що й сад: пласкі
 * грані, світло згори-зліва, жодних градієнтів.
 *
 * Поза й деталі — з оригінального спрайта, а не вигадані: він сидить,
 * ковпак високий і без білої опушки (інакше виходить Санта, а не гном),
 * за спиною скатки, очі заплющені — він спокійний.
 *
 * Порядок шарів тут не косметичний: комір мусить лежати ПІД обличчям,
 * інакше він накриває ніс і вуса.
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
      viewBox="0 0 132 152"
      width={size}
      height={(size * 152) / 132}
      className={className}
      style={style}
      role="img"
      aria-label="Бомбом"
    >
      <path d="M10 62 L34 64 L34 90 L10 88 Z" fill="#8a6339"/>
      <path d="M10 62 L20.8 63 L20.8 89 L10 88 Z" fill="#a97d4c"/>
      <path d="M5 65 L14 63 L16 86 L7 88 Z" fill="#4b351d"/>
      <path d="M7 71.1 L13 70.58 L13 75 L7 75.52 Z" fill="#8a6339"/>
      <path d="M8 92 L32 94 L32 120 L8 118 Z" fill="#6a4b2b"/>
      <path d="M8 92 L18.8 93 L18.8 119 L8 118 Z" fill="#8a6339"/>
      <path d="M3 95 L12 93 L14 116 L5 118 Z" fill="#372612"/>
      <path d="M5 101.1 L11 100.58 L11 105 L5 105.52 Z" fill="#6a4b2b"/>
      <path d="M96 62 L120 66 L122 92 L98 88 Z" fill="#6a4b2b"/>
      <path d="M110 62 L120 66 L122 92 L112 88 Z" fill="#4b351d"/>
      <path d="M118 65 L126 68 L127 90 L119 88 Z" fill="#372612"/>
      <path d="M96 94 L120 98 L122 124 L98 120 Z" fill="#4b351d"/>
      <path d="M110 94 L120 98 L122 124 L112 120 Z" fill="#372612"/>
      <path d="M32 110 L56 108 L60 134 L30 136 Z" fill="#2f5e33"/>
      <path d="M76 108 L100 110 L102 136 L72 134 Z" fill="#214825"/>
      <path d="M28 128 L58 126 L61 142 L26 144 Z" fill="#45321f"/>
      <path d="M28 128 L41 127 L43 143 L26 144 Z" fill="#5e4631"/>
      <path d="M24 139 L61 137 L63 146 L22 148 Z" fill="#2b2016"/>
      <path d="M74 126 L104 128 L106 144 L71 142 Z" fill="#45321f"/>
      <path d="M74 126 L87 127 L89 143 L71 142 Z" fill="#5e4631"/>
      <path d="M69 137 L106 139 L108 148 L67 146 Z" fill="#2b2016"/>
      <path d="M32 66 L100 66 L108 120 L24 120 Z" fill="#427e45"/>
      <path d="M32 66 L66 66 L66 120 L24 120 Z" fill="#58984f"/>
      <path d="M32 66 L45 66 L41 120 L24 120 Z" fill="#71b070"/>
      <path d="M88 66 L100 66 L108 120 L94 120 Z" fill="#214825"/>
      <path d="M22 84 L40 78 L38 114 L18 116 Z" fill="#2f5e33"/>
      <path d="M22 84 L30 82 L28 115 L18 116 Z" fill="#427e45"/>
      <path d="M110 84 L92 78 L94 114 L114 116 Z" fill="#214825"/>
      <path d="M16 110 L38 108 L39 121 L17 123 Z" fill="#214825"/>
      <path d="M116 110 L94 108 L93 121 L115 123 Z" fill="#214825"/>
      <path d="M18 117 L38 115 L39 128 L20 130 Z" fill="#eec5a1"/>
      <path d="M18 117 L28 116 L29 129 L20 130 Z" fill="#fadcc0"/>
      <path d="M114 115 L94 117 L95 130 L113 128 Z" fill="#dca47c"/>
      <path d="M44 64 L90 59 L86 80 L50 83 Z" fill="#2f5e33"/>
      <path d="M44 64 L66 62 L64 82 L50 83 Z" fill="#427e45"/>
      <path d="M86 92 L94 91.4 L94.6 99 L86.6 99.6 Z" fill="#a97d4c"/>
      <path d="M87 106 L95 105.4 L95.6 113 L87.6 113.6 Z" fill="#a97d4c"/>
      <path d="M68 1 L20 44 L40 50 Z" fill="#ef6a56"/>
      <path d="M68 1 L40 50 L66 54 Z" fill="#dc5443"/>
      <path d="M68 1 L66 54 L92 49 Z" fill="#bf4234"/>
      <path d="M68 1 L92 49 L104 40 Z" fill="#9a3026"/>
      <path d="M68 1 L82 22 L92 49 L104 40 Z" fill="#75231c"/>
      <path d="M20 42 L104 35 L106 50 L19 58 Z" fill="#9a3026"/>
      <path d="M20 42 L62 38.5 L62 54 L19 58 Z" fill="#bf4234"/>
      <path d="M19 56 L106 48 L106 54 L19 62 Z" fill="#75231c"/>
      <path d="M30 54 L96 48 L94 92 L32 96 Z" fill="#eec5a1"/>
      <path d="M30 54 L63 51 L63 94 L32 96 Z" fill="#fadcc0"/>
      <path d="M30 54 L96 48 L95 60 L31 65 Z" fill="#c0825a"/>
      <path d="M34 68 L50 66 L49 80 L35 81 Z" fill="#e79b84"/>
      <path d="M78 62 L93 60 L92 74 L79 75 Z" fill="#e79b84"/>
      <path d="M36 62 L54 60 L54 64 L36 66 Z" fill="#2a221b"/>
      <path d="M36 65 L45 64 L45 67 L36 68 Z" fill="#2a221b"/>
      <path d="M72 58 L90 56 L90 60 L72 62 Z" fill="#2a221b"/>
      <path d="M81 61 L90 60 L90 63 L81 64 Z" fill="#2a221b"/>
      <path d="M33 53 L55 50.5 L55 57 L33 59.5 Z" fill="#d0dad2"/>
      <path d="M33 53 L44 51.7 L44 58.2 L33 59.5 Z" fill="#e7ede8"/>
      <path d="M70 49 L92 46.5 L92 53 L70 55.5 Z" fill="#b3c0b6"/>
      <path d="M54 60 L76 57.5 L79 86 L57 89 Z" fill="#dca47c"/>
      <path d="M54 60 L64 59 L66 88 L57 89 Z" fill="#eec5a1"/>
      <path d="M66 78 L79 76.5 L79 86 L66 87.5 Z" fill="#c0825a"/>
      <path d="M59 83 L64 82.5 L64 86.5 L59 87 Z" fill="#1a1410"/>
      <path d="M71 81 L76 80.5 L76 84.5 L71 85 Z" fill="#1a1410"/>
      <path d="M32 80 L60 77 L57 98 L36 95 Z" fill="#e7ede8"/>
      <path d="M72 75 L96 72 L93 93 L74 96 Z" fill="#d0dad2"/>
      <path d="M32 80 L44 78.7 L43 96.4 L36 95 Z" fill="#f8fbf8"/>
      <path d="M57 87 L74 85 L72 96 L58 97.5 Z" fill="#b3c0b6"/>
      <path d="M34 90 L96 84 L88 124 L62 140 L40 120 Z" fill="#e7ede8"/>
      <path d="M65 87 L96 84 L88 124 L62 140 Z" fill="#d0dad2"/>
      <path d="M34 90 L48 88.6 L45 117 L40 120 Z" fill="#f8fbf8"/>
      <path d="M48 88.6 L61 87.4 L58 130 L49 122 Z" fill="#e7ede8"/>
      <path d="M61 87.4 L76 86 L74 136 L61 140 Z" fill="#f8fbf8"/>
      <path d="M76 86 L88 85 L84 122 L76 130 Z" fill="#d0dad2"/>
      <path d="M88 85 L96 84 L88 124 L84 119 Z" fill="#b3c0b6"/>
      <path d="M40 120 L52 123 L47 127 Z" fill="#d0dad2"/>
      <path d="M58 130 L66 135 L59 138 Z" fill="#b3c0b6"/>
      <path d="M74 136 L84 122 L83 131 Z" fill="#b3c0b6"/>
      <path d="M22 143 L110 143 L102 150 L30 150 Z" fill="#0d241f"/>
    </svg>
  );
}
