interface TurnFlowLogoProps {
  size?: number
  className?: string
}

export function TurnFlowLogo({ size = 32, className }: TurnFlowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tfGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#tfGrad)" />
      <rect x="9" y="10" width="22" height="4" rx="2" fill="white" />
      <rect x="17.5" y="10" width="5" height="14" rx="2.5" fill="white" />
      <path
        d="M9 32 Q14 27 20 30 Q26 33 31 28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M29 25.5 L31.5 28 L28.5 29.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  )
}

export function TurnFlowLogoMono({ size = 32, className }: TurnFlowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="9" y="10" width="22" height="4" rx="2" fill="currentColor" />
      <rect x="17.5" y="10" width="5" height="14" rx="2.5" fill="currentColor" />
      <path
        d="M9 32 Q14 27 20 30 Q26 33 31 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <path
        d="M29 25.5 L31.5 28 L28.5 29.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
    </svg>
  )
}
