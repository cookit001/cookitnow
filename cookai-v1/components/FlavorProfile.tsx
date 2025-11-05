import React from 'react';
import type { FlavorProfileData } from '../types';

interface FlavorProfileProps {
    profile: FlavorProfileData;
}

const FlavorProfile: React.FC<FlavorProfileProps> = ({ profile }) => {
    const size = 220;
    const center = size / 2;
    const radius = size * 0.4;
    const levels = 5;
    const labels: (keyof FlavorProfileData)[] = ['sweet', 'spicy', 'salty', 'sour', 'bitter', 'umami'];
    const dataPoints = labels.map(label => profile[label] || 0);

    const pointToCoordinate = (value: number, index: number): { x: number; y: number } => {
        const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2; // Start from top
        const r = (value / 100) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const gridPoints = Array.from({ length: levels }, (_, i) => {
        const levelRadius = radius * ((i + 1) / levels);
        return labels.map((_, index) => {
            const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
            return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
        }).join(' ');
    });

    const axisPoints = labels.map((_, i) => pointToCoordinate(100, i));
    const labelPoints = labels.map((_, i) => pointToCoordinate(115, i)); 
    const dataPolygonPoints = dataPoints.map((value, i) => {
        const { x, y } = pointToCoordinate(value, i);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="mb-6 bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-3 text-center">Flavor Profile</h3>
            <div className="flex justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="A radar chart showing the recipe's flavor profile.">
                    <g>
                        {gridPoints.map((points, i) => (
                            <polygon
                                key={`grid-${i}`}
                                points={points}
                                fill="none"
                                stroke={i === levels - 1 ? "rgba(110, 231, 183, 0.5)" : "rgba(107, 114, 128, 0.4)"}
                                strokeWidth="1"
                            />
                        ))}
                        {axisPoints.map((point, i) => (
                            <line
                                key={`axis-${i}`}
                                x1={center}
                                y1={center}
                                x2={point.x}
                                y2={point.y}
                                stroke="rgba(107, 114, 128, 0.6)"
                                strokeWidth="1"
                            />
                        ))}
                        {labels.map((label, i) => (
                            <text
                                key={`label-${String(label)}`}
                                x={labelPoints[i].x}
                                y={labelPoints[i].y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="rgba(209, 213, 219, 0.9)"
                                fontSize="12"
                                className="capitalize font-medium"
                            >
                                {label}
                            </text>
                        ))}
                        <polygon
                            points={dataPolygonPoints}
                            fill="rgba(52, 211, 153, 0.4)"
                            stroke="rgba(52, 211, 153, 1)"
                            strokeWidth="2"
                        />
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default React.memo(FlavorProfile);