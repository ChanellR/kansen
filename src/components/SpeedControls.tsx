import { SpeedGraph } from './SpeedGraph';
import { useEffect, useState } from 'react';

interface SpeedControlsProps {
  maxSpeed: number;
  currentSpeed: number;
  speedHistory: Array<{ time: number; currentSpeed: number; maxSpeed: number }>;
  onMaxSpeedChange: (value: number) => void;
  animate?: boolean;
  layoutMode?: 'horizontal' | 'vertical';
}

export function SpeedControls({
  maxSpeed,
  currentSpeed,
  speedHistory,
  onMaxSpeedChange,
  animate = false,
  layoutMode = 'horizontal'
}: SpeedControlsProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (animate) {
      setIsAnimated(false);
      const timeout = setTimeout(() => setIsAnimated(true), 50);
      return () => clearTimeout(timeout);
    } else {
      setIsAnimated(true);
    }
  }, [animate, currentSpeed]);

  return (
    <div className={`w-full transition-all duration-700 ${
      isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
    }`}>
      <div className={`${layoutMode === 'vertical' ? 'flex gap-6 items-stretch' : 'max-w-lg w-full space-y-6'}`}>
        {/* Speed Graph */}
        <div 
          className={`p-6 ${layoutMode === 'vertical' ? 'flex-[2]' : ''}`}
          style={{
            background: 'linear-gradient(145deg, #FFF5F7, #FFE8EE)',
            borderRadius: '16px',
            boxShadow: `
              8px 8px 16px rgba(255, 182, 198, 0.4),
              -8px -8px 16px rgba(255, 255, 255, 0.9),
              inset 2px 2px 4px rgba(255, 255, 255, 0.8),
              inset -2px -2px 4px rgba(255, 182, 198, 0.2)
            `,
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}
        >
          <h3 
            className="mb-4"
            style={{ 
              color: '#C97A98',
              fontSize: '1.125rem'
            }}
          >
            Speed Over Time
          </h3>
          <div className="flex gap-4 items-center">
            {/* Vertical Slider */}
            <div className="flex flex-col items-center gap-2">
              <span 
                style={{ 
                  color: '#C97A98',
                  fontSize: '0.875rem',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}
              >
                Max Speed
              </span>
              <span 
                style={{ 
                  color: '#C97A98',
                  fontSize: '1rem'
                }}
              >
                {maxSpeed.toFixed(1)}
              </span>
            </div>
            
            {/* Graph */}
            <div className="flex-1">
              <SpeedGraph data={speedHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}