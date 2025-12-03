import { useEffect, useState } from 'react';
interface ATCSpeedDisplayProps {
    currentSpeed: number;
    speedLimit: number;
    onSpeedChange: (speed: number) => void;
    onLimitChange: (limit: number) => void;
}

export function ATCSpeedDisplay({
    currentSpeed,
    speedLimit,
    onSpeedChange,
    onLimitChange
}: ATCSpeedDisplayProps) {
    const SPEED_LIMITS = [0, 30, 70, 110, 160, 210, 260];
    const MAX_SPEED = 260;
    const [animate, setAnimate] = useState(false);

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
                        fontSize: '1.2rem',
                        lineHeight: '1.2'
                    }}
                >
                    {'車内信号'}
                </h2>

                <div
                    className={`relative p-6 px-8`}
                    style={{
                        borderRadius: '16px',
                        border: '1px solid rgba(212, 137, 158, 1)',
                        position: 'relative',
                        height: '185px'
                    }}>

                    {/* Speed Limit Indicators */}
                    <div className="relative">
                        {SPEED_LIMITS.map((limit, i) => (
                            <div
                                className={"absolute rounded-full -translate-x-1/2"}
                                key={`limit-${i}`}
                                onClick= {(e) => onLimitChange(limit)}
                                style={{
                                    background: (i > 0 && limit <= speedLimit) ? 'radial-gradient(circle, #FFB6C1 0%, #FF69B4 100%)' : 'transparent',
                                    border: i === 0 ? '1px solid black' : '1px solid rgba(212, 137, 158, 1)',
                                    left: `${limit / MAX_SPEED * 100}%`,
                                    width: '32px',
                                    height: '32px',
                                    boxShadow: '0 0 8px rgba(255, 105, 180, 0.6)'
                                }}
                                >
                            </div>
                        ))}
                    </div>

                    {/* Speed Limit Labels */}
                    <div className="relative" style={{height: "40px", top: "40px"}}>
                        {SPEED_LIMITS.map((limit, i) => (
                            <div
                                className={"absolute -translate-x-1/2 "}
                                key={`label-${i}`}
                                style={{
                                    left: `${limit / MAX_SPEED * 100}%`,
                                    color: '#C97A98',
                                    fontSize: '1.2rem',
                                    fontFamily: 'roboto, sans-serif',
                                    lineHeight: '1.2',
                                }}
                                >{limit}
                            </div>
                        ))}
                    </div>

                    {/* Speedometer ticks */}
                    <div
                        className="relative"
                        style={{height: "40px", top: "40px"}}
                        onClick={(e) => {
                            if (onSpeedChange) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - (rect.left + 16);
                                const percentage = Math.max(0, Math.min(1, x / (rect.width - 32)));
                                const newSpeed = Math.round(percentage * MAX_SPEED);
                                console.log("Setting speed to:", newSpeed);
                                onSpeedChange(newSpeed);
                            }
                        }}
                    >
                        {Array.from({ length: MAX_SPEED / 5 + 1 }, (_, i) => {
                            const val = i * 5;
                            const isLimit = SPEED_LIMITS.includes(val);
                            return (
                                <div
                                    className="absolute bottom-0"
                                    key={`tick-${val}`}
                                    style={{
                                        left: `${(i * 5) / MAX_SPEED * 100}%`,
                                        bottom: '0%',
                                        width: '1px',
                                        height: isLimit ? '40px' : (val % 10 == 5 ? '12px' : '20px'),
                                        background: '#000',
                                        opacity: 0.7
                                    }}
                                />
                            );
                        })}

                        {/* Speed needle */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${(currentSpeed / MAX_SPEED) * 100}%`,
                                bottom: '0',
                                transform: 'translateX(-50%)',
                                width: '3px',
                                height: '30px',
                                background: 'linear-gradient(180deg, #FF69B4 0%, #FFB6C1 100%)',
                                boxShadow: '0 0 8px rgba(255, 105, 180, 0.8)',
                                borderRadius: '2px 2px 0 0',
                                transition: 'left 0.3s ease-out',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}
                        />

                        {/* Straight Black line */}
                        <div
                            className="absolute rounded-full"
                            style={{
                                top: '50px',
                                background: '#000',
                                width: `${100}%`,
                                height: '1px',
                                transition: 'width 0.7s ease-out'
                            }}
                        />

                        {/* km/h */}
                        <div
                            className="absolute -translate-x-1/2"
                            style={{
                                top: '55px',
                                left: '50%',
                                fontSize: '1rem',
                                color: '#432e36ff',
                                fontFamily: 'roboto, sans-serif',
                                lineHeight: '1.2',
                            }}
                        >km/h
                        </div>
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
