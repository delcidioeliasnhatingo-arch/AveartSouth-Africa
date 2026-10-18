import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-8 h-8',
  size,
  color = 'currentColor',
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="AVEART Emblem"
    >
      {/* 
        Geometric Flight Emblem (Emblema Geométrico de Voo)
        Faithfully traced from official brand emblem:
        - Geometric Beak, Head & Throat
        - High Soaring Top Wing
        - Angular Mid Wing
        - Tapered Aerodynamic Body & Tail
      */}
      {/* Head, Beak & Throat */}
      <polygon
        points="102,512 228,462 476,558 412,692"
        fill={color}
      />

      {/* Body & Swept-back Tail */}
      <polygon
        points="412,692 476,558 580,694 780,872"
        fill={color}
      />

      {/* Soaring Upper Wing */}
      <polygon
        points="424,472 912,136 782,362 540,554"
        fill={color}
      />

      {/* Mid Angular Wing */}
      <polygon
        points="540,554 800,434 596,672"
        fill={color}
      />
    </svg>
  );
};
