import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** AVEART's selected option 3: a refined, flowing ribbon/wing mark. */
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
      role="img"
      aria-label="AVEART emblem"
    >
      <path
        d="M110 585C220 526 331 467 447 398L875 126L734 344L495 508L665 474L526 628L391 650L724 876L476 758L310 660L110 585Z"
        fill={color}
      />
      <path
        d="M312 660L494 508L526 628L391 650L312 660Z"
        fill={color}
      />
      <path
        d="M447 398L575 480L495 508L447 398Z"
        fill={color}
      />
    </svg>
  );
};
