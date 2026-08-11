import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Custom Pitch-Black Glassmorphism Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 shadow-2xl text-xs font-mono">
        <p className="text-zinc-400 font-bold mb-2 uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-sans font-medium text-zinc-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white text-sm">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EfficiencyChart = ({ seasons }) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    fgPct: true,
    threePct: true,
    ftPct: true,
  });

  if (!seasons || seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-black border border-zinc-800 rounded-2xl text-zinc-500">
        <p className="text-sm font-medium">No efficiency data available</p>
      </div>
    );
  }

  const data = [...seasons]
    .sort((a, b) => a.seasonId.localeCompare(b.seasonId))
    .map((season) => ({
      season: season.seasonId,
      fgPct: season.fieldGoalPct ? parseFloat((season.fieldGoalPct * 100).toFixed(1)) : 0,
      threePct: season.threePointPct ? parseFloat((season.threePointPct * 100).toFixed(1)) : 0,
      ftPct: season.freeThrowPct ? parseFloat((season.freeThrowPct * 100).toFixed(1)) : 0,
    }));

  const toggleMetric = (metric) => {
    setVisibleMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const metricsConfig = [
    { key: 'fgPct', label: 'FG%', color: '#f97316', gradientId: 'fgGrad' },
    { key: 'threePct', label: '3P%', color: '#10b981', gradientId: 'threeGrad' },
    { key: 'ftPct', label: 'FT%', color: '#3b82f6', gradientId: 'ftGrad' },
  ];

  return (
    <div className="w-full bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      {/* Chart Header & Interactive Legend Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Shooting Efficiency
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Per-season percentage breakdown for Field Goals, 3-Pointers, and Free Throws
          </p>
        </div>

        {/* Custom Legend / Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {metricsConfig.map(({ key, label, color }) => {
            const isActive = visibleMetrics[key];
            return (
              <button
                key={key}
                onClick={() => toggleMetric(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200 shadow-sm'
                    : 'bg-black border-zinc-800 text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-opacity duration-200"
                  style={{
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.3,
                    boxShadow: isActive ? `0 0 8px ${color}80` : 'none',
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts Bar Container */}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
          <defs>
            {/* Subtle Vertical Gradients for Bars */}
            <linearGradient id="fgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="threeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="ftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

          <XAxis
            dataKey="season"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-5}
            unit="%"
          />

          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ 
              fill: 'rgba(255, 255, 255, 0.09)',
              stroke: '#3f3f46',
              strokeWidth: 1,
              strokeDasharray: '2 2',
              rx: 8,
              ry: 8
            }} 
          />

          {visibleMetrics.fgPct && (
            <Bar
              dataKey="fgPct"
              name="FG%"
              fill="url(#fgGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          )}

          {visibleMetrics.threePct && (
            <Bar
              dataKey="threePct"
              name="3P%"
              fill="url(#threeGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          )}

          {visibleMetrics.ftPct && (
            <Bar
              dataKey="ftPct"
              name="FT%"
              fill="url(#ftGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EfficiencyChart;