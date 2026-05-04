interface ChromaLogoProps {
  compact?: boolean;
  className?: string;
}

export function ChromaLogo({ compact = false, className = '' }: ChromaLogoProps) {
  if (compact) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="36 31 128 148"
        className={className}
        aria-label="Chroma logo mark"
      >
        <defs>
          <linearGradient id="clg-c" x1="40" y1="35" x2="162" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <filter id="cng-c" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cbl-c" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
          </filter>
        </defs>
        <circle cx="100" cy="105" r="65" fill="#22D3EE" filter="url(#cbl-c)" opacity="0.15" />
        <g stroke="url(#clg-c)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.12">
          <line x1="100" y1="43" x2="153.7" y2="136" />
          <line x1="100" y1="43" x2="46.3" y2="136" />
          <line x1="153.7" y1="74" x2="46.3" y2="136" />
          <line x1="153.7" y1="74" x2="100" y2="167" />
          <line x1="46.3" y1="74" x2="153.7" y2="136" />
          <line x1="46.3" y1="74" x2="100" y2="167" />
        </g>
        <g stroke="url(#clg-c)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.38">
          <line x1="100" y1="43" x2="153.7" y2="74" />
          <line x1="153.7" y1="74" x2="153.7" y2="136" />
          <line x1="153.7" y1="136" x2="100" y2="167" />
          <line x1="100" y1="167" x2="46.3" y2="136" />
          <line x1="46.3" y1="136" x2="46.3" y2="74" />
          <line x1="46.3" y1="74" x2="100" y2="43" />
        </g>
        <g stroke="url(#clg-c)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7">
          <line x1="100" y1="105" x2="100" y2="43" />
          <line x1="100" y1="105" x2="153.7" y2="74" />
          <line x1="100" y1="105" x2="153.7" y2="136" />
          <line x1="100" y1="105" x2="100" y2="167" />
          <line x1="100" y1="105" x2="46.3" y2="136" />
          <line x1="100" y1="105" x2="46.3" y2="74" />
        </g>
        <g filter="url(#cbl-c)" opacity="0.5">
          <circle cx="100" cy="43" r="8" fill="#22D3EE" />
          <circle cx="153.7" cy="74" r="8" fill="#22D3EE" />
          <circle cx="153.7" cy="136" r="8" fill="#0EA5E9" />
          <circle cx="100" cy="167" r="8" fill="#0EA5E9" />
          <circle cx="46.3" cy="136" r="8" fill="#0EA5E9" />
          <circle cx="46.3" cy="74" r="8" fill="#22D3EE" />
          <circle cx="100" cy="105" r="10" fill="#06B6D4" />
        </g>
        <g filter="url(#cng-c)">
          <circle cx="100" cy="43" r="4" fill="url(#clg-c)" />
          <circle cx="153.7" cy="74" r="4" fill="url(#clg-c)" />
          <circle cx="153.7" cy="136" r="4" fill="url(#clg-c)" />
          <circle cx="100" cy="167" r="4" fill="url(#clg-c)" />
          <circle cx="46.3" cy="136" r="4" fill="url(#clg-c)" />
          <circle cx="46.3" cy="74" r="4" fill="url(#clg-c)" />
          <circle cx="100" cy="105" r="5.5" fill="url(#clg-c)" />
          <circle cx="100" cy="105" r="2" fill="#fff" opacity="0.9" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 580 210"
      className={className}
      aria-label="Chroma DB Viewer"
    >
      <defs>
        <linearGradient id="clg-f" x1="40" y1="35" x2="162" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <filter id="cng-f" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cbl-f" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
        </filter>
      </defs>

      <rect width="210" height="210" fill="url(#clg-f)" opacity="0.03" />
      <circle cx="100" cy="105" r="65" fill="#22D3EE" filter="url(#cbl-f)" opacity="0.1" />

      <g stroke="url(#clg-f)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.10">
        <line x1="100" y1="43" x2="153.7" y2="136" />
        <line x1="100" y1="43" x2="46.3" y2="136" />
        <line x1="153.7" y1="74" x2="46.3" y2="136" />
        <line x1="153.7" y1="74" x2="100" y2="167" />
        <line x1="46.3" y1="74" x2="153.7" y2="136" />
        <line x1="46.3" y1="74" x2="100" y2="167" />
      </g>

      <g stroke="url(#clg-f)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.36">
        <line x1="100" y1="43" x2="153.7" y2="74" />
        <line x1="153.7" y1="74" x2="153.7" y2="136" />
        <line x1="153.7" y1="136" x2="100" y2="167" />
        <line x1="100" y1="167" x2="46.3" y2="136" />
        <line x1="46.3" y1="136" x2="46.3" y2="74" />
        <line x1="46.3" y1="74" x2="100" y2="43" />
      </g>

      <g stroke="url(#clg-f)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.64">
        <line x1="100" y1="105" x2="100" y2="43" />
        <line x1="100" y1="105" x2="153.7" y2="74" />
        <line x1="100" y1="105" x2="153.7" y2="136" />
        <line x1="100" y1="105" x2="100" y2="167" />
        <line x1="100" y1="105" x2="46.3" y2="136" />
        <line x1="100" y1="105" x2="46.3" y2="74" />
      </g>

      <g filter="url(#cbl-f)" opacity="0.5">
        <circle cx="100" cy="43" r="8" fill="#22D3EE" />
        <circle cx="153.7" cy="74" r="8" fill="#22D3EE" />
        <circle cx="153.7" cy="136" r="8" fill="#0EA5E9" />
        <circle cx="100" cy="167" r="8" fill="#0EA5E9" />
        <circle cx="46.3" cy="136" r="8" fill="#0EA5E9" />
        <circle cx="46.3" cy="74" r="8" fill="#22D3EE" />
        <circle cx="100" cy="105" r="10" fill="#06B6D4" />
      </g>

      <g filter="url(#cng-f)">
        <circle cx="100" cy="43" r="4" fill="url(#clg-f)" />
        <circle cx="153.7" cy="74" r="4" fill="url(#clg-f)" />
        <circle cx="153.7" cy="136" r="4" fill="url(#clg-f)" />
        <circle cx="100" cy="167" r="4" fill="url(#clg-f)" />
        <circle cx="46.3" cy="136" r="4" fill="url(#clg-f)" />
        <circle cx="46.3" cy="74" r="4" fill="url(#clg-f)" />
        <circle cx="100" cy="105" r="5.5" fill="url(#clg-f)" />
        <circle cx="100" cy="105" r="2" fill="#fff" opacity="0.88" />
      </g>

      <line x1="192" y1="42" x2="192" y2="168" stroke="url(#clg-f)" strokeWidth="0.75" opacity="0.2" />

      <text x="210" y="98" fontFamily="'Orbitron', 'Arial Black', sans-serif" fontWeight="900" fontSize="46" letterSpacing="6" fill="currentColor">CHROMA</text>
      <line x1="210" y1="115" x2="370" y2="115" stroke="#22D3EE" strokeWidth="0.75" opacity="0.38" />
      <text x="210" y="140" fontFamily="'Rajdhani', 'Arial', sans-serif" fontWeight="300" fontSize="15" letterSpacing="6" fill="#0EA5E9">DB VIEWER</text>
    </svg>
  );
}
