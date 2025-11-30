import { useState, useEffect, useRef, useMemo } from 'react';
import { SpeedControls } from './components/SpeedControls';
import { TimelineDescription } from './components/TimelineDescription';
import { Scene3D } from './components/Scene3D';

export default function App() {
  
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('vertical');
  const scene3D = useMemo(() => new Scene3D(), []);

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{
        background: 'linear-gradient(135deg, #FFE5EC 0%, #FFC2D4 50%, #FFB3C6 100%)'
      }}
    >
      {/* Main Content */}
      <div className={`h-full flex 
        ${layoutMode === 'horizontal' ?
         'items-center justify-between px-8 lg:px-16 gap-8' 
         : 'flex-col justify-between px-8 py-18 gap-8'}`}>
        <scene3D.component/>
      </div>

      {/* Instructions */}
      <div 
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
        矢印キーで操作してください
      </div>
      
    </div>
  );
}