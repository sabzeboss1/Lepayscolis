'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  loading?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export default function LineChart({
  data,
  title,
  height = 300,
  color = '#3B82F6',
  showGrid = true,
  showTooltip = true,
  loading = false,
  yAxisLabel,
  xAxisLabel
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {title && <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />}
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;
  const yScale = (value: number) => {
    return innerHeight - ((value - minValue) / valueRange) * innerHeight;
  };
  const xScale = (index: number) => {
    return (index / (data.length - 1)) * innerWidth;
  };

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaPathData = `${pathData} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`;

  // Generate grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = (i / numGridLines) * innerHeight;
    const value = maxValue - (i / numGridLines) * valueRange;
    gridLines.push({ y, value });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ maxHeight: `${height}px` }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            {showGrid && gridLines.map((line, index) => (
              <g key={index}>
                <line
                  x1={0}
                  y1={line.y}
                  x2={innerWidth}
                  y2={line.y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text
                  x={-10}
                  y={line.y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {Math.round(line.value).toLocaleString()}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path
              d={areaPathData}
              fill="url(#lineGradient)"
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = xScale(index);
              const y = yScale(point.value);
              const isHovered = hoveredIndex === index;

              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  
                  {/* Tooltip */}
                  {showTooltip && isHovered && (
                    <g>
                      <rect
                        x={x - 60}
                        y={y - 50}
                        width="120"
                        height="40"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.8)"
                      />
                      <text
                        x={x}
                        y={y - 35}
                        textAnchor="middle"
                        className="text-xs fill-white font-medium"
                      >
                        {point.label}
                      </text>
                      <text
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        className="text-sm fill-white font-bold"
                      >
                        {point.value.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* X-axis labels */}
            {data.map((point, index) => {
              // Show every nth label to avoid crowding
              const showLabel = data.length <= 12 || index % Math.ceil(data.length / 12) === 0;
              if (!showLabel) return null;

              const x = xScale(index);
              return (
                <text
                  key={index}
                  x={x}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {point.label}
                </text>
              );
            })}

            {/* Axis labels */}
            {yAxisLabel && (
              <text
                x={-innerHeight / 2}
                y={-45}
                textAnchor="middle"
                transform="rotate(-90)"
                className="text-sm fill-gray-700 font-medium"
              >
                {yAxisLabel}
              </text>
            )}
            {xAxisLabel && (
              <text
                x={innerWidth / 2}
                y={innerHeight + 35}
                textAnchor="middle"
                className="text-sm fill-gray-700 font-medium"
              >
                {xAxisLabel}
              </text>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
