/**
 * Prototype-safe visual assets for JedaIn Traveler MVP.
 * Provides curated, authentic, lightweight prototype-safe SVG illustrations
 * depicting Indonesian nature, local craft workshops, and wellness retreats.
 */

export interface VisualAssetData {
  id: string;
  title: string;
  svgDataUri: string;
  themeColor: string;
  aspectRatio?: string;
}

export const PACKAGE_VISUALS: Record<string, VisualAssetData> = {
  slow_green_day: {
    id: "slow_green_day",
    title: "Sehari Pelan di Lereng Hijau",
    themeColor: "#285e3d",
    // Rolling hills of Batu / Malang with morning mist, tea plantation slopes and calm sunrise
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23E0F2E9"/>
          <stop offset="45%" stop-color="%23FDF8EE"/>
          <stop offset="100%" stop-color="%23F4EAD4"/>
        </linearGradient>
        <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="%23FFF2B2"/>
          <stop offset="100%" stop-color="%23F9B658"/>
        </linearGradient>
        <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%238DBCA0" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="%23568F6E" stop-opacity="0.85"/>
        </linearGradient>
        <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%234A8360"/>
          <stop offset="100%" stop-color="%232E6344"/>
        </linearGradient>
        <linearGradient id="teaSlope1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%233E7E56"/>
          <stop offset="100%" stop-color="%231E4D30"/>
        </linearGradient>
        <linearGradient id="teaSlope2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="%2329663E"/>
          <stop offset="100%" stop-color="%23123821"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(%23sky)"/>
      <circle cx="560" cy="180" r="65" fill="url(%23sun)" opacity="0.85"/>
      <!-- Distant Mountains -->
      <path d="M120 280 Q260 140 400 280 T680 280 Q760 210 800 240 L800 500 L0 500 L0 260 Q50 240 120 280 Z" fill="url(%23mountainFar)"/>
      <!-- Mid Hills -->
      <path d="M0 320 Q160 210 340 320 Q520 230 720 340 L800 320 L800 500 L0 500 Z" fill="url(%23mountainMid)"/>
      <!-- Tea Plantations Contours -->
      <path d="M0 360 C180 300 360 410 580 330 C690 290 760 330 800 360 L800 500 L0 500 Z" fill="url(%23teaSlope1)"/>
      <path d="M0 420 Q240 340 480 430 Q680 370 800 420 L800 500 L0 500 Z" fill="url(%23teaSlope2)"/>
      <!-- Terraced Rows Pattern -->
      <path d="M20 440 Q180 380 340 430 M50 460 Q260 395 440 455 M380 420 Q540 370 760 415 M430 445 Q590 390 790 435" stroke="%235DAE76" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.45"/>
      <!-- Atmospheric Mist -->
      <rect y="290" width="800" height="50" fill="%23FFFFFF" opacity="0.22"/>
      <!-- Foreground Pine Silhouettes -->
      <path d="M720 500 L720 400 L705 425 L720 370 L710 390 L720 345 L730 390 L720 370 L735 425 Z" fill="%230F2117" opacity="0.8"/>
      <path d="M760 500 L760 420 L748 440 L760 395 L752 410 L760 375 L768 410 L760 395 L772 440 Z" fill="%230F2117" opacity="0.85"/>
      <path d="M680 500 L680 440 L670 455 L680 420 L673 430 L680 405 L687 430 L680 420 L690 455 Z" fill="%230F2117" opacity="0.75"/>
    </svg>`,
  },

  creative_village_halfday: {
    id: "creative_village_halfday",
    title: "Ruang Kreatif Desa",
    themeColor: "#805826",
    // Artisan pottery & bamboo craft workshop in a lush Javanese village setting
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="warmBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23FDF6EB"/>
          <stop offset="60%" stop-color="%23F5E7CD"/>
          <stop offset="100%" stop-color="%23E7D1A8"/>
        </linearGradient>
        <linearGradient id="potteryClay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="%23C27648"/>
          <stop offset="100%" stop-color="%237D3C1B"/>
        </linearGradient>
        <linearGradient id="potteryTerracotta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="%23D98A5B"/>
          <stop offset="100%" stop-color="%239E502B"/>
        </linearGradient>
        <linearGradient id="woodTable" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23664522"/>
          <stop offset="100%" stop-color="%233D2712"/>
        </linearGradient>
        <linearGradient id="villageGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%2368A37E"/>
          <stop offset="100%" stop-color="%23376B4B"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(%23warmBg)"/>
      <!-- Soft Garden/Veranda Backdrop -->
      <circle cx="160" cy="180" r="140" fill="url(%23villageGreen)" opacity="0.3"/>
      <circle cx="680" cy="200" r="170" fill="url(%23villageGreen)" opacity="0.25"/>
      <!-- Bamboo blinds pattern top -->
      <path d="M0 20 L800 20 M0 40 L800 40 M0 60 L800 60 M0 80 L800 80" stroke="%23DCC58C" stroke-width="3" stroke-dasharray="14,6" opacity="0.4"/>
      <!-- Workshop Table -->
      <path d="M0 340 L800 320 L800 500 L0 500 Z" fill="url(%23woodTable)"/>
      <!-- Ceramic Vessels on Table -->
      <!-- Big Center Vase -->
      <path d="M380 340 C350 335 340 270 365 240 C375 225 375 205 370 195 L430 195 C425 205 425 225 435 240 C460 270 450 335 420 340 Z" fill="url(%23potteryClay)"/>
      <ellipse cx="400" cy="195" rx="30" ry="6" fill="%23562C16"/>
      <!-- Warm Glaze Highlight -->
      <path d="M380 230 Q370 270 385 315" stroke="%23F5D6B8" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>
      <!-- Small Terracotta Bowl Left -->
      <path d="M220 360 C190 360 180 315 210 290 L300 290 C330 315 320 360 290 360 Z" fill="url(%23potteryTerracotta)"/>
      <ellipse cx="255" cy="290" rx="45" ry="9" fill="%236B3114"/>
      <!-- Slender Water Jar Right -->
      <path d="M510 350 C490 350 480 300 500 270 C510 255 510 230 505 210 L545 210 C540 230 540 255 550 270 C570 300 560 350 540 350 Z" fill="url(%23potteryTerracotta)"/>
      <!-- Foliage silhouettes behind table -->
      <path d="M80 340 Q100 240 130 190 Q150 260 160 340 M100 280 Q130 220 180 230 M620 330 Q650 220 690 170 Q710 250 720 330" stroke="%232E6344" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.65"/>
    </svg>`,
  },

  mindful_morning: {
    id: "mindful_morning",
    title: "Pagi Hening & Mindful Reset",
    themeColor: "#285c91",
    // Serene mountain spring pool, pine morning mist, morning light in Mojokerto
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="morningSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23D4E7F7"/>
          <stop offset="50%" stop-color="%23EDF5FC"/>
          <stop offset="100%" stop-color="%23F3F7EB"/>
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%237CAFCB"/>
          <stop offset="50%" stop-color="%233E789F"/>
          <stop offset="100%" stop-color="%231E4F6E"/>
        </linearGradient>
        <linearGradient id="forestBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23679883"/>
          <stop offset="100%" stop-color="%233B6A56"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(%23morningSky)"/>
      <!-- Soft Morning Sunlight -->
      <circle cx="200" cy="140" r="90" fill="%23FFFBEA" opacity="0.75"/>
      <!-- Pine Ridge Silhouette -->
      <path d="M0 260 L40 230 L80 265 L130 215 L180 260 L240 205 L300 260 L380 195 L460 260 L540 210 L620 265 L700 220 L770 260 L800 240 L800 500 L0 500 Z" fill="url(%23forestBack)" opacity="0.6"/>
      <!-- Closer Forest -->
      <path d="M0 290 Q200 250 400 290 Q600 260 800 290 L800 500 L0 500 Z" fill="%2323523E"/>
      <!-- Still Water Spring -->
      <path d="M0 340 Q220 310 440 335 Q650 315 800 340 L800 500 L0 500 Z" fill="url(%23waterGrad)"/>
      <!-- Water Ripples & Morning Light Reflection -->
      <ellipse cx="400" cy="380" rx="180" ry="12" fill="%23BDE1F5" opacity="0.45"/>
      <ellipse cx="400" cy="420" rx="260" ry="16" fill="%23E0F2FC" opacity="0.35"/>
      <ellipse cx="400" cy="465" rx="340" ry="20" fill="%23FFFFFF" opacity="0.25"/>
      <!-- Wooden meditation dock on right edge -->
      <path d="M580 430 L800 370 L800 480 L580 500 Z" fill="%234A3826"/>
      <path d="M580 430 L800 370 L800 390 L580 445 Z" fill="%237A5E43"/>
    </svg>`,
  },

  light_mountain_explore: {
    id: "light_mountain_explore",
    title: "Jelajah Santai Pegunungan",
    themeColor: "#3a915b",
    // Sunny outdoor mountain trail in Pasuruan with pine canopy and open sky
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="skyPass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%23BDE0FE"/>
          <stop offset="60%" stop-color="%23EAF4FC"/>
          <stop offset="100%" stop-color="%23FFF9EE"/>
        </linearGradient>
        <linearGradient id="peakFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%236B9B8A"/>
          <stop offset="100%" stop-color="%23437563"/>
        </linearGradient>
        <linearGradient id="trailGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="%23D8C3A5"/>
          <stop offset="100%" stop-color="%239E8262"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(%23skyPass)"/>
      <!-- High Mountain Peak (Welirang / Arjuno backdrop) -->
      <polygon points="420,110 240,290 620,290" fill="url(%23peakFar)" opacity="0.6"/>
      <polygon points="560,160 440,290 730,290" fill="url(%23peakFar)" opacity="0.45"/>
      <!-- Mountain Ridges -->
      <path d="M0 280 Q180 200 380 270 Q560 220 800 270 L800 500 L0 500 Z" fill="%23387050"/>
      <path d="M0 330 Q260 270 520 340 L800 310 L800 500 L0 500 Z" fill="%23245439"/>
      <!-- Forest Floor & Trail -->
      <path d="M0 380 Q320 330 800 370 L800 500 L0 500 Z" fill="%23173D27"/>
      <!-- Curving Walking Trail -->
      <path d="M260 500 Q360 430 420 390 Q460 360 480 340 L510 340 Q490 365 440 405 Q370 455 310 500 Z" fill="url(%23trailGrad)"/>
      <!-- Pine Trees Framing Left & Right -->
      <path d="M60 500 L60 320 L45 350 L60 280 L48 305 L60 245 L72 305 L60 280 L75 350 Z" fill="%230F2417" opacity="0.9"/>
      <path d="M120 500 L120 360 L108 385 L120 330 L112 348 L120 305 L128 348 L120 330 L132 385 Z" fill="%230F2417" opacity="0.8"/>
      <path d="M720 500 L720 310 L705 340 L720 270 L710 295 L720 230 L730 295 L720 270 L735 340 Z" fill="%230F2417" opacity="0.9"/>
    </svg>`,
  },

  weekend_nature_reset: {
    id: "weekend_nature_reset",
    title: "Weekend Nature Reset",
    themeColor: "#805826",
    // Evening dusk retreat in Pacet valley with cozy wooden lodge and warm lantern light
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%232D3A54"/>
          <stop offset="40%" stop-color="%2368546E"/>
          <stop offset="75%" stop-color="%23C27E6A"/>
          <stop offset="100%" stop-color="%23F4B574"/>
        </linearGradient>
        <linearGradient id="valleyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="%2324382E"/>
          <stop offset="100%" stop-color="%23101E17"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(%23duskSky)"/>
      <!-- Distant Hills Silhouette at Twilight -->
      <path d="M0 310 Q240 230 460 300 Q680 250 800 290 L800 500 L0 500 Z" fill="%231E2A24" opacity="0.75"/>
      <path d="M0 360 Q300 310 600 370 L800 340 L800 500 L0 500 Z" fill="url(%23valleyDark)"/>
      <!-- Wooden Retreat Cabin on Hillside -->
      <polygon points="340,320 460,320 490,370 310,370" fill="%234A311D"/>
      <polygon points="400,280 320,320 480,320" fill="%232E1D10"/>
      <!-- Warm Cabin Window Glow -->
      <rect x="375" y="335" width="50" height="30" rx="3" fill="%23FFE380" opacity="0.95"/>
      <line x1="400" y1="335" x2="400" y2="365" stroke="%234A311D" stroke-width="2"/>
      <!-- Warm ambient lantern reflections -->
      <circle cx="400" cy="350" r="45" fill="%23FFC043" opacity="0.3"/>
      <circle cx="400" cy="410" r="120" fill="%23FFB03B" opacity="0.15"/>
      <!-- Pine silhouettes at twilight -->
      <path d="M160 500 L160 340 L145 370 L160 300 L150 325 L160 270 L170 325 L160 300 L175 370 Z" fill="%230B140F"/>
      <path d="M210 500 L210 380 L198 405 L210 350 L202 368 L210 325 L218 368 L210 350 L222 405 Z" fill="%230B140F"/>
      <path d="M640 500 L640 330 L625 360 L640 290 L630 315 L640 255 L650 315 L640 290 L655 360 Z" fill="%230B140F"/>
    </svg>`,
  },
};

export const LOGIN_ATMOSPHERE_VISUAL: VisualAssetData = {
  id: "login_atmosphere",
  title: "JedaIn Nature Atmosphere",
  themeColor: "#285e3d",
  svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" width="1000" height="800">
    <defs>
      <linearGradient id="loginSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%23C8E6D3"/>
        <stop offset="40%" stop-color="%23EBF7EE"/>
        <stop offset="80%" stop-color="%23FBF6EA"/>
        <stop offset="100%" stop-color="%23F3E8D0"/>
      </linearGradient>
      <linearGradient id="loginSun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="%23FFF6D1"/>
        <stop offset="100%" stop-color="%23F8BA55"/>
      </linearGradient>
      <linearGradient id="mountain1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%2377B390"/>
        <stop offset="100%" stop-color="%234A8865"/>
      </linearGradient>
      <linearGradient id="mountain2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%233E7E57"/>
        <stop offset="100%" stop-color="%23245436"/>
      </linearGradient>
      <linearGradient id="terraceFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="%231E4D30"/>
        <stop offset="100%" stop-color="%230F2A1A"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="800" fill="url(%23loginSky)"/>
    <circle cx="720" cy="240" r="100" fill="url(%23loginSun)" opacity="0.8"/>
    <!-- Distant Mountain Peaks (Bromo / Semeru silhouette) -->
    <path d="M0 450 Q200 240 450 420 Q650 280 880 430 L1000 390 L1000 800 L0 800 Z" fill="url(%23mountain1)" opacity="0.5"/>
    <path d="M0 510 Q280 340 580 490 Q780 380 1000 480 L1000 800 L0 800 Z" fill="url(%23mountain2)"/>
    <!-- Terraced tea slopes in Batu -->
    <path d="M0 580 Q320 480 680 570 Q860 520 1000 560 L1000 800 L0 800 Z" fill="url(%23terraceFront)"/>
    <!-- Contour lines -->
    <path d="M40 620 Q360 540 700 625 M80 660 Q420 570 820 670 M120 700 Q500 610 940 720" stroke="%235DAE76" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4"/>
    <!-- Foreground Trees -->
    <path d="M860 800 L860 610 L840 655 L860 565 L848 600 L860 525 L872 600 L860 565 L880 655 Z" fill="%230B1C12"/>
    <path d="M920 800 L920 650 L905 685 L920 615 L910 642 L920 580 L930 642 L920 615 L935 685 Z" fill="%230B1C12"/>
  </svg>`,
};

export const DESTINATION_VISUALS: Record<string, VisualAssetData> = {
  "Lereng Hijau Batu": {
    id: "dest_batu",
    title: "Lereng Hijau Batu",
    themeColor: "#285e3d",
    svgDataUri: PACKAGE_VISUALS.slow_green_day.svgDataUri,
  },
  "Desa Wisata Budaya": {
    id: "dest_desa_budaya",
    title: "Desa Wisata Budaya",
    themeColor: "#805826",
    svgDataUri: PACKAGE_VISUALS.creative_village_halfday.svgDataUri,
  },
  "Oase Hening Trawas": {
    id: "dest_trawas",
    title: "Oase Hening Trawas",
    themeColor: "#285c91",
    svgDataUri: PACKAGE_VISUALS.mindful_morning.svgDataUri,
  },
  "Taman Alam Prigen": {
    id: "dest_prigen",
    title: "Taman Alam Prigen",
    themeColor: "#3a915b",
    svgDataUri: PACKAGE_VISUALS.light_mountain_explore.svgDataUri,
  },
  "Lembah Alam Pacet": {
    id: "dest_pacet",
    title: "Lembah Alam Pacet",
    themeColor: "#805826",
    svgDataUri: PACKAGE_VISUALS.weekend_nature_reset.svgDataUri,
  },
};

export function getPackageVisual(packageId: string): VisualAssetData {
  return (
    PACKAGE_VISUALS[packageId] || {
      id: packageId,
      title: "JedaIn Experience",
      themeColor: "#285e3d",
      svgDataUri: PACKAGE_VISUALS.slow_green_day.svgDataUri,
    }
  );
}

export function getDestinationVisual(destinationName: string): VisualAssetData {
  return (
    DESTINATION_VISUALS[destinationName] || {
      id: destinationName,
      title: destinationName,
      themeColor: "#285e3d",
      svgDataUri: PACKAGE_VISUALS.slow_green_day.svgDataUri,
    }
  );
}
