import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell 
} from 'recharts';

const GamesPlayedChart = ({ seasons }) => {
  const [visibleTiers, setVisibleTiers] = useState({
    high: true,   // >= 70 GP (Green)
    med: true,    // 50–69 GP (Orange)
    low: true,    // < 50 GP  (Red)
  });

  if (!seasons || seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-black border border-zinc-800 rounded-2xl text-zinc-500">
        <p className="text-sm font-medium">No games played data available</p>
      </div>
    );
  }

  // Determine tier key for a given games played value
  const getTier = (games) => {
    if (games >= 70) return 'high';
    if (games >= 50) return 'med';
    return 'low';
  };

  // Synchronized color values
  const GREEN = '#10b981';  // Emerald
  const ORANGE = '#f97316'; // Orange (matched to EfficiencyChart FG%)
  const RED = '#ef4444';    // Rose / Red

  const getBarColor = (games) => {
    const tier = getTier(games);
    if (tier === 'high') return GREEN;
    if (tier === 'med') return ORANGE;
    return RED;
  };

  // Gradient IDs corresponding to each tier
  const getGradientId = (games) => {
    const tier = getTier(games);
    if (tier === 'high') return 'url(#greenGrad)';
    if (tier === 'med') return 'url(#orangeGrad)';
    return 'url(#redGrad)';
  };

  // Format and sort seasonal data
  const data = [...seasons]
    .sort((a, b) => String(a.seasonId || a.season).localeCompare(String(b.seasonId || b.season)))
    .map((season) => {
      const games = Number(season.gamesPlayed ?? season.gp ?? season.games ?? 0);
      const tier = getTier(games);
      return {
        season: season.seasonId || season.season,
        games,
        tier,
        isVisible: visibleTiers[tier],
      };
    });

  const fullSeason = 82;
  const avgGames = Math.round(data.reduce((sum, d) => sum + d.games, 0) / data.length);

  const toggleTier = (tierKey) => {
    setVisibleTiers((prev) => ({
      ...prev,
      [tierKey]: !prev[tierKey],
    }));
  };

  // Custom Pitch-Black Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentData = payload[0].payload;

      if (!currentData.isVisible) return null;

      const value = currentData.games;
      const percentage = Math.round((value / fullSeason) * 100);
      const color = getBarColor(value);

      return (
        <div className="bg-black/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 shadow-2xl text-xs font-mono">
          <p className="text-zinc-400 font-bold mb-2 uppercase tracking-wider">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-sans font-medium text-zinc-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                Games Played:
              </span>
              <span className="font-bold text-white text-sm">
                {value} <span className="text-zinc-600 font-medium text-xs">/ 82</span>
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs font-sans">
              <span className="text-zinc-500 font-medium">Season Load</span>
              <span className="font-bold text-zinc-300">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const legendItems = [
    { key: 'high', label: '70+ GP', color: GREEN },
    { key: 'med', label: '50–69 GP', color: ORANGE },
    { key: 'low', label: '<50 GP', color: RED },
  ];

  return (
    <div className="w-full bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      {/* Chart Header & Interactive Legend Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Durability & Availability
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Games played per regular season
          </p>
        </div>

        {/* Custom Legend / Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {legendItems.map(({ key, label, color }) => {
            const isActive = visibleTiers[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleTier(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border cursor-pointer ${
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-black border-zinc-800 text-zinc-500 ml-1">
            Avg: <span className="text-zinc-300">{avgGames}</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart 
          data={data} 
          margin={{ top: 24, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* Subtle Vertical Gradients matching EfficiencyChart translucency */}
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={1} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity={1} />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={1} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.6} />
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
            domain={[0, 82]}
            ticks={[0, 20, 40, 60, 82]}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#27272a', opacity: 0.4 }} 
          />
          
          {/* Reference Line for Full Season */}
          <ReferenceLine 
            y={82} 
            stroke={GREEN} 
            strokeDasharray="4 4" 
            strokeOpacity={0.4}
            label={{ 
              value: '82 GP Target', 
              position: 'insideTopRight', 
              fill: GREEN, 
              fontSize: 11,
              dy: -18,
            }}
          />

          {/* Reference Line for All-NBA Eligibility Threshold */}
          <ReferenceLine 
            y={65} 
            stroke={ORANGE} 
            strokeDasharray="4 4" 
            strokeOpacity={0.4}
            label={{ 
              value: '65 GP (Awards)', 
              position: 'insideBottomRight', 
              fill: ORANGE, 
              fontSize: 11,
              dy: -4,
            }}
          />

          <Bar
            dataKey="games"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getGradientId(entry.games)} 
                fillOpacity={entry.isVisible ? 1 : 0}
                style={{ transition: 'fill-opacity 0.25s ease' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GamesPlayedChart;