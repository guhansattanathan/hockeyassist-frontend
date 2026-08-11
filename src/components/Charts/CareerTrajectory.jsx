import React, { useState } from 'react';
import {
  AreaChart,
  Area,
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
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CareerTrajectory = ({ seasons }) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    points: true,
    rebounds: true,
    assists: true,
  });

  if (!seasons || seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-black border border-zinc-800 rounded-2xl text-zinc-500">
        <p className="text-sm font-medium">No season data available</p>
      </div>
    );
  }

  const data = [...seasons]
    .sort((a, b) => a.seasonId.localeCompare(b.seasonId))
    .map((season) => ({
      season: season.seasonId,
      points: season.points || 0,
      rebounds: season.rebounds || 0,
      assists: season.assists || 0,
    }));

  const toggleMetric = (metric) => {
    setVisibleMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const metricsConfig = [
    { key: 'points', label: 'Points', color: '#f97316', gradientId: 'pointsGrad' },
    { key: 'rebounds', label: 'Rebounds', color: '#10b981', gradientId: 'reboundsGrad' },
    { key: 'assists', label: 'Assists', color: '#3b82f6', gradientId: 'assistsGrad' },
  ];

  return (
    <div className="w-full bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      {/* Chart Header & Interactive Legend Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Career Progression
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Per-season breakdown across key statistical metrics
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

      {/* Recharts Area Container */}
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Gradient Fills tuned for Pure Black Background */}
            <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="reboundsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="assistsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />

          {/* Area Lines */}
          {visibleMetrics.points && (
            <Area
              type="monotone"
              dataKey="points"
              name="Points"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#pointsGrad)"
              dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#f97316', stroke: '#000000', strokeWidth: 3 }}
            />
          )}

          {visibleMetrics.rebounds && (
            <Area
              type="monotone"
              dataKey="rebounds"
              name="Rebounds"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#reboundsGrad)"
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#000000', strokeWidth: 3 }}
            />
          )}

          {visibleMetrics.assists && (
            <Area
              type="monotone"
              dataKey="assists"
              name="Assists"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#assistsGrad)"
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#000000', strokeWidth: 3 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CareerTrajectory;