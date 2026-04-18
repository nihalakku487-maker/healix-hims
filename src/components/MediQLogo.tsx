import React from 'react';

interface MediQLogoProps {
  /** Height in pixels. Width scales proportionally. Default: 32 */
  size?: number;
  /** Override color. */
  color?: string;
  /** Dark variant — brighter teal for use on dark backgrounds */
  dark?: boolean;
}

/**
 * MEDIq Logo — "MEDIQ" bold teal wordmark.
 */
const MediQLogo: React.FC<MediQLogoProps> = ({
  size = 32,
  color,
  dark = false
}) => {
  const teal = color ?? (dark ? '#2DD4BF' : '#0D9488');

  return (
    <svg
      height={size * 0.55}
      viewBox="0 0 230 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <text
        x="0"
        y="44"
        fontFamily="'Plus Jakarta Sans', 'Montserrat', 'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="48"
        fill={teal}
      >
        MEDIQ
      </text>
    </svg>
  );
};

/**
 * MediQ icon mark — a bold capital "M" in a rounded square,
 * used wherever a compact logo icon is needed.
 */
export const MediQMark: React.FC<{ size?: number; dark?: boolean }> = ({ size = 36, dark = false }) => {
  const bg = dark ? 'rgba(255,255,255,0.12)' : '#E6FAF7';
  const teal = dark ? '#2DD4BF' : '#0D9488';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 30 30" fill="none">
        <text
          x="0"
          y="24"
          fontFamily="'Plus Jakarta Sans', 'Montserrat', 'Arial Black', Arial, sans-serif"
          fontWeight="900"
          fontSize="28"
          fill={teal}
        >
          M
        </text>
      </svg>
    </div>
  );
};

export default MediQLogo;
