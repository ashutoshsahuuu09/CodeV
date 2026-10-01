import React from 'react';

type LogoMarkProps = {
  className?: string;
  size?: number;
};

export const LogoMark: React.FC<LogoMarkProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      viewBox="0 0 240 170"
      width={size}
      height={size * (170 / 240)}
      className={`${className} block max-w-full h-auto shrink-0`}
      style={{ maxHeight: '100%' }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="CodeV logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="codev-logo-gradient" x1="56" y1="0" x2="228" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="36%" stopColor="#D8DEE6" />
          <stop offset="72%" stopColor="#BFC7CF" />
          <stop offset="100%" stopColor="#8F9AA5" />
        </linearGradient>
      </defs>

      <path d="M0 0H53L154 170H101L0 0Z" fill="#0A0D10" />
      <path d="M92 0H141L240 170H190L92 0Z" fill="url(#codev-logo-gradient)" />
      <path d="M128 0H180L82 170H30L128 0Z" fill="#E5EAF0" opacity="0.8" />
    </svg>
  );
};
