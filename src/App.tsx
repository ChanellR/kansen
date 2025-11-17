import { useState, useEffect, useRef } from 'react';
import { InteractiveScene } from './components/InteractiveScene';
import { SpeedControls } from './components/SpeedControls';
import { TimelineDescription } from './components/TimelineDescription';
import { Scene3D } from './components/Scene3D';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';

export default function App() {
  const [maxSpeed, setMaxSpeed] = useState(180);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<Array<{ time: number; currentSpeed: number; maxSpeed: number }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('vertical');
  const timeRef = useRef(0);

  const timelineSteps = [
    {
      title: "はじめに",
      description: "東海道新幹線の開発の時に、いろいろな注意するべきことがあって、事故を回避して安全で正確の乗り物を作ったら、高度のシステムを作って頼りにしなきゃなりません。この技術をインターアクティブなアニメーションによる説明してみます。まず、「ＡＴＣ」というシステムに集中します。このシステムは新幹線の運転士に許容速度を表示して、列車がその限界を超過した場合は自動的に減速させる機械を持っています。\n「自動列車制御装置」は新幹線の開業当初から大分進化してきましたが、その前にある繋がっている技術とシステムや当時の状態を発表します！"
    },
    {
      title: "軌道回路（きどうかいろ）",
      description: "鉄道の当初からの最も基本的な衝突を回避する技術は、その道路にあるみたいな信号機。鉄道車両は停まるまでのブレーキ距離が長いですので、運転士にちゃんと手配させてあげなきゃいけません。この信号機は線路を区切って、一つの区間に一本の列車しか入れないことにします。列車がなんかの「閉塞区間」に存在するかどうか検知できる機械を、今から説明します。"
    },
    {
      title: "軌道回路（きどうかいろ）",
      description: "これは軌道回路と呼ばれます。この装置は線路にある信号機を動かすために用います。軌道回路の原理は、鉄道の輪軸が2本のレールを短絡して電気回路を構成することにあります。この回路に信号機を取り付けて列車の存在を後続列車に知らせます。"
    },
    {
      title: "軌道回路（きどうかいろ）",
      description: "この回路は列車が出るまで短絡で残っています。そして、信号機がこうなります。"
    },
    {
      title: "鉄道の信号機",
      description: "次、この「閉塞区間」はどう並ぶか表示します。"
    },
    {
      title: "鉄道の信号機",
      description: "三つの色を持っている信号機は列車の進行方向に置いて、後続の列車の許容速度は、先行の列車との距離に決めています。こうやって、新幹線の開業からの従来に、鉄道車両が衝突を回避できました。でも、新幹線では地上である信号機は不十分。高速では、運転士が信号機を見落とす可能が上がりますので、「ＡＴＣ」は新しい技でヒューマンエラーによる事故を防ぎます。"
    },
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
      <div className={`min-h-screen ${layoutMode === 'horizontal' ? 'flex items-center justify-between px-8 lg:px-16 gap-8' : 'flex flex-col px-8 py-18 gap-2'}`}>
        {/* 3D Interactive Scene */}
        <div className={`${layoutMode === 'horizontal' 
          ? 'w-full lg:w-1/2 h-full flex items-center justify-center' 
          : 'w-full flex items-center justify-center'}`}>
          <Scene3D maxSpeed={maxSpeed} sceneNumber={currentStep}/>
        </div>

        {/* Right side / Bottom - Controls and Description */}
        <div className={`${layoutMode === 'horizontal' ? 'w-full lg:w-1/2 flex items-center justify-end pr-0 lg:pr-12' : 'w-full flex items-center justify-center gap-8'}`}>
          <TimelineDescription
            title={timelineSteps[currentStep].title}
            description={timelineSteps[currentStep].description}
            currentStep={currentStep + 1}
            totalSteps={timelineSteps.length}
          />
          {/* <div className="flex-1">
            { currentStep === 0 &&
              <>
                <SpeedControls
                  maxSpeed={maxSpeed}
                  currentSpeed={currentSpeed}
                  speedHistory={speedHistory}
                  onMaxSpeedChange={setMaxSpeed}
                  animate={true}
                  layoutMode={layoutMode}
                />
              </>
            }
          </div> */}
        </div>
      </div>

      {/* Layout Toggle Button */}
      {/* <button
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
      </button> */}

      {/* Timeline Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
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