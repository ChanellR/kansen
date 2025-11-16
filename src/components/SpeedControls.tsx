import { SpeedGraph } from './SpeedGraph';
import { Slider } from './ui/slider';
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
        
        {/* Speed Display */}
        {/* <div 
          className={`p-6 ${layoutMode === 'vertical' ? 'flex-1' : ''}`}
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
          <div className="flex justify-between items-center mb-4">
            <span style={{ color: '#D97BA6' }}>Current Speed</span>
            <span 
              style={{ 
                color: '#C97A98',
                fontSize: '1.5rem'
              }}
            >
              {currentSpeed.toFixed(2)}
            </span>
          </div>
          
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 182, 198, 0.2)',
              boxShadow: 'inset 2px 2px 4px rgba(255, 182, 198, 0.3)'
            }}
          >
            <div
              className="h-full transition-all duration-200 rounded-full"
              style={{
                width: `${(currentSpeed / maxSpeed) * 100}%`,
                background: 'linear-gradient(90deg, #FFB3C6, #FF8FAB)',
                boxShadow: '0 0 10px rgba(255, 143, 171, 0.5)'
              }}
            />
          </div>
        </div> */}

        {/* Max Speed Slider */}
        {/* <div 
          className={`p-6 ${layoutMode === 'vertical' ? 'flex-1' : ''}`}
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
          <div className="flex justify-between items-center mb-4">
            <span style={{ color: '#D97BA6' }}>Maximum Speed</span>
            <span 
              style={{ 
                color: '#C97A98',
                fontSize: '1.25rem'
              }}
            >
              {maxSpeed.toFixed(1)}
            </span>
          </div>
          
          <Slider
            value={[maxSpeed]}
            onValueChange={(values) => onMaxSpeedChange(values[0])}
            min={1}
            max={20}
            step={0.5}
            className="w-full"
          />
        </div> */}

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
              <div className="h-full flex items-center">
                <Slider
                  value={[maxSpeed]}
                  onValueChange={(values) => onMaxSpeedChange(values[0])}
                  min={0}
                  max={210}
                  step={0.5}
                  orientation="vertical"
                  className="h-full"
                />
              </div>
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