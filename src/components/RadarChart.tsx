interface RadarChartProps {
  data: {
    jogabilidade: number;
    graficos: number;
    narrativa: number;
    audio: number;
    desempenho: number;
  };
  size?: number;
  showLabels?: boolean;
  title?: string;
}

export const RadarChart = ({ data, size = 200, showLabels = true, title }: RadarChartProps) => {
  const attributes = [
    { key: 'jogabilidade', label: 'Jogabilidade', angle: 0 },
    { key: 'graficos', label: 'Gráficos', angle: 72 },
    { key: 'narrativa', label: 'Narrativa', angle: 144 },
    { key: 'audio', label: 'Áudio', angle: 216 },
    { key: 'desempenho', label: 'Desempenho', angle: 288 },
  ];

  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const levels = 5;

  // Calculate points for the data polygon
  const dataPoints = attributes.map((attr) => {
    const value = data[attr.key as keyof typeof data];
    const radius = (value / 10) * maxRadius;
    const angleRad = (attr.angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angleRad),
      y: center + radius * Math.sin(angleRad),
    };
  });

  const dataPath = dataPoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center gap-4">
      {title && (
        <h3 className="text-sm font-black text-primary uppercase tracking-wider font-pixel">
          {title}
        </h3>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible relative z-10">
          {/* Background levels */}
          {[...Array(levels)].map((_, i) => {
            const radius = ((i + 1) / levels) * maxRadius;
            const points = attributes.map((attr) => {
              const angleRad = (attr.angle - 90) * (Math.PI / 180);
              return `${center + radius * Math.cos(angleRad)},${center + radius * Math.sin(angleRad)}`;
            }).join(' ');
            
            return (
              <polygon
                key={i}
                points={points}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity={0.1 + (i * 0.05)}
              />
            );
          })}

          {/* Axis lines */}
          {attributes.map((attr) => {
            const angleRad = (attr.angle - 90) * (Math.PI / 180);
            const endX = center + maxRadius * Math.cos(angleRad);
            const endY = center + maxRadius * Math.sin(angleRad);
            
            return (
              <line
                key={attr.key}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.2"
              />
            );
          })}

          {/* Data polygon */}
          <path
            d={dataPath}
            fill="hsl(var(--primary))"
            fillOpacity="0.3"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
          />

          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--primary))"
              className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
            />
          ))}

          {/* Labels */}
          {showLabels && attributes.map((attr, i) => {
            const angleRad = (attr.angle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius + 25;
            const x = center + labelRadius * Math.cos(angleRad);
            const y = center + labelRadius * Math.sin(angleRad);
            
            return (
              <text
                key={attr.key}
                x={x}
                y={y}
                fill="hsl(var(--primary))"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.7"
                className="uppercase tracking-wider"
              >
                {attr.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
