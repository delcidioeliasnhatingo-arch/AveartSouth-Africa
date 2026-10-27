import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** AVEART emblem with transparent background and trimmed whitespace. */
export const Logo: React.FC<LogoProps> = ({ className = '', size }) => {
  return (
    <img
      src="/aveart-logo-transparent.svg?v=4"
      alt="AVEART"
      className={className}
      style={{
        width: size ?? 'clamp(88px, 9vw, 130px)',
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
