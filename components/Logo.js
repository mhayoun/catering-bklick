export function Logo({ className = 'h-10 w-10', title = 'Catering in a Click' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      {/* hat puff - three overlapping blobs for a hand-drawn toque silhouette */}
      <circle cx="42" cy="38" r="20" fill="#FFF8EC" stroke="#3E2145" strokeWidth="4" />
      <circle cx="66" cy="30" r="22" fill="#FFF8EC" stroke="#3E2145" strokeWidth="4" />
      <circle cx="82" cy="46" r="16" fill="#FFF8EC" stroke="#3E2145" strokeWidth="4" />

      {/* hat band */}
      <rect x="34" y="52" width="58" height="26" rx="10" fill="#FFF8EC" stroke="#3E2145" strokeWidth="4" />

      {/* wink face on the band */}
      <circle cx="50" cy="65" r="2.6" fill="#3E2145" />
      <path d="M65 63 q4 -4 8 0" fill="none" stroke="#3E2145" strokeWidth="3" strokeLinecap="round" />
      <path d="M47 71 q6 4 12 0" fill="none" stroke="#3E2145" strokeWidth="3" strokeLinecap="round" />

      {/* click sparks */}
      <g stroke="#E4A93A" strokeWidth="4" strokeLinecap="round">
        <line x1="88" y1="70" x2="94" y2="64" />
        <line x1="96" y1="80" x2="104" y2="80" />
        <line x1="88" y1="92" x2="94" y2="98" />
      </g>

      {/* mouse cursor "clicking" the hat, tilted like it just landed */}
      <g transform="translate(70,58) rotate(18)">
        <path
          d="M0 0 L0 34 L8 26 L14 40 L20 37 L14 23 L24 23 Z"
          fill="#C1440E"
          stroke="#3E2145"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
