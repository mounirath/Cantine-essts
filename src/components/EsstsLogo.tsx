import React from 'react';

interface EsstsLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
}

export const EsstsLogo: React.FC<EsstsLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    xs: 'w-6 h-10',
    sm: 'w-8 h-12',
    md: 'w-10 h-16',
    lg: 'w-14 h-22',
    xl: 'w-20 h-32',
    '2xl': 'w-28 h-44',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 320 580"
          className="w-full h-full drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="#0022C8">
            {/* Colonne 1 (Gauche) */}
            <path d="M 44,10 L 60,14 L 60,165 C 60,182 51,185 51,200 C 51,215 60,218 60,235 L 60,375 L 44,375 L 44,235 C 44,220 34,216 34,200 C 34,184 44,180 44,165 Z" />
            <path d="M 76,18 L 92,22 L 92,165 C 92,180 102,184 102,200 C 102,216 92,220 92,235 L 92,375 L 76,375 L 76,235 C 76,218 85,215 85,200 C 85,185 76,182 76,165 Z" />

            {/* Colonne 2 (Centre) */}
            <path d="M 136,33 L 152,37 L 152,95 C 152,112 143,115 143,130 C 143,145 152,148 152,165 L 152,375 L 136,375 L 136,165 C 136,150 126,146 126,130 C 126,114 136,110 136,95 Z" />
            <path d="M 168,41 L 184,45 L 184,95 C 184,110 194,114 194,130 C 194,146 184,150 184,165 L 184,375 L 168,375 L 168,165 C 168,148 177,145 177,130 C 177,115 168,112 168,95 Z" />

            {/* Colonne 3 (Droite) */}
            <path d="M 228,56 L 244,60 L 244,180 C 244,197 235,200 235,215 C 235,230 244,233 244,250 L 244,375 L 228,375 L 228,250 C 228,235 218,231 218,215 C 218,199 228,195 228,180 Z" />
            <path d="M 260,64 L 276,68 L 276,180 C 276,195 286,199 286,215 C 286,231 276,235 276,250 L 276,375 L 260,375 L 260,250 C 260,233 269,230 269,215 C 269,200 260,197 260,180 Z" />
          </g>

          {/* Calligraphie arabe */}
          <g
            style={{
              fontFamily: "'Cairo', 'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif",
              fontWeight: 800,
              fill: '#0022C8',
              textAnchor: 'middle',
            }}
          >
            <text x="160" y="425" fontSize="25" letterSpacing="0.5">
              المدرسة العليا لعلوم
            </text>
            <text x="160" y="465" fontSize="25" letterSpacing="0.5">
              الرياضة وتكنولوجياتها
            </text>
          </g>

          {/* Sigle ESSTS */}
          <text
            x="166"
            y="540"
            fontSize="44"
            style={{
              fontFamily: "'Montserrat', 'Arial Black', Impact, sans-serif",
              fontWeight: 900,
              fill: '#0022C8',
              letterSpacing: '14px',
              textAnchor: 'middle',
            }}
          >
            ESSTS
          </text>
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <span className="font-extrabold text-blue-900 tracking-tight text-base sm:text-lg block truncate">
            ESSTS
          </span>
          <span className="text-xs text-blue-700/80 font-medium block truncate">
            المدرسة العليا لعلوم الرياضة وتكنولوجياتها
          </span>
        </div>
      )}
    </div>
  );
};
