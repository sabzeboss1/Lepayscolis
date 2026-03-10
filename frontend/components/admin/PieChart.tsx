'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  showTooltip?: boolean;
  loading?: boolean;
  donut?: boolean;
  donutWidth?: number;
}

export default function PieChart({
  data,
  title,
  size = 300,
  showLegend = true,
  showPercentages = true,
  showTooltip = true,
  loading = false,
  donut = false,
  donutWidth = 60
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {title && <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />}
        <div className="flex items-center justify-center">
          <div className="w-64 h-64 bg-gray-100 rounded-full animate-pulse" />
        </div>
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

  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316'  // orange
  ];

  const total = data.reduce((sum, point) => sum + point.value, 0);
  const center = size / 2;
  const radius = size / 2 - 20;
  const innerRadius = donut ? radius - donutWidth : 0;

  // Calculate angles for each slice
  let currentAngle = -90; // Start from top
  const slices = data.map((point, index) => {
    const percentage = (point.value / total) * 100;
    const angle = (point.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...point,
      percentage,
      startAngle,
      endAngle,
      color: point.color || colors[index % colors.length]
    };
  });

  // Convert polar to cartesian coordinates
  const polarToCartesian = (angle: number, r: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(radians),
      y: center + r * Math.sin(radians)
    };
  };

  // Create SVG path for slice
  const createSlicePath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    if (donut) {
      const innerStart = polarToCartesian(startAngle, innerRadius);
      const innerEnd = polarToCartesian(endAngle, innerRadius);
      
      return `
        M ${start.x} ${start.y}
        A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}
        L ${innerEnd.x} ${innerEnd.y}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
        Z
      `;
    }

    return `
      M ${center} ${center}
      L ${start.x} ${start.y}
      A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}
      Z
    `;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <div className={`flex ${showLegend ? 'flex-col lg:flex-row' : 'justify-center'} items-center gap-8`}>
        {/* Chart */}
        <div className="relative flex-shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform transition-transform"
          >
            {slices.map((slice, index) => {
              const isHovered = hoveredIndex === index;
              const scale = isHovered ? 1.05 : 1;
              const midAngle = (slice.startAngle + slice.endAngle) / 2;
              const labelPos = polarToCartesian(midAngle, radius * 0.7);

              return (
                <g key={index}>
                  <path
                    d={createSlicePath(slice.startAngle, slice.endAngle)}
                    fill={slice.color}
                    opacity={isHovered ? 1 : 0.9}
                    className="cursor-pointer transition-all"
                    style={{
                      transformOrigin: `${center}px ${center}px`,
                      transform: `scale(${scale})`
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Percentage label on slice */}
                  {showPercentages && slice.percentage >= 5 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="text-sm fill-white font-bold pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {slice.percentage.toFixed(1)}%
                    </text>
                  )}

                  {/* Tooltip */}
                  {showTooltip && isHovered && (
                    <g>
                      <rect
                        x={center - 80}
                        y={center - 50}
                        width="160"
                        height="50"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.8)"
                      />
                      <text
                        x={center}
                        y={center - 32}
                        textAnchor="middle"
                        className="text-xs fill-white font-medium"
                      >
                        {slice.label}
                      </text>
                      <text
                        x={center}
                        y={center - 15}
                        textAnchor="middle"
                        className="text-sm fill-white font-bold"
                      >
                        {slice.value.toLocaleString()} ({slice.percentage.toFixed(1)}%)
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Center text for donut */}
            {donut && (
              <g>
                <text
                  x={center}
                  y={center - 10}
                  textAnchor="middle"
                  className="text-sm fill-gray-500 font-medium"
                >
                  Total
                </text>
                <text
                  x={center}
                  y={center + 10}
                  textAnchor="middle"
                  className="text-2xl fill-gray-900 font-bold"
                >
                  {total.toLocaleString()}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {slices.map((slice, index) => {
                const isHovered = hoveredIndex === index;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      isHovered ? 'bg-gray-50' : ''
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-sm text-gray-700 truncate">
                        {slice.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">
                        {slice.value.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
