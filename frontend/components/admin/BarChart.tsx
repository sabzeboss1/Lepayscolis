'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showTooltip?: boolean;
  loading?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export default function BarChart({
  data,
  title,
  height = 300,
  orientation = 'vertical',
  showValues = true,
  showTooltip = true,
  loading = false,
  yAxisLabel,
  xAxisLabel
}: BarChartProps) {
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

  const padding = { top: 20, right: 20, bottom: 60, left: 80 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  if (orientation === 'vertical') {
    const barWidth = innerWidth / data.length * 0.7;
    const barSpacing = innerWidth / data.length;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full"
            style={{ maxHeight: `${height}px` }}
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = innerHeight * (1 - ratio);
                const value = maxValue * ratio;
                return (
                  <g key={index}>
                    <line
                      x1={0}
                      y1={y}
                      x2={innerWidth}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                    <text
                      x={-10}
                      y={y}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="text-xs fill-gray-500"
                    >
                      {Math.round(value).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.map((point, index) => {
                const x = index * barSpacing + (barSpacing - barWidth) / 2;
                const barHeight = (point.value / maxValue) * innerHeight;
                const y = innerHeight - barHeight;
                const isHovered = hoveredIndex === index;
                const barColor = point.color || colors[index % colors.length];

                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={barColor}
                      opacity={isHovered ? 1 : 0.8}
                      className="cursor-pointer transition-opacity"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      rx="4"
                    />

                    {/* Value label */}
                    {showValues && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className="text-xs fill-gray-700 font-medium"
                      >
                        {point.value.toLocaleString()}
                      </text>
                    )}

                    {/* X-axis label */}
                    <text
                      x={x + barWidth / 2}
                      y={innerHeight + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {point.label.length > 10 ? point.label.substring(0, 10) + '...' : point.label}
                    </text>

                    {/* Tooltip */}
                    {showTooltip && isHovered && (
                      <g>
                        <rect
                          x={x + barWidth / 2 - 60}
                          y={y - 50}
                          width="120"
                          height="40"
                          rx="4"
                          fill="rgba(0, 0, 0, 0.8)"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 35}
                          textAnchor="middle"
                          className="text-xs fill-white font-medium"
                        >
                          {point.label}
                        </text>
                        <text
                          x={x + barWidth / 2}
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

              {/* Axis labels */}
              {yAxisLabel && (
                <text
                  x={-innerHeight / 2}
                  y={-60}
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
                  y={innerHeight + 45}
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

  // Horizontal orientation
  const barHeight = innerHeight / data.length * 0.7;
  const barSpacing = innerHeight / data.length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ maxHeight: `${height}px` }}
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const x = innerWidth * ratio;
              const value = maxValue * ratio;
              return (
                <g key={index}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={innerHeight}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={innerHeight + 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {Math.round(value).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((point, index) => {
              const y = index * barSpacing + (barSpacing - barHeight) / 2;
              const barWidth = (point.value / maxValue) * innerWidth;
              const isHovered = hoveredIndex === index;
              const barColor = point.color || colors[index % colors.length];

              return (
                <g key={index}>
                  <rect
                    x={0}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    opacity={isHovered ? 1 : 0.8}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    rx="4"
                  />

                  {/* Value label */}
                  {showValues && (
                    <text
                      x={barWidth + 5}
                      y={y + barHeight / 2}
                      alignmentBaseline="middle"
                      className="text-xs fill-gray-700 font-medium"
                    >
                      {point.value.toLocaleString()}
                    </text>
                  )}

                  {/* Y-axis label */}
                  <text
                    x={-10}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-gray-500"
                  >
                    {point.label}
                  </text>

                  {/* Tooltip */}
                  {showTooltip && isHovered && (
                    <g>
                      <rect
                        x={barWidth / 2 - 60}
                        y={y - 50}
                        width="120"
                        height="40"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.8)"
                      />
                      <text
                        x={barWidth / 2}
                        y={y - 35}
                        textAnchor="middle"
                        className="text-xs fill-white font-medium"
                      >
                        {point.label}
                      </text>
                      <text
                        x={barWidth / 2}
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
          </g>
        </svg>
      </div>
    </div>
  );
}
