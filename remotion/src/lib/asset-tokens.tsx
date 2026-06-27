/**
 * Asset Token Library — procedural SVG generators mapped to token strings.
 * Each function returns JSX SVG elements for a specific layer depth.
 * All paths use organic bezier curves — no rigid geometry.
 */

import React from 'react';

type Palette = [string, string, string, string, string]; // [darkest, dark, mid, light, accent]

// ─── SKY LAYER GENERATORS ─────────────────────────────────────────────────────

export function renderSkyToken(token: string, palette: Palette, frame: number): React.ReactNode {
  switch (token) {
    case 'gradient_night':
      return <rect key="sky-night" width="1920" height="1080" fill={`url(#skyGradNight)`} />;
    case 'gradient_sunset':
      return <rect key="sky-sunset" width="1920" height="1080" fill={`url(#skyGradSunset)`} />;
    case 'gradient_overcast':
      return <rect key="sky-overcast" width="1920" height="1080" fill={`url(#skyGradOvercast)`} />;
    case 'gradient_dawn':
      return <rect key="sky-dawn" width="1920" height="1080" fill={`url(#skyGradDawn)`} />;
    case 'stars_sparse':
      return <g key="stars-sparse">{renderStars(30, frame)}</g>;
    case 'stars_dense':
      return <g key="stars-dense">{renderStars(80, frame)}</g>;
    case 'clouds_wispy':
      return renderClouds(3, frame, 0.15);
    case 'clouds_heavy':
      return renderClouds(6, frame, 0.3);
    case 'moon_full':
      return (
        <g key="moon-full">
          <circle cx="1550" cy="180" r="68" fill="#f8f4dd" opacity="0.9" />
          <circle cx="1550" cy="180" r="88" fill="none" stroke="#f8f4dd" strokeWidth="2" opacity="0.12" />
        </g>
      );
    case 'moon_crescent':
      return (
        <g key="moon-crescent">
          <circle cx="1560" cy="165" r="52" fill="#f0ecc8" opacity="0.85" />
          <circle cx="1580" cy="155" r="44" fill={palette[0]} />
        </g>
      );
    case 'sun_low':
      return (
        <g key="sun-low">
          <circle cx="300" cy="320" r="90" fill="#ffcc44" opacity="0.35" />
          <circle cx="300" cy="320" r="55" fill="#ffe080" opacity="0.7" />
        </g>
      );
    case 'aurora':
      return renderAurora(frame, palette);
    default:
      return null;
  }
}

// ─── FAR LAYER GENERATORS ─────────────────────────────────────────────────────

export function renderFarToken(token: string, palette: Palette, frame: number): React.ReactNode {
  const farColor = palette[1]; // dark tone for silhouettes
  const farLight = palette[2];

  switch (token) {
    case 'mountains_jagged':
      return (
        <g key="far-mountains-jagged" opacity="0.85">
          <path d="M 0 680 C 80 670, 200 380, 380 280 C 440 250, 520 420, 650 580 C 720 650, 780 678, 840 680 Z" fill={farColor} />
          <path d="M 500 680 C 620 640, 780 320, 980 220 C 1060 180, 1160 440, 1300 600 C 1370 660, 1400 678, 1440 680 Z" fill={farLight} opacity="0.7" />
          <path d="M 1100 680 C 1240 640, 1400 360, 1580 300 C 1660 270, 1750 500, 1860 640 C 1890 668, 1920 678, 1920 680 Z" fill={farColor} opacity="0.9" />
        </g>
      );
    case 'mountains_rolling':
      return (
        <g key="far-mountains-rolling" opacity="0.8">
          <path d="M 0 650 Q 320 500, 640 580 Q 960 650, 1280 540 Q 1600 440, 1920 600 L 1920 700 L 0 700 Z" fill={farColor} />
          <path d="M 0 680 Q 400 600, 800 650 Q 1200 700, 1600 620 Q 1800 580, 1920 640 L 1920 720 L 0 720 Z" fill={farLight} opacity="0.5" />
        </g>
      );
    case 'hills_gentle':
      return (
        <g key="far-hills" opacity="0.7">
          <path d="M 0 700 Q 320 640, 640 680 Q 960 720, 1280 660 Q 1600 620, 1920 680 L 1920 750 L 0 750 Z" fill={farColor} />
        </g>
      );
    case 'cityscape_dense':
      return <g key="far-city-dense">{renderCityscape(14, palette, frame)}</g>;
    case 'cityscape_sparse':
      return <g key="far-city-sparse">{renderCityscape(7, palette, frame)}</g>;
    case 'treeline_pine':
      return <g key="far-treeline-pine">{renderTreeline('pine', palette)}</g>;
    case 'treeline_deciduous':
      return <g key="far-treeline-dec">{renderTreeline('deciduous', palette)}</g>;
    case 'desert_dunes':
      return (
        <g key="far-dunes" opacity="0.9">
          <path d="M 0 700 C 300 620, 550 720, 800 660 S 1200 600, 1500 680 S 1800 640, 1920 720 L 1920 800 L 0 800 Z" fill={palette[2]} />
          <path d="M 0 750 C 350 680, 600 770, 900 710 S 1350 660, 1650 740 S 1880 700, 1920 770 L 1920 850 L 0 850 Z" fill={palette[1]} opacity="0.8" />
        </g>
      );
    case 'ocean_horizon':
      return (
        <g key="far-ocean">
          <rect x="0" y="600" width="1920" height="480" fill={palette[2]} opacity="0.6" />
          <path d={`M 0 640 Q 480 ${625 + Math.sin(frame * 0.03) * 8}, 960 640 Q 1440 ${655 + Math.cos(frame * 0.025) * 6}, 1920 640`} fill="none" stroke={palette[3]} strokeWidth="3" opacity="0.4" />
        </g>
      );
    case 'cliff_face':
      return (
        <g key="far-cliff" opacity="0.9">
          <path d="M 0 200 L 0 900 L 280 900 C 250 700, 200 500, 240 300 C 260 200, 300 120, 350 80 L 350 0 L 0 0 Z" fill={palette[1]} />
          <path d="M 1920 250 L 1920 900 L 1620 900 C 1660 680, 1720 450, 1680 280 C 1660 180, 1630 100, 1590 50 L 1590 0 L 1920 0 Z" fill={palette[0]} />
        </g>
      );
    case 'ruins_ancient':
      return (
        <g key="far-ruins" opacity="0.7">
          <path d="M 700 680 L 700 480 L 720 460 L 740 480 L 740 680 Z" fill={farColor} />
          <path d="M 800 680 L 800 420 Q 840 400, 880 420 L 880 680 Z" fill={farColor} />
          <path d="M 940 680 L 940 520 L 960 500 L 980 520 L 980 680 Z" fill={farColor} />
          <path d="M 780 440 L 960 440 L 960 460 L 780 460 Z" fill={farColor} opacity="0.5" />
        </g>
      );
    case 'industrial_pipes':
      return (
        <g key="far-industrial" opacity="0.75">
          <path d="M 100 680 L 100 350 Q 110 340, 120 350 L 120 680 Z" fill={farColor} />
          <path d="M 160 680 L 160 280 Q 175 265, 190 280 L 190 680 Z" fill={farLight} opacity="0.6" />
          <path d="M 1700 680 L 1700 300 Q 1715 285, 1730 300 L 1730 680 Z" fill={farColor} />
          <path d="M 1780 680 L 1780 380 Q 1792 370, 1804 380 L 1804 680 Z" fill={farLight} opacity="0.6" />
          <circle cx="110" cy="340" r="18" fill={palette[4]} opacity="0.3" />
          <circle cx="1715" cy="290" r="15" fill={palette[4]} opacity="0.25" />
        </g>
      );
    case 'castle_silhouette':
      return (
        <g key="far-castle" opacity="0.8">
          <path d="M 800 680 L 800 380 L 820 360 L 820 320 L 830 310 L 840 320 L 840 360 L 860 380 L 860 350 L 880 330 L 900 350 L 900 380 L 920 360 L 920 320 L 930 310 L 940 320 L 940 360 L 960 380 L 960 680 Z" fill={palette[0]} />
          <rect x="860" y="580" width="40" height="100" rx="20" fill={palette[4]} opacity="0.15" />
        </g>
      );
    default:
      return null;
  }
}

// ─── MID LAYER GENERATORS ─────────────────────────────────────────────────────

export function renderMidToken(token: string, palette: Palette, frame: number): React.ReactNode {
  switch (token) {
    case 'forest_dense':
      return <g key="mid-forest-dense">{renderMidForest(10, palette)}</g>;
    case 'forest_sparse':
      return <g key="mid-forest-sparse">{renderMidForest(5, palette)}</g>;
    case 'field_grass':
      return (
        <g key="mid-field-grass">
          <path d="M 0 780 Q 480 760, 960 775 Q 1440 790, 1920 770 L 1920 1080 L 0 1080 Z" fill={palette[2]} opacity="0.7" />
          {renderGrassBlades(frame, palette[2])}
        </g>
      );
    case 'field_snow':
      return (
        <g key="mid-field-snow">
          <path d="M 0 770 Q 480 755, 960 768 Q 1440 780, 1920 762 L 1920 1080 L 0 1080 Z" fill="#e8eef4" opacity="0.85" />
          <path d="M 0 790 Q 640 780, 1280 788 Q 1600 792, 1920 785 L 1920 1080 L 0 1080 Z" fill="#d4dfe8" opacity="0.6" />
        </g>
      );
    case 'road_winding':
      return (
        <g key="mid-road" opacity="0.75">
          <path d="M 860 1080 Q 900 900, 940 800 Q 980 720, 960 680 Q 930 620, 880 560" fill="none" stroke={palette[1]} strokeWidth="60" strokeLinecap="round" />
          <path d="M 860 1080 Q 900 900, 940 800 Q 980 720, 960 680 Q 930 620, 880 560" fill="none" stroke={palette[3]} strokeWidth="3" strokeDasharray="30 20" opacity="0.5" />
        </g>
      );
    case 'path_dirt':
      return (
        <g key="mid-path" opacity="0.6">
          <path d="M 900 1080 Q 920 920, 950 820 Q 970 750, 960 700" fill="none" stroke="#5a4a38" strokeWidth="35" strokeLinecap="round" />
        </g>
      );
    case 'river_calm':
      return (
        <g key="mid-river">
          <path d={`M 0 820 Q 480 ${800 + Math.sin(frame * 0.02) * 5}, 960 825 Q 1440 ${840 + Math.cos(frame * 0.018) * 4}, 1920 815`} fill="none" stroke={palette[3]} strokeWidth="45" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case 'lake_still':
      return (
        <g key="mid-lake" opacity="0.5">
          <ellipse cx="960" cy="850" rx="600" ry="120" fill={palette[2]} />
          <ellipse cx="960" cy="850" rx="400" ry="60" fill={palette[3]} opacity="0.3" />
        </g>
      );
    case 'buildings_row':
      return <g key="mid-buildings">{renderMidBuildings(palette, frame)}</g>;
    case 'house_single':
      return (
        <g key="mid-house" transform="translate(750, 620)" opacity="0.9">
          <path d="M 10 160 Q 5 155, 8 145 L 10 30 Q 8 20, 20 15 L 200 15 Q 212 20, 210 30 L 212 145 Q 215 155, 210 160 Z" fill={palette[1]} />
          <path d="M -15 32 Q 110 -25, 235 32 Z" fill={palette[0]} />
          <rect x="85" y="100" width="50" height="60" rx="6" fill={palette[4]} opacity="0.4" />
          <rect x="35" y="55" width="40" height="35" rx="5" fill={palette[3]} opacity="0.5" />
          <rect x="145" y="55" width="40" height="35" rx="5" fill={palette[3]} opacity="0.5" />
        </g>
      );
    case 'cabin_wooden':
      return (
        <g key="mid-cabin" transform="translate(800, 640)" opacity="0.85">
          <path d="M 5 120 L 8 30 Q 80 -10, 160 30 L 163 120 Z" fill="#4a3828" />
          <path d="M -8 35 Q 84 -20, 176 35 Z" fill="#3a2a1a" />
          <rect x="60" y="70" width="48" height="50" rx="4" fill="#2a1a0f" />
        </g>
      );
    case 'lab_equipment':
      return (
        <g key="mid-lab" transform="translate(200, 580)" opacity="0.65">
          <path d="M 0 200 Q 500 195, 1000 200 L 1002 210 Q 500 206, -2 210 Z" fill="#0f1922" />
          <path d="M 50 175 Q 48 130, 55 110 Q 65 95, 78 110 Q 84 130, 82 175 Z" fill="none" stroke={palette[3]} strokeWidth="2.5" />
          <circle cx="66" cy="120" r="5" fill={palette[4]} opacity="0.7" />
          <path d="M 180 165 Q 177 110, 185 88 Q 200 72, 215 88 Q 222 110, 220 165 Z" fill="none" stroke={palette[2]} strokeWidth="2.5" />
          <circle cx="200" cy="100" r="6" fill={palette[4]} opacity="0.5" />
          <path d="M 350 170 Q 348 125, 354 108 Q 362 98, 372 108 Q 378 125, 376 170 Z" fill="none" stroke={palette[3]} strokeWidth="2" />
          <circle cx="364" cy="115" r="4" fill={palette[3]} opacity="0.6" />
        </g>
      );
    case 'desk_workspace':
      return (
        <g key="mid-desk" transform="translate(600, 620)" opacity="0.8">
          <path d="M 0 140 Q 350 135, 700 140 L 702 155 Q 350 150, -2 155 Z" fill={palette[1]} />
          <rect x="250" y="30" width="180" height="110" rx="8" fill={palette[0]} stroke={palette[3]} strokeWidth="3" />
          <path d="M 270 80 L 350 80 L 380 60 L 410 90 L 340 90" fill="none" stroke={palette[4]} strokeWidth="2" />
          <rect x="50" y="100" width="80" height="40" rx="4" fill={palette[1]} opacity="0.7" />
        </g>
      );
    case 'bed_room':
      return (
        <g key="mid-bed" transform="translate(900, 650)" opacity="0.8">
          <path d="M 10 90 Q 0 85, 5 75 L 5 180 Q 5 190, 15 190 L 505 190 Q 515 190, 515 180 L 515 75 Q 520 85, 510 90 Q 400 80, 260 84 Q 120 80, 10 90 Z" fill="#e8eef4" stroke={palette[2]} strokeWidth="3" />
          <path d="M 25 55 Q 28 45, 50 42 L 150 42 Q 170 45, 168 55 L 165 85 Q 90 80, 28 85 Z" fill={palette[3]} opacity="0.6" />
        </g>
      );
    case 'cave_interior':
      return (
        <g key="mid-cave" opacity="0.95">
          <path d="M 0 0 L 0 1080 L 350 1080 C 300 800, 250 550, 320 300 C 360 150, 500 50, 700 20 L 700 0 Z" fill={palette[0]} />
          <path d="M 1920 0 L 1920 1080 L 1550 1080 C 1600 800, 1660 550, 1580 300 C 1540 150, 1400 50, 1200 20 L 1200 0 Z" fill={palette[0]} />
          <path d="M 600 0 Q 800 80, 960 100 Q 1120 80, 1320 0 L 1920 0 L 0 0 Z" fill={palette[0]} />
        </g>
      );
    case 'tunnel_dark':
      return (
        <g key="mid-tunnel" opacity="0.9">
          <ellipse cx="960" cy="540" rx="450" ry="400" fill={palette[0]} />
          <ellipse cx="960" cy="540" rx="320" ry="280" fill={palette[1]} opacity="0.5" />
        </g>
      );
    case 'bridge_stone':
      return (
        <g key="mid-bridge" opacity="0.8">
          <path d="M 400 750 Q 960 680, 1520 750 L 1520 780 Q 960 710, 400 780 Z" fill={palette[1]} />
          <path d="M 500 780 L 500 900" stroke={palette[0]} strokeWidth="20" />
          <path d="M 960 750 L 960 900" stroke={palette[0]} strokeWidth="22" />
          <path d="M 1420 780 L 1420 900" stroke={palette[0]} strokeWidth="20" />
        </g>
      );
    case 'debris_scattered':
      return (
        <g key="mid-debris" opacity="0.6">
          <path d="M 300 850 Q 310 840, 325 845 Q 340 855, 330 860 Q 315 865, 300 850" fill={palette[1]} />
          <path d="M 800 870 Q 815 858, 835 865 Q 845 875, 830 880 Q 810 882, 800 870" fill={palette[1]} />
          <path d="M 1400 840 Q 1415 830, 1430 838 Q 1440 848, 1425 855 Q 1408 855, 1400 840" fill={palette[2]} opacity="0.7" />
          <path d="M 600 880 L 620 860 L 640 875 L 625 890 Z" fill={palette[0]} opacity="0.5" />
          <path d="M 1100 860 L 1115 845 L 1130 855 L 1120 870 Z" fill={palette[0]} opacity="0.4" />
        </g>
      );
    case 'tombstones':
      return (
        <g key="mid-tombstones" opacity="0.75">
          <path d="M 400 850 L 400 780 Q 415 760, 430 780 L 430 850 Z" fill={palette[1]} />
          <path d="M 600 860 L 600 800 Q 620 782, 640 800 L 640 860 Z" fill={palette[1]} transform="rotate(-3 620 830)" />
          <path d="M 850 855 L 850 790 Q 865 775, 880 790 L 880 855 Z" fill={palette[2]} opacity="0.8" />
          <path d="M 1200 850 L 1200 795 Q 1215 780, 1230 795 L 1230 850 Z" fill={palette[1]} transform="rotate(2 1215 820)" />
          <path d="M 1500 860 L 1500 810 Q 1512 798, 1524 810 L 1524 860 Z" fill={palette[0]} opacity="0.7" />
        </g>
      );
    case 'campfire':
      return (
        <g key="mid-campfire" transform="translate(920, 780)">
          <path d="M 20 60 L 0 80 L 80 80 L 60 60" fill={palette[1]} opacity="0.6" />
          <path d={`M 40 ${60 - Math.sin(frame * 0.15) * 8} Q 25 ${30 - Math.sin(frame * 0.12) * 5}, 35 ${10 - Math.sin(frame * 0.1) * 6} Q 40 0, 45 ${10 + Math.cos(frame * 0.13) * 4} Q 55 ${30 + Math.cos(frame * 0.11) * 5}, 40 ${60 - Math.sin(frame * 0.15) * 8}`} fill={palette[4]} opacity="0.8" />
          <circle cx="40" cy="70" r="25" fill={palette[4]} opacity="0.1" />
        </g>
      );
    default:
      return null;
  }
}

// ─── FOREGROUND LAYER GENERATORS ──────────────────────────────────────────────

export function renderFgToken(token: string, palette: Palette, frame: number): React.ReactNode {
  switch (token) {
    case 'frame_rocks':
      return (
        <g key="fg-rocks" opacity="0.92">
          <path d="M 0 850 C 50 800, 120 780, 200 820 C 250 840, 280 900, 320 1080 L 0 1080 Z" fill={palette[0]} />
          <path d="M 1920 820 C 1870 780, 1780 770, 1700 800 C 1650 830, 1620 890, 1600 1080 L 1920 1080 Z" fill={palette[0]} />
        </g>
      );
    case 'frame_trees':
      return (
        <g key="fg-trees" opacity="0.88">
          <path d="M 0 0 L 0 1080 L 120 1080 L 120 600 Q 110 500, 90 400 Q 70 300, 80 200 Q 100 100, 130 0 Z" fill={palette[0]} />
          <path d="M 1920 0 L 1920 1080 L 1800 1080 L 1800 650 Q 1810 540, 1830 430 Q 1850 320, 1840 220 Q 1820 110, 1790 0 Z" fill={palette[0]} />
          {/* Organic leaf blobs */}
          <path d="M 60 180 C 20 160, -10 200, 10 240 C 30 270, 70 260, 90 230 C 110 200, 90 170, 60 180" fill={palette[1]} opacity="0.7" />
          <path d="M 1860 220 C 1900 200, 1930 240, 1910 270 C 1890 300, 1850 290, 1830 260 C 1810 230, 1830 210, 1860 220" fill={palette[1]} opacity="0.7" />
        </g>
      );
    case 'frame_pillars':
      return (
        <g key="fg-pillars" opacity="0.9">
          <path d="M 80 0 L 80 1080 L 160 1080 L 160 0 Z" fill={palette[0]} />
          <path d="M 1760 0 L 1760 1080 L 1840 1080 L 1840 0 Z" fill={palette[0]} />
          <rect x="60" y="0" width="120" height="40" rx="4" fill={palette[1]} />
          <rect x="1740" y="0" width="120" height="40" rx="4" fill={palette[1]} />
        </g>
      );
    case 'frame_doorway':
      return (
        <g key="fg-doorway" opacity="0.92">
          <path d="M 0 0 L 300 0 L 300 1080 L 0 1080 Z" fill={palette[0]} />
          <path d="M 1620 0 L 1920 0 L 1920 1080 L 1620 1080 Z" fill={palette[0]} />
          <path d="M 300 0 L 300 80 Q 960 120, 1620 80 L 1620 0 Z" fill={palette[0]} />
          <path d="M 300 1080 L 300 1020 L 1620 1020 L 1620 1080 Z" fill={palette[0]} />
        </g>
      );
    case 'frame_vines':
      return (
        <g key="fg-vines" opacity="0.7">
          <path d={`M 80 0 Q 60 200, 90 400 Q 110 500, 70 ${600 + Math.sin(frame * 0.02) * 10}`} fill="none" stroke={palette[2]} strokeWidth="8" strokeLinecap="round" />
          <path d={`M 1840 0 Q 1860 250, 1830 450 Q 1810 550, 1850 ${650 + Math.cos(frame * 0.018) * 8}`} fill="none" stroke={palette[2]} strokeWidth="7" strokeLinecap="round" />
          <circle cx="75" cy="420" r="12" fill={palette[2]} opacity="0.5" />
          <circle cx="1835" cy="470" r="10" fill={palette[2]} opacity="0.4" />
        </g>
      );
    case 'frame_fog':
      return null; // Handled by CSS div overlay in component
    case 'frame_bars':
      return (
        <g key="fg-bars" opacity="0.85">
          {[200, 480, 760, 1040, 1320, 1600].map((x, i) => (
            <path key={`bar-${i}`} d={`M ${x} 0 Q ${x + 3} 540, ${x - 2} 1080`} fill="none" stroke={palette[0]} strokeWidth="18" />
          ))}
        </g>
      );
    case 'frame_cave_mouth':
      return (
        <g key="fg-cave-mouth" opacity="0.95">
          <path d="M 0 0 L 0 1080 L 400 1080 C 380 900, 350 700, 380 500 C 420 300, 550 150, 750 80 Q 960 30, 1170 80 C 1370 150, 1500 300, 1540 500 C 1570 700, 1540 900, 1520 1080 L 1920 1080 L 1920 0 Z" fill={palette[0]} />
        </g>
      );
    case 'ground_grass':
      return (
        <g key="fg-ground-grass">
          <path d="M 0 950 Q 480 935, 960 945 Q 1440 955, 1920 940 L 1920 1080 L 0 1080 Z" fill={palette[2]} opacity="0.8" />
          {renderGrassBlades(frame, palette[2])}
        </g>
      );
    case 'ground_snow':
      return (
        <g key="fg-ground-snow">
          <path d="M 0 940 Q 480 928, 960 938 Q 1440 948, 1920 932 L 1920 1080 L 0 1080 Z" fill="#e8f0f8" />
          <path d="M 0 960 Q 640 950, 1280 958 Q 1600 964, 1920 955 L 1920 1080 L 0 1080 Z" fill="#d0dce6" opacity="0.5" />
        </g>
      );
    case 'ground_sand':
      return (
        <g key="fg-ground-sand">
          <path d="M 0 935 Q 480 920, 960 932 Q 1440 944, 1920 928 L 1920 1080 L 0 1080 Z" fill="#c4a050" opacity="0.8" />
        </g>
      );
    case 'ground_concrete':
      return (
        <g key="fg-ground-concrete">
          <path d="M 0 940 L 1920 940 L 1920 1080 L 0 1080 Z" fill={palette[1]} opacity="0.9" />
          <path d="M 400 940 L 400 1080" stroke={palette[0]} strokeWidth="2" opacity="0.3" />
          <path d="M 1100 940 L 1100 1080" stroke={palette[0]} strokeWidth="2" opacity="0.3" />
        </g>
      );
    case 'particles_dust':
    case 'particles_snow':
    case 'particles_rain':
    case 'particles_embers':
      return null; // Particles rendered separately by ParticleLayer
    default:
      return null;
  }
}

// ─── SVG GRADIENT DEFS ────────────────────────────────────────────────────────

export function renderSkyGradientDefs(palette: Palette): React.ReactNode {
  return (
    <>
      <linearGradient id="skyGradNight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette[0]} />
        <stop offset="40%" stopColor={palette[1]} />
        <stop offset="100%" stopColor={palette[2]} />
      </linearGradient>
      <linearGradient id="skyGradSunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a0a2e" />
        <stop offset="35%" stopColor="#4a1a3a" />
        <stop offset="65%" stopColor="#c04020" />
        <stop offset="100%" stopColor={palette[3]} />
      </linearGradient>
      <linearGradient id="skyGradOvercast" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a2a3a" />
        <stop offset="50%" stopColor="#4a4a5a" />
        <stop offset="100%" stopColor={palette[2]} />
      </linearGradient>
      <linearGradient id="skyGradDawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a0a2a" />
        <stop offset="30%" stopColor="#2a1a4a" />
        <stop offset="60%" stopColor="#6a3a50" />
        <stop offset="100%" stopColor="#e8a060" />
      </linearGradient>
    </>
  );
}

// ─── HELPER RENDERERS ─────────────────────────────────────────────────────────

function renderStars(count: number, frame: number): React.ReactNode[] {
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = (seed * 7.3) % 1920;
    const y = (seed * 4.1) % 600;
    const r = 0.8 + (seed % 3) * 0.5;
    const twinkle = 0.4 + Math.sin((frame + seed) * 0.04) * 0.3;
    stars.push(<circle key={`star-${i}`} cx={x} cy={y} r={r} fill="#ffffff" opacity={twinkle} />);
  }
  return stars;
}

function renderClouds(count: number, frame: number, opacity: number): React.ReactNode {
  const clouds: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 200;
    const baseX = ((seed * 3.7 + frame * 0.3) % 2400) - 300;
    const y = 80 + (seed % 250);
    const w = 200 + (seed % 150);
    clouds.push(
      <ellipse key={`cloud-${i}`} cx={baseX} cy={y} rx={w * 0.5} ry={30 + (seed % 20)} fill="#ffffff" opacity={opacity * (0.5 + (seed % 5) * 0.1)} />
    );
  }
  return <g key="clouds">{clouds}</g>;
}

function renderAurora(frame: number, palette: Palette): React.ReactNode {
  const shift = Math.sin(frame * 0.015) * 50;
  return (
    <g key="aurora" opacity="0.3">
      <path d={`M 200 50 Q ${600 + shift} 120, 1000 ${80 + Math.sin(frame * 0.02) * 20} Q ${1400 - shift} 150, 1800 60`} fill="none" stroke={palette[4]} strokeWidth="40" opacity="0.4" strokeLinecap="round" />
      <path d={`M 300 80 Q ${700 + shift * 0.7} 160, 1100 ${110 + Math.cos(frame * 0.018) * 15} Q ${1500 - shift * 0.8} 180, 1700 90`} fill="none" stroke={palette[3]} strokeWidth="25" opacity="0.3" strokeLinecap="round" />
    </g>
  );
}

function renderCityscape(count: number, palette: Palette, frame: number): React.ReactNode {
  const buildings: React.ReactNode[] = [];
  const spacing = 1920 / count;
  for (let i = 0; i < count; i++) {
    const x = i * spacing + 20;
    const w = 60 + (i * 37) % 80;
    const h = 150 + (i * 53) % 250;
    const y = 700 - h;
    const lean = ((i * 7) % 5) - 2;
    buildings.push(
      <g key={`city-bld-${i}`}>
        <path d={`M ${x + 4} 700 L ${x + lean} ${y + 10} Q ${x + w * 0.5} ${y - 4}, ${x + w - lean} ${y + 10} L ${x + w - 4} 700 Z`} fill={i % 2 === 0 ? palette[0] : palette[1]} />
        {/* Window glow */}
        <rect x={x + 12} y={y + 25} width="10" height="12" rx="2" fill={palette[4]} opacity={0.3 + Math.sin(frame * 0.02 + i) * 0.15} />
        <rect x={x + w - 22} y={y + 50} width="10" height="12" rx="2" fill={palette[3]} opacity={0.25 + Math.cos(frame * 0.025 + i * 2) * 0.1} />
      </g>
    );
  }
  return <>{buildings}</>;
}

function renderTreeline(type: 'pine' | 'deciduous', palette: Palette): React.ReactNode {
  const trees: React.ReactNode[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const x = i * 165 + 30;
    const h = 100 + (i * 31) % 80;
    const lean = ((i * 5) % 7) - 3;
    if (type === 'pine') {
      trees.push(
        <g key={`pine-${i}`} transform={`translate(${x}, ${700 - h}) rotate(${lean} 30 ${h})`}>
          <path d={`M 30 ${h} L 28 ${h * 0.4} L 0 ${h * 0.5} L 30 0 L 60 ${h * 0.5} L 32 ${h * 0.4} L 30 ${h}`} fill={palette[1]} opacity="0.8" />
        </g>
      );
    } else {
      trees.push(
        <g key={`tree-${i}`} transform={`translate(${x}, ${680 - h})`}>
          <path d={`M 28 ${h} L 28 ${h * 0.5} L 32 ${h * 0.5} L 32 ${h}`} fill="#3d2a1a" opacity="0.7" />
          <ellipse cx="30" cy={h * 0.35} rx={25 + (i % 3) * 8} ry={20 + (i % 4) * 6} fill={palette[1]} opacity="0.75" />
        </g>
      );
    }
  }
  return <>{trees}</>;
}

function renderMidForest(count: number, palette: Palette): React.ReactNode {
  const trees: React.ReactNode[] = [];
  const spacing = 1920 / (count + 1);
  for (let i = 0; i < count; i++) {
    const x = (i + 1) * spacing + ((i * 23) % 40) - 20;
    const h = 200 + (i * 41) % 120;
    const y = 800 - h;
    trees.push(
      <g key={`mid-tree-${i}`} opacity="0.8">
        <path d={`M ${x - 4} ${800} L ${x - 3} ${y + h * 0.6} L ${x + 3} ${y + h * 0.6} L ${x + 4} ${800}`} fill="#2a1f14" />
        <path d={`M ${x} ${y + h * 0.55} C ${x - 40} ${y + h * 0.4}, ${x - 50} ${y + h * 0.2}, ${x - 20} ${y} C ${x} ${y - 15}, ${x + 20} ${y}, ${x + 20} ${y} C ${x + 50} ${y + h * 0.2}, ${x + 40} ${y + h * 0.4}, ${x} ${y + h * 0.55}`} fill={palette[1]} />
      </g>
    );
  }
  return <>{trees}</>;
}

function renderMidBuildings(palette: Palette, frame: number): React.ReactNode {
  const buildings: React.ReactNode[] = [];
  const slots = [
    { x: 200, w: 160, h: 250 },
    { x: 420, w: 200, h: 320 },
    { x: 680, w: 180, h: 280 },
    { x: 920, w: 220, h: 380 },
    { x: 1200, w: 160, h: 260 },
    { x: 1420, w: 200, h: 340 },
  ];
  for (let i = 0; i < slots.length; i++) {
    const { x, w, h } = slots[i];
    const y = 850 - h;
    buildings.push(
      <g key={`mid-bld-${i}`} opacity="0.85">
        <path d={`M ${x} 850 L ${x + 2} ${y + 8} Q ${x + w * 0.5} ${y - 2}, ${x + w - 2} ${y + 8} L ${x + w} 850 Z`} fill={i % 2 === 0 ? palette[1] : palette[0]} />
        {Array.from({ length: 3 }).map((_, row) => (
          <rect key={`w-${i}-${row}`} x={x + 20} y={y + 30 + row * 45} width="16" height="20" rx="3" fill={palette[4]} opacity={0.3 + Math.sin(frame * 0.018 + i + row) * 0.15} />
        ))}
      </g>
    );
  }
  return <>{buildings}</>;
}

function renderGrassBlades(frame: number, color: string): React.ReactNode {
  const blades: React.ReactNode[] = [];
  for (let i = 0; i < 20; i++) {
    const x = i * 100 + 30;
    const sway = Math.sin((frame + i * 15) * 0.03) * 4;
    blades.push(
      <path key={`grass-${i}`} d={`M ${x} 1000 Q ${x + sway} 975, ${x + sway * 1.5} 960`} fill="none" stroke={color} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    );
  }
  return <g>{blades}</g>;
}
