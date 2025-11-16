import { useEffect, useState } from 'react';

interface TimelineDescriptionProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
}

export function TimelineDescription({ 
  title, 
  description, 
  currentStep, 
  totalSteps 
}: TimelineDescriptionProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timeout);
  }, [title]);

  return (
    <div className="w-full flex justify-center items-center">
      <div 
        className={`max-w-md p-8 transition-all duration-700 ${
          animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
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
        <div className="mb-4 flex items-center justify-between">
          <span 
            className="px-3 py-1 rounded-full"
            style={{
              background: 'rgba(255, 182, 198, 0.3)',
              color: '#D97BA6',
              fontSize: '0.875rem'
            }}
          >
            {currentStep} / {totalSteps}
          </span>
        </div>
        
        <h2 
          className="mb-4"
          style={{
            color: '#C97A98',
            fontSize: '2rem',
            lineHeight: '1.2'
          }}
        >
          {title}
        </h2>
        
        <p 
          style={{
            color: '#D4899E',
            lineHeight: '1.8',
            fontSize: '1.125rem'
          }}
        >
          {description}
        </p>

        {/* Decorative element */}
        <div 
          className="mt-6 h-1 rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 182, 198, 0.5) 0%, transparent 100%)',
            width: `${(currentStep / totalSteps) * 100}%`,
            transition: 'width 0.7s ease-out'
          }}
        />
      </div>
    </div>
  );
}
