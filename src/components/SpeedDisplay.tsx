import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
interface ATCSpeedDisplayProps {
    currentSpeed: number;
    speedLimit: number;
    onSpeedChange?: (speed: number) => void;
    onLimitChange?: (limit: number) => void;
}

export function ATCSpeedDisplay({
    currentSpeed,
    speedLimit,
    onSpeedChange,
    onLimitChange
}: ATCSpeedDisplayProps) {
    const speedLimits = [0, 30, 70, 110, 160, 210, 260];
    const [animate, setAnimate] = useState(false);
    const [limitPosition, setLimitPosition] = useState(speedLimit);

    useEffect(() => {
        setAnimate(false);
        const timeout = setTimeout(() => setAnimate(true), 50);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="w-full space-y-6">
            <div
                className={`p-8 transition-all duration-700 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
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

                <h2
                    className="mb-4 flex items-center justify-center"
                    style={{
                        color: '#C97A98',
                        fontSize: '2rem',
                        lineHeight: '1.2'
                    }}
                >
                    {'車内信号'}
                </h2>

                <div
                    className={`p-6 gap-8 transition-all duration-700 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                        }`}
                    style={{
                        borderRadius: '16px',
                        border: '1px solid rgba(212, 137, 158, 1)',
                        position: 'relative',
                        // height: '120px'
                    }}>
                    
                    
                    {/* Speed Limit Indicators */}
                    <div className="flex justify-between items-end">
                        {speedLimits.map((limit, i) => (
                            <div
                                className={"rounded-full"}
                                key={i}
                                onClick= {(e) => {
                                    if (onLimitChange) {
                                        onLimitChange(limit);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setLimitPosition(rect.left + rect.width / 2);
                                    }
                                }}
                                style={{
                                    background: (i > 0 && limit <= speedLimit) ? 'radial-gradient(circle, #FFB6C1 0%, #FF69B4 100%)' : 'transparent',
                                    border: i === 0 ? '1px solid black' : '1px solid rgba(212, 137, 158, 1)',
                                    position: 'relative',
                                    width: '32px',
                                    height: '32px',
                                    boxShadow: '0 0 8px rgba(255, 105, 180, 0.6)'
                                }}
                                ></div>
                            ))}
                    </div>

                    {/* <div style={{height: '40px'}}></div> */}

                    {/* Speedometer ticks */}
                    <div 
                        className="flex justify-between items-end bottom-0 pb-4" 
                        style={{marginTop: '20px', padding: '0 16px', position: 'relative', cursor: onSpeedChange ? 'pointer' : 'default'}}
                        onClick={(e) => {
                            if (onSpeedChange) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - (rect.left + 16);
                                const percentage = Math.max(0, Math.min(1, x / (rect.width - 32)));
                                const newSpeed = Math.round(percentage * 260);
                                onSpeedChange(newSpeed);
                            }
                        }}
                    >
                        {Array.from({ length: 31 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '1px',
                                    height: i % 5 === 0 ? '40px' : '20px',
                                    background: '#000',
                                    opacity: 0.7
                                }}
                            />
                        ))}
                        
                        {/* Speed needle */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `calc(16px + ${(currentSpeed / 260) * 100}%)`,
                                bottom: '0',
                                transform: 'translateX(-50%)',
                                width: '3px',
                                height: '60px',
                                background: 'linear-gradient(180deg, #FF69B4 0%, #FFB6C1 100%)',
                                boxShadow: '0 0 8px rgba(255, 105, 180, 0.8)',
                                borderRadius: '2px 2px 0 0',
                                transition: 'left 0.3s ease-out',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}
                        />
                    </div>
                </div>

                {/* Decorative element */}
                <div
                    className="mt-6 h-1 rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, rgba(255, 182, 198, 0.5) 0%, transparent 100%)',
                        width: `${.5 * 100}%`,
                        transition: 'width 0.7s ease-out'
                    }}
                />
            </div>
        </div>
    );
}
