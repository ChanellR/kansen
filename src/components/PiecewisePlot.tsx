import { useEffect, useState } from 'react';

export interface PiecewiseSegment {
    startX: number;
    endX: number;
    fn: (x: number) => number;
}

export interface PiecewiseFunction {
    segments: PiecewiseSegment[];
    color: string;
    label?: string;
}

interface PiecewisePlotProps {
    functions: PiecewiseFunction[];
    xRange?: [number, number];
    yRange?: [number, number];
    samplesPerSegment?: number;
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showAxes?: boolean;
}

export function PiecewisePlot({ 
    functions, 
    xRange = [0, 10], 
    yRange,
    samplesPerSegment = 50,
    title = '区分的関数',
    xAxisLabel,
    yAxisLabel,
    showAxes = true
}: PiecewisePlotProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(false);
        const timeout = setTimeout(() => setAnimate(true), 50);
        return () => clearTimeout(timeout);
    }, []);

    const width = 600;
    const height = 120;
    const [xMin, xMax] = xRange;

    // Generate points for each piecewise function
    const generatePath = (piecewiseFunc: PiecewiseFunction): string => {
        const allPoints: [number, number][] = [];

        piecewiseFunc.segments.forEach(segment => {
            const segmentStart = Math.max(segment.startX, xMin);
            const segmentEnd = Math.min(segment.endX, xMax);
            
            if (segmentEnd <= segmentStart) return;

            const numSamples = samplesPerSegment;
            const step = (segmentEnd - segmentStart) / (numSamples - 1);

            for (let i = 0; i < numSamples; i++) {
                const x = segmentStart + i * step;
                const y = segment.fn(x);
                allPoints.push([x, y]);
            }
        });

        if (allPoints.length === 0) return '';

        // Determine y range for scaling
        const yValues = allPoints.map(p => p[1]);
        const yMin = yRange ? yRange[0] : Math.min(...yValues);
        const yMax = yRange ? yRange[1] : Math.max(...yValues);
        const yRangeValue = yMax - yMin || 1;

        // Convert to SVG coordinates
        const svgPoints = allPoints.map(([x, y]) => {
            const svgX = ((x - xMin) / (xMax - xMin)) * width;
            const svgY = height - ((y - yMin) / yRangeValue) * height * 0.8 - height * 0.1;
            return `${svgX},${svgY}`;
        });

        return `M ${svgPoints.join(' L ')}`;
    };

    return (
        <div className="w-full space-y-6">
            <div
                className={`p-8 transition-all duration-700 ${
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
                <h2
                    className="mb-4 flex items-center justify-center"
                    style={{
                        color: '#C97A98',
                        fontSize: '1.2rem',
                        lineHeight: '1.2'
                    }}
                >
                    {title}
                </h2>

                <div
                    className="relative p-6 px-8"
                    style={{
                        borderRadius: '16px',
                        border: '1px solid rgba(212, 137, 158, 1)',
                        position: 'relative',
                        height: '190px'
                    }}
                >
                    {/* Y-axis label */}
                    {showAxes && yAxisLabel && (
                        <div
                            style={{
                                position: 'absolute',
                                left: '-10px',
                                top: '50%',
                                transform: 'translateY(-50%) rotate(-90deg)',
                                color: '#C97A98',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {yAxisLabel}
                        </div>
                    )}

                    {/* Waveform rendering */}
                    <svg
                        width="100%"
                        height="120"
                        viewBox="0 0 600 120"
                        preserveAspectRatio="none"
                        style={{ display: 'block' }}
                    >
                        {/* Grid lines (optional) */}
                        {showAxes && (
                            <>
                                <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(201, 122, 152, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
                                <line x1="0" y1="0" x2="0" y2="120" stroke="rgba(201, 122, 152, 0.3)" strokeWidth="1" />
                            </>
                        )}
                        
                        {/* Plot each piecewise function */}
                        {functions.map((piecewiseFunc, index) => (
                            <path
                                key={index}
                                d={generatePath(piecewiseFunc)}
                                fill="none"
                                stroke={piecewiseFunc.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}
                    </svg>

                    {/* X-axis label */}
                    {showAxes && xAxisLabel && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '0px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: '#C97A98',
                                fontSize: '0.85rem'
                            }}
                        >
                            {xAxisLabel}
                        </div>
                    )}
                </div>

                {/* Legend */}
                {functions.some(f => f.label) && (
                    <div className="mt-4 flex flex-wrap gap-4 justify-center">
                        {functions.map((func, index) => 
                            func.label ? (
                                <div key={index} className="flex items-center gap-2">
                                    <div 
                                        style={{ 
                                            width: '20px', 
                                            height: '3px', 
                                            backgroundColor: func.color 
                                        }} 
                                    />
                                    <span style={{ color: '#C97A98', fontSize: '0.9rem' }}>
                                        {func.label}
                                    </span>
                                </div>
                            ) : null
                        )}
                    </div>
                )}

                {/* Decorative element */}
                <div
                    className="mt-6 h-1 rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, rgba(255, 182, 198, 0.5) 0%, transparent 100%)',
                        width: '50%',
                        transition: 'width 0.7s ease-out'
                    }}
                />
            </div>
        </div>
    );
}
