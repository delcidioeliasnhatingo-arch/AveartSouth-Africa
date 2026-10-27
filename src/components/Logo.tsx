import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** AVEART logo: pure black artwork on a genuinely transparent background. */
export const Logo: React.FC<LogoProps> = ({ className = '', size }) => {
  return (
    <img
      src="/aveart-logo-transparent.svg?v=3"
      alt="AVEART"
      className={className}
      style={{
        width: size ?? '320px',
        height: 'auto',
        maxWidth: 'none',
        objectFit: 'contain',
        background: 'transparent',
        display: 'block',
        flexShrink: 0,
        filter: 'brightness(0) saturate(100%)',
      }}
      draggable={false}
    />
  );
};
