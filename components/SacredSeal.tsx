import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface SacredSealProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
  color?: string; 
  mode?: 'simple' | 'complex' | 'reactor' | 'proton';
}

export const SacredSeal: React.FC<SacredSealProps> = ({ size = 300, className = "", isAnimated = true, color, mode = 'complex' }) => {
  const c = 200;
  const uniqueId = useId().replace(/:/g, ''); 
  
  const mainColor = color || "#D4AF37";
  const isProton = mode === 'proton';

  return (
    <div className={`relative flex items-center justify-center ${className} ${isAnimated ? 'sacred-heartbeat' : ''}`} style={{ width: size, height: size }}>
      <motion.svg 
        viewBox="0 0 400 400" 
        className="w-full h-full"
        style={{ 
            filter: `drop-shadow(0 0 ${isProton || mode === 'reactor' ? '50px' : '30px'} ${color || 'rgba(212,175,55,0.3)'})`,
        } as any}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <defs>
          {!color && (
            <linearGradient id={`goldGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          )}
          <linearGradient id={`prismGradient-${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={isProton ? "#22D3EE" : "#60A5FA"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isProton ? "#06B6D4" : "#2563EB"} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`flameGradient-${uniqueId}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor={isProton ? "#FFF" : "#F87171"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isProton ? "#22D3EE" : "#DC2626"} stopOpacity="0.4" />
          </linearGradient>
          <filter id={`glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation={isProton ? "8" : "4"} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <path id={`textPathTop-${uniqueId}`} d="M 60,200 A 140,140 0 0,1 340,200" />
          <path id={`textPathBottom-${uniqueId}`} d="M 340,200 A 140,140 0 0,1 60,200" />
        </defs>

        <motion.circle 
          cx={c} cy={c} r="195" 
          fill="none" 
          stroke={isProton ? "#22D3EE" : mainColor}
          strokeWidth="1" 
          opacity="0.3"
          strokeDasharray="4 4"
        />

        <motion.circle 
          cx={c} cy={c} r="190" 
          fill="none" 
          stroke={color || (isProton ? "#22D3EE" : `url(#goldGradient-${uniqueId})`)} 
          strokeWidth={isProton || mode === 'reactor' ? 6 : 4}
          initial={isAnimated ? { pathLength: 0, rotate: -90 } : { pathLength: 1 }}
          animate={isAnimated ? { pathLength: 1, rotate: 0 } : {}}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {mode !== 'simple' && (
            <motion.g
                animate={isAnimated ? { rotate: isProton ? -720 : -360 } : {}}
                transition={{ duration: isProton ? 30 : 120, repeat: window.Infinity, ease: "linear" }}
                style={{ transformOrigin: "200px 200px", opacity: 0.4 }}
            >
                <circle cx={c} cy={c} r="170" fill="none" stroke={isProton ? "#FFF" : mainColor} strokeWidth="1" strokeDasharray="10 10" />
                <circle cx={c} cy={c} r="165" fill="none" stroke={isProton ? "#22D3EE" : mainColor} strokeWidth="0.5" />
                {[0, 90, 180, 270].map(deg => (
                    <rect key={deg} x={c-2} y={35} width="4" height="10" fill={isProton ? "#FFF" : mainColor} transform={`rotate(${deg} ${c} ${c})`} />
                ))}
            </motion.g>
        )}

        {!isProton && (
          <motion.g 
              animate={isAnimated ? { rotate: 360 } : {}}
              transition={{ duration: 60, repeat: window.Infinity, ease: "linear" }}
              style={{ transformOrigin: "200px 200px" }}
          >
              <text className="font-serif text-[24px] font-bold tracking-[0.2em] uppercase" fill={mainColor} textAnchor="middle">
                  <textPath href={`#textPathTop-${uniqueId}`} startOffset="50%">
                      Amor Est Architectura
                  </textPath>
              </text>
              <text className="font-serif text-[20px] font-bold tracking-[0.2em] uppercase" fill={color ? `${color}99` : "rgba(212,175,55,0.6)"} textAnchor="middle">
                  <textPath href={`#textPathBottom-${uniqueId}`} startOffset="50%">
                      Veritas Formae • 2026
                  </textPath>
              </text>
          </motion.g>
        )}

        {isProton && (
          <motion.g 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: window.Infinity, ease: "linear" }}
            style={{ transformOrigin: "200px 200px" }}
          >
            {[0, 60, 120, 180, 240, 300].map(deg => (
              <motion.rect
                key={deg}
                x="198" y="50" width="4" height="100"
                fill="#22D3EE"
                transform={`rotate(${deg} 200 200)`}
                animate={{ height: 150, opacity: 0.8 }}
                transition={{ duration: 0.5, repeat: window.Infinity, delay: deg / 360, repeatType: "mirror" }}
              />
            ))}
          </motion.g>
        )}

        <g transform="translate(200, 200)">
            {(isProton || mode === 'reactor') && (
                <motion.circle 
                    r="80" 
                    fill={isProton ? "#22D3EE" : mainColor} 
                    opacity="0.1"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 2, repeat: window.Infinity, ease: "easeInOut" }}
                />
            )}

            <motion.path
                d="M 0,110 L -95,-55 L 95,-55 Z"
                fill={`url(#flameGradient-${uniqueId})`}
                stroke={isProton ? "#FFF" : "#EF4444"}
                strokeWidth="2"
                initial={isAnimated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={isAnimated ? { scale: isProton ? 1.1 : 1, opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: isProton ? 0.2 : 1, repeat: isProton ? window.Infinity : 0, repeatType: "mirror" }}
                filter={`url(#glow-${uniqueId})`}
            />
            
            <motion.path
                d="M 0,-110 L 95,55 L -95,55 Z"
                fill={`url(#prismGradient-${uniqueId})`}
                stroke={isProton ? "#22D3EE" : "#3B82F6"}
                strokeWidth="2"
                initial={isAnimated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={isAnimated ? { scale: isProton ? 1.1 : 1, opacity: 1 } : {}}
                transition={{ delay: 0.8, duration: isProton ? 0.3 : 1, repeat: isProton ? window.Infinity : 0, repeatType: "mirror" }}
                filter={`url(#glow-${uniqueId})`}
                style={{ mixBlendMode: 'screen' }}
            />
        </g>

        <motion.rect
            x="185" y="185" width="30" height="30"
            fill="white"
            transform="rotate(45 200 200)"
            initial={isAnimated ? { scale: 0 } : { scale: 1 }}
            animate={isAnimated ? { 
                scale: [1, 1.3, 1],
                filter: ["drop-shadow(0 0 5px white)", "drop-shadow(0 0 25px white)", "drop-shadow(0 0 5px white)"]
            } : {}}
            transition={{ 
                delay: 1.5, 
                duration: isProton ? 0.5 : 2, 
                repeat: window.Infinity,
                ease: "easeInOut"
            }}
            filter={`url(#glow-${uniqueId})`}
        />

        {(isProton || mode === 'reactor') && (
            <>
                <motion.circle 
                    cx={c} cy={c} r="130" 
                    fill="none" 
                    stroke={isProton ? "#22D3EE" : mainColor} 
                    strokeWidth="0.5" 
                    opacity="0.6"
                    strokeDasharray="20 40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: isProton ? 5 : 20, repeat: window.Infinity, ease: "linear" }}
                    style={{ transformOrigin: "200px 200px" }}
                />
                <motion.circle 
                    cx={c} cy={c} r="145" 
                    fill="none" 
                    stroke={isProton ? "#FFF" : mainColor} 
                    strokeWidth="1" 
                    opacity="0.4"
                    strokeDasharray="2 10"
                    animate={{ rotate: -360 }}
                    transition={{ duration: isProton ? 8 : 30, repeat: window.Infinity, ease: "linear" }}
                    style={{ transformOrigin: "200px 200px" }}
                />
            </>
        )}

      </motion.svg>
      
      {isAnimated && (
        <div 
            className="absolute inset-0 blur-3xl rounded-full pointer-events-none animate-pulse-slow mix-blend-screen" 
            style={{ backgroundColor: isProton ? 'rgba(34,211,238,0.2)' : color ? `${color}15` : 'rgba(212,175,55,0.1)' } as any}
        />
      )}
    </div>
  );
};