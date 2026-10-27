import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** Uses the exact original SVG emblem uploaded to public/. */
export const Logo: React.FC<LogoProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/Emblema-Abstrato-de-Voo.svg"
      alt="AVEART emblem"
      className={className}
      style={{ ...style, objectFit: 'contain' }}
      draggable={false}
    />
  );
};
