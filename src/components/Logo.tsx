import React from 'react';
import aveartEmblem from '../assets/images/Emblema Abstrato de Voo.png';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** Uses the exact AVEART emblem image uploaded to the repository. */
export const Logo: React.FC<LogoProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={aveartEmblem}
      alt="AVEART emblem"
      className={className}
      style={{ ...style, objectFit: 'contain' }}
      draggable={false}
    />
  );
};
