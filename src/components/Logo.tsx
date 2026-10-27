import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** Uses the AVEART logo SVG from the public directory. */
export const Logo: React.FC<LogoProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/aveart-logo-transparent.svg"
      alt="AVEART"
      className={className}
      style={{ ...style, objectFit: 'contain' }}
      draggable={false}
    />
  );
};
