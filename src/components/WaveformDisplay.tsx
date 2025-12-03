import { useEffect, useState, useRef } from 'react';


export function WaveformDisplay({ fn }: { fn: (elapsedTime: number) => number }) {
    const [animate, setAnimate] = useState(false);
    const [waveformPath, setWaveformPath] = useState('');
    const samplesRef = useRef<number[]>([]);
    const startTimeRef = useRef<number>(Date.now());
    const maxSamples = 100;

    useEffect(() => {
        setAnimate(false);
        const timeout = setTimeout(() => setAnimate(true), 50);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        startTimeRef.current = Date.now();
        
        const updateWaveform = () => {
            const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
            const value = fn(elapsedTime);
            
            // Add new sample and maintain buffer size
            samplesRef.current.push(value);
            if (samplesRef.current.length > maxSamples) {
                samplesRef.current.shift();
            }

            // Generate SVG path
            const width = 600;
            const height = 120;
            const samples = samplesRef.current;
            
            if (samples.length >= 2) {
                // Find min/max for scaling
                const min = Math.min(...samples);
                const max = Math.max(...samples);
                const range = max - min || 1;

                // Create path
                const points = samples.map((val, i) => {
                    const x = (i / (maxSamples - 1)) * width;
                    const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
                    return `${x},${y}`;
                });

                setWaveformPath(`M ${points.join(' L ')}`);
            }
        };

        const intervalId = setInterval(updateWaveform, 1000 / 30); // 60 FPS
        
        return () => clearInterval(intervalId);
    }, [fn]);

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
                    {'電流信号'}
                </h2>

                <div
                    className={`relative p-6 px-8`}
                    style={{
                        borderRadius: '16px',
                        border: '1px solid rgba(212, 137, 158, 1)',
                        position: 'relative',
                        height: '185px'
                    }}>

                    {/* Waveform rendering*/}
                    <svg
                        width="100%"
                        height="120"
                        viewBox="0 0 600 120"
                        preserveAspectRatio="none"
                        style={{ display: 'block' }}
                    >
                        <path
                            d={waveformPath}
                            fill="none"
                            stroke="#C97A98"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    
                </div>                {/* Decorative element */}
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
