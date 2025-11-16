import { useState, useEffect, useRef } from 'react';
import { InteractiveScene } from './components/InteractiveScene';
import { SpeedControls } from './components/SpeedControls';
import { TimelineDescription } from './components/TimelineDescription';
import { Scene3D } from './components/Scene3D';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';

export default function App() {
  const [maxSpeed, setMaxSpeed] = useState(10);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<Array<{ time: number; currentSpeed: number; maxSpeed: number }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('vertical');
  const timeRef = useRef(0);

  const timelineSteps = [
    {
      title: "Interactive Physics",
      description: "Drag the sphere to explore real-time physics simulation. Watch as speed changes dynamically based on your interactions, with momentum and friction applied naturally."
    },
    {
      title: "Speed Monitoring",
      description: "Track your object's velocity in real-time with the live graph. The visualization shows both current speed and maximum limits over the past 10 seconds."
    },
    {
      title: "Control & Precision",
      description: "Fine-tune the maximum speed limit using the slider. This constraint affects how fast your object can move, giving you precise control over the simulation."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current += 0.1;
      
      // Add new speed data point
      setSpeedHistory(prev => {
        const newHistory = [
          ...prev,
          {
            time: parseFloat(timeRef.current.toFixed(1)),
            currentSpeed: currentSpeed,
            maxSpeed: maxSpeed
          }
        ];
        
        // Keep only last 10 seconds of data
        return newHistory.filter(point => point.time > timeRef.current - 10);
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [currentSpeed, maxSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentStep((prev) => (prev + 1) % timelineSteps.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => (prev - 1 + timelineSteps.length) % timelineSteps.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineSteps.length]);

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{
        background: 'linear-gradient(135deg, #FFE5EC 0%, #FFC2D4 50%, #FFB3C6 100%)'
      }}
    >
      <div className={`min-h-screen ${layoutMode === 'horizontal' ? 'flex items-center justify-between px-8 lg:px-16 gap-8' : 'flex flex-col px-8 py-8 gap-8'}`}>
        {/* 3D Interactive Scene */}
        <div className={`${layoutMode === 'horizontal' 
          ? 'w-full lg:w-1/2 h-full flex items-center justify-center' 
          : 'w-full flex items-center justify-center'}`}>
          {/* <InteractiveScene 
            maxSpeed={maxSpeed}
            onSpeedChange={setCurrentSpeed}
          /> */}
          <Scene3D maxSpeed={maxSpeed} />
        </div>

        {/* Right side / Bottom - Controls and Description */}
        <div className={`${layoutMode === 'horizontal' ? 'w-full lg:w-1/2 flex items-center justify-end pr-0 lg:pr-12' : 'w-full flex items-center justify-center'}`}>
          <div className=" h-1/2 flex w-full gap-4">
            <TimelineDescription
              title={timelineSteps[currentStep].title}
              description={timelineSteps[currentStep].description}
              currentStep={currentStep + 1}
              totalSteps={timelineSteps.length}
            />
            
            <SpeedControls
              maxSpeed={maxSpeed}
              currentSpeed={currentSpeed}
              speedHistory={speedHistory}
              onMaxSpeedChange={setMaxSpeed}
              animate={true}
              layoutMode={layoutMode}
            />

          </div>
        </div>
      </div>

      {/* Layout Toggle Button */}
      <button
        onClick={() => setLayoutMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
        className="absolute top-8 left-8 p-3 rounded-full transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(145deg, #FFF5F7, #FFE8EE)',
          boxShadow: `
            4px 4px 8px rgba(255, 182, 198, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.9)
          `,
          color: '#D97BA6'
        }}
        aria-label="Toggle layout"
      >
        {layoutMode === 'horizontal' ? <ArrowUpDown size={20} /> : <ArrowLeftRight size={20} />}
      </button>

      {/* Timeline Progress Indicator */}
      {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
        {timelineSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? 'bg-pink-600 scale-125' 
                : 'bg-pink-200 hover:bg-pink-300'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div> */}

      {/* Instructions */}
      {/* <div 
        className="absolute top-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full"
        style={{
          background: 'linear-gradient(145deg, #FFF5F7, #FFE8EE)',
          boxShadow: `
            4px 4px 8px rgba(255, 182, 198, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.9)
          `,
          color: '#D97BA6'
        }}
      >
        Click and drag the sphere • Use arrow keys to navigate
      </div> */}
      
    </div>
  );
}