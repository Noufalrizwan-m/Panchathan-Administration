import React from 'react';

// Path variables for generated high-resolution assets
export const PANCHATHAN_TRUCK_URL = '/src/assets/images/panchathan_truck_1781349627242.jpg';
export const PANCHATHAN_LOGO_URL = '/src/assets/images/panchathan_logo_1781349642765.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Highly responsive, pixel-perfect SVG vector design of the Panchathan brand logo
 * matches the second uploaded user image with the brand green, slanted geometry, and white speed stripes.
 */
export const PanchathanLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 md:h-10',
    md: 'h-12 md:h-14',
    lg: 'h-16 md:h-20',
    xl: 'h-24 md:h-28',
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Exact slanted green logo badge reproduction */}
      <svg
        className={`${sizeClasses[size]} w-auto drop-shadow-sm`}
        viewBox="0 0 600 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Slanted Green Panel */}
        <path
          d="M 5 15 L 565 15 L 595 145 L 35 145 Z"
          fill="#10542C"
          stroke="#126B33"
          strokeWidth="3"
        />

        {/* Dynamic White Brand Text (Capitalized Sans Serif) */}
        <text
          x="45"
          y="56"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="900"
          fontSize="38"
          fill="#FFFFFF"
          fontStyle="italic"
          letterSpacing="1"
        >
          PANCHATHAN
        </text>

        <text
          x="45"
          y="102"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="900"
          fontSize="44"
          fill="#FFFFFF"
          fontStyle="italic"
          letterSpacing="1.5"
        >
          LOGISTICS
        </text>

        <text
          x="45"
          y="132"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="15"
          fill="#FFFFFF"
          letterSpacing="2.5"
        >
          PRIVATE LIMITED
        </text>

        {/* White Underline for corporate subtitle */}
        <line x1="45" y1="117" x2="265" y2="117" stroke="#FFFFFF" strokeWidth="3" />

        {/* Right Slanted Speed Stripes / Vents */}
        <g stroke="#FFFFFF" strokeWidth="8" strokeLinecap="square">
          <line x1="310" y1="35" x2="430" y2="35" />
          <line x1="450" y1="35" x2="550" y2="35" />
          
          <line x1="300" y1="62" x2="420" y2="62" />
          <line x1="440" y1="62" x2="530" y2="62" />
          
          <line x1="280" y1="89" x2="380" y2="89" />
          <line x1="400" y1="89" x2="510" y2="89" />
          
          <line x1="260" y1="116" x2="350" y2="116" />
          <line x1="370" y1="116" x2="490" y2="116" />
        </g>
      </svg>
    </div>
  );
};

export const PanchathanTruckIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 shadow-md ${className}`}>
      <img
        src={PANCHATHAN_TRUCK_URL}
        alt="Panchathan Commercial Heavy Truck TN 85 T 6711"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback illustration in case the generated image fails or is being built
          e.currentTarget.src = 'https://picsum.photos/seed/truck/800/600';
        }}
      />
      <div className="absolute top-2 left-2 bg-[#10542C]/90 text-white text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-[#126B33]">
        Operational Heavy Goods Vehicle TN 85 T 6711
      </div>
    </div>
  );
};
