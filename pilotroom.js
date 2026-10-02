/* pilotroom.js — комната пилота: рабочий стол, две папки с делами, аниме-портреты */
(function () {
  "use strict";

  /* ---------- Аниме-портрет: пилот-парень (Артём «Ястреб» Соколов) ---------- */
  function svgPilotM() {
    return `
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pmBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1d2b45"/><stop offset="1" stop-color="#0f1626"/>
        </linearGradient>
        <clipPath id="pmHair"><path d="M58 92 Q52 34 100 28 Q148 34 142 92 L136 74 L128 90 L118 68 L104 88 L92 66 L78 88 L68 70 Z"/></clipPath>
      </defs>
      <rect width="200" height="240" rx="10" fill="url(#pmBg)"/>
      <circle cx="100" cy="70" r="46" fill="#2a3c5e" opacity="0.5"/>
      <!-- шея -->
      <rect x="90" y="128" width="20" height="26" rx="6" fill="#e8b48c"/>
      <!-- китель лётчика -->
      <path d="M40 240 L46 178 Q52 156 78 150 L100 158 L122 150 Q148 156 154 178 L160 240 Z" fill="#33486b" stroke="#22304a" stroke-width="3"/>
      <path d="M78 150 L100 158 L122 150 L118 240 L82 240 Z" fill="#3d5680"/>
      <path d="M92 152 L100 176 L108 152 L100 146 Z" fill="#dbe6f4"/>
      <rect x="97" y="164" width="6" height="34" rx="2" fill="#c9a227"/>
      <polygon points="97,164 103,164 100,172" fill="#ffd23f"/>
      <rect x="56" y="184" width="20" height="12" rx="2" fill="#c9a227" opacity="0.85"/>
      <rect x="124" y="184" width="20" height="12" rx="2" fill="#ff5c5c" opacity="0.8"/>
      <!-- голова -->
      <path d="M64 84 Q64 132 100 138 Q136 132 136 84 L136 70 Q136 44 100 42 Q64 44 64 70 Z" fill="#f2c29be8" stroke="#d99a6c" stroke-width="2"/>
      <path d="M64 84 Q64 132 100 138 Q136 132 136 84 L136 70 Q136 44 100 42 Q64 44 64 70 Z" fill="#f3c79e"/>
      <!-- уши -->
      <ellipse cx="63" cy="94" rx="6" ry="10" fill="#f3c79e" stroke="#d99a6c" stroke-width="1.5"/>
      <ellipse cx="137" cy="94" rx="6" ry="10" fill="#f3c79e" stroke="#d99a6c" stroke-width="1.5"/>
      <!-- волосы тёмно-синие, аниме-чёлка -->
      <g clip-path="url(#pmHair)">
        <path d="M52 30 L148 30 L148 96 L52 96 Z" fill="#232f52"/>
        <path d="M58 92 Q52 34 100 28 Q148 34 142 92 L136 74 L128 90 L118 68 L104 88 L92 66 L78 88 L68 70 Z" fill="#2c3a66"/>
        <path d="M70 40 Q100 26 130 40 L126 52 Q100 40 74 52 Z" fill="#3d5288" opacity="0.9"/>
      </g>
      <path d="M58 92 Q52 34 100 28 Q148 34 142 92 L136 74 L128 90 L118 68 L104 88 L92 66 L78 88 L68 70 Z"
            fill="none" stroke="#1a2340" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- брови -->
      <path d="M74 86 Q84 82 92 86" stroke="#1a2340" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M108 86 Q116 82 126 86" stroke="#1a2340" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <!-- глаза большие, аниме -->
      <ellipse cx="83" cy="100" rx="10" ry="12" fill="#fff"/>
      <ellipse cx="117" cy="100" rx="10" ry="12" fill="#fff"/>
      <circle cx="84" cy="101" r="7" fill="#2f7fd6"/>
      <circle cx="116" cy="101" r="7" fill="#2f7fd6"/>
      <circle cx="84" cy="102" r="3.4" fill="#101a2e"/>
      <circle cx="116" cy="102" r="3.4" fill="#101a2e"/>
      <circle cx="81" cy="97" r="2.2" fill="#fff"/>
      <circle cx="113" cy="97" r="2.2" fill="#fff"/>
      <path d="M73 92 Q83 86 93 92" stroke="#1a2340" stroke-width="2.6" fill="none"/>
      <path d="M107 92 Q117 86 127 92" stroke="#1a2340" stroke-width="2.6" fill="none"/>
      <!-- нос и рот -->
      <path d="M100 108 l-2.5 8 h5" stroke="#d99a6c" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M92 124 Q100 130 108 124" stroke="#a4553f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <!-- rumянец -->
      <ellipse cx="76" cy="114" rx="7" ry="3.4" fill="#e8896b" opacity="0.35"/>
      <ellipse cx="124" cy="114" rx="7" ry="3.4" fill="#e8896b" opacity="0.35"/>
    </svg>`;
  }

  /* ---------- Аниме-портрет: пилот-девушка (Алиса «Ласточка» Верещагина) ---------- */
  function svgPilotF() {
    return `
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pfBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#45264a"/><stop offset="1" stop-color="#1c1430"/>
        </linearGradient>
      </defs>
      <rect width="200" height="240" rx="10" fill="url(#pfBg)"/>
      <circle cx="100" cy="70" r="46" fill="#6e3f7d" opacity="0.4"/>
      <!-- длинные волосы за спиной -->
      <path d="M56 96 Q44 150 58 214 L74 214 Q64 150 72 110 Z" fill="#7e4fa0"/>
      <path d="M144 96 Q156 150 142 214 L126 214 Q136 150 128 110 Z" fill="#7e4fa0"/>
      <!-- шея -->
      <rect x="91" y="128" width="18" height="26" rx="6" fill="#f0bd97"/>
      <!-- китель -->
      <path d="M44 240 L50 178 Q56 158 80 152 L100 160 L120 152 Q144 158 150 178 L156 240 Z" fill="#4a3568" stroke="#33244a" stroke-width="3"/>
      <path d="M80 152 L100 160 L120 152 L116 240 L84 240 Z" fill="#5b4280"/>
      <path d="M93 154 L100 178 L107 154 L100 148 Z" fill="#ffeef5"/>
      <rect x="97.5" y="166" width="5" height="32" rx="2" fill="#e0559d"/>
      <rect x="58" y="186" width="18" height="11" rx="2" fill="#e0559d" opacity="0.85"/>
      <rect x="124" y="186" width="18" height="11" rx="2" fill="#7de3ff" opacity="0.8"/>
      <!-- лицо -->
      <path d="M66 84 Q66 134 100 140 Q134 134 134 84 L134 70 Q134 46 100 44 Q66 46 66 70 Z" fill="#f8d3ac"/>
      <!-- уши + серьги -->
      <ellipse cx="65" cy="96" rx="5.5" ry="9" fill="#f8d3ac"/>
      <ellipse cx="135" cy="96" rx="5.5" ry="9" fill="#f8d3ac"/>
      <circle cx="65" cy="108" r="2.4" fill="#ffd23f"/>
      <circle cx="135" cy="108" r="2.4" fill="#ffd23f"/>
      <!-- чёлка и хвостик -->
      <path d="M60 92 Q54 36 100 30 Q146 36 140 92 L132 66 Q120 52 100 52 Q80 52 68 66 Z" fill="#9461b8" stroke="#6c3f8c" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M68 66 Q84 58 100 60 L92 78 Q80 72 74 80 Z" fill="#a878cc"/>
      <path d="M132 66 Q116 58 100 60 L108 78 Q120 72 126 80 Z" fill="#a878cc"/>
      <path d="M70 44 Q100 30 130 44 L126 54 Q100 42 74 54 Z" fill="#b98ad8" opacity="0.8"/>
      <!-- заколка-звезда -->
      <polygon points="140,70 143,78 151,78 145,83 147,91 140,86 133,91 135,83 129,78 137,78" fill="#ffd23f" stroke="#c9a227" stroke-width="1"/>
      <!-- брови -->
      <path d="M76 88 Q84 84 91 87" stroke="#5c3a72" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M109 87 Q116 84 124 88" stroke="#5c3a72" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- глаза -->
      <ellipse cx="84" cy="102" rx="10" ry="12.5" fill="#fff"/>
      <ellipse cx="116" cy="102" rx="10" ry="12.5" fill="#fff"/>
      <circle cx="85" cy="103" r="7.2" fill="#37bf8a"/>
      <circle cx="115" cy="103" r="7.2" fill="#37bf8a"/>
      <circle cx="85" cy="104" r="3.4" fill="#12251d"/>
      <circle cx="115" cy="104" r="3.4" fill="#12251d"/>
      <circle cx="82" cy="99" r="2.4" fill="#fff"/>
      <circle cx="112" cy="99" r="2.4" fill="#fff"/>
      <path d="M74 93 Q84 87 94 93" stroke="#3a2547" stroke-width="2.6" fill="none"/>
      <path d="M106 93 Q116 87 126 93" stroke="#3a2547" stroke-width="2.6" fill="none"/>
      <!-- ресницы -->
      <path d="M74 95 l-3 -3 M126 95 l3 -3" stroke="#3a2547" stroke-width="2" stroke-linecap="round"/>
      <!-- нос, улыбка -->
      <path d="M100 110 l-2 7 h4" stroke="#e0a878" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M93 126 Q100 132 107 126" stroke="#c65b7c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M96 128 Q100 131 104 128" fill="#e07a9b" opacity="0.7"/>
      <!-- румянец -->
      <ellipse cx="77" cy="116" rx="7" ry="3.6" fill="#f09aa8" opacity="0.5"/>
      <ellipse cx="123" cy="116" rx="7" ry="3.6" fill="#f09aa8" opacity="0.5"/>
    </svg>`;
  }

  /* ---------- Папка с делом (фрагмент SVG для вставки в сцену комнаты) ---------- */
  function svgFolder(color, dark, label, emblem) {
    return `
    <g filter="url(#folderShadow)">
        <!-- корешок и клапан -->
        <path d="M14 30 Q14 14 30 14 L96 14 L112 34 L210 34 Q226 34 226 50 L226 276 Q226 292 210 292 L30 292 Q14 292 14 276 Z"
              fill="${color}" stroke="${dark}" stroke-width="5"/>
        <path d="M14 60 L226 60" stroke="${dark}" stroke-width="3" opacity="0.6"/>
        <!-- листы, торчащие из папки -->
        <rect x="34" y="20" width="170" height="24" rx="3" fill="#f4ecd8" stroke="#c9bf9f" stroke-width="2"/>
        <rect x="42" y="12" width="150" height="22" rx="3" fill="#fbf6e8" stroke="#c9bf9f" stroke-width="2"/>
        <!-- эмблема управления мехов -->
        <circle cx="120" cy="140" r="52" fill="none" stroke="${dark}" stroke-width="5"/>
        <path d="M96 128 L120 108 L144 128 L144 158 L120 178 L96 158 Z" fill="${dark}"/>
        <path d="M108 136 L120 126 L132 136 L132 152 L120 162 L108 152 Z" fill="${color}"/>
        <text x="120" y="212" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="${dark}">${emblem}</text>
        <!-- подпись дела -->
        <rect x="34" y="234" width="172" height="40" rx="6" fill="#f4ecd8" stroke="${dark}" stroke-width="3"/>
        <text x="120" y="251" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="13" fill="#3a3226">ЛИЧНОЕ ДЕЛО</text>
        <text x="120" y="267" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b5f45">${label}</text>
      </g>`;
  }

  /* ---------- Папка, «лежащая» на столе: лёгкий перспективный наклон ---------- */
  function svgFolderOnDesk(color, dark, label, emblem) {
    return `
    <g transform="scale(1 0.8)">
      ${svgFolder(color, dark, label, emblem)}
    </g>`;
  }

  window.PILOT_ROOM = { svgPilotM, svgPilotF, svgFolder, svgFolderOnDesk };
})();
