import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** Displays the AVEART emblem with a transparent background and a readable horizontal size. */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size,
}) => {
  return (
    <img
      src="/aveart-logo-transparent.svg?v=2"
      alt="AVEART"
      className={className}
      style={{
        width: size ?? '160px',
        height: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        backgroundColor: 'transparent',
        display: 'block',
        flexShrink: 0,
      }}
      draggable={false}
    />
  );
};
