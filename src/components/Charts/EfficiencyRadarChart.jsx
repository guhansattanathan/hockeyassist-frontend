import React, { useState, useEffect, useRef } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { playerService } from '../../services/api';

const LEAGUE_AVERAGES = {
  usageRate: 20.0,
  trueShootingPct: 57.0,
  effectiveFgPct: 54.0,
  assistRate: 18.0,
  reboundRate: 10.0,
};

// Custom Pitch-Black Glassmorphism Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;
  const isAboveAvg = item.player >= item.leagueAvg;

  return (
    <div className="bg-black/95 backdrop-blur-md border border-zinc-700 rounded-xl p-3.5 shadow-2xl text-xs font-mono max-w-xs text-left">
      <p className="text-zinc-300 font-bold mb-1.5 uppercase tracking-wider">{item.metric}</p>
      
      <div className="my-2 flex items-baseline gap-2 font-sans">
        <span className="text-2xl font-extrabold text-orange-500">{item.player}%</span>
        <span className="text-xs text-zinc-400">League Avg: {item.leagueAvg}%</span>
      </div>

      <p className="text-xs text-zinc-400 font-sans mt-1 leading-relaxed">{item.description}</p>

      <div className="mt-3 pt-2 border-t border-zinc-800 font-sans">
        <p className={`text-xs font-semibold ${isAboveAvg ? 'text-orange-400' : 'text-sky-400'}`}>
          {isAboveAvg ? '▲ Above league average' : '▼ Below league average'}
        </p>
      </div>
    </div>
  );
};

const EfficiencyRadarChart = ({ playerId }) => {
  const [allSeasonsData, setAllSeasonsData] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State and ref for custom dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse rates/percentages into 0-100 scale
  const parseRate = (val) => {
    if (val == null) return 0;
    if (val > 1) return Math.round(val);
    if (val < 0.05) return Number((val * 10000).toFixed(1));
    return Number((val * 100).toFixed(1));
  };

  // Helper to structure chart data from a raw metric record
  const buildChartData = (metricRecord) => {
    if (!metricRecord) return [];
    return [
      {
        metric: 'Usage Rate',
        player: parseRate(metricRecord.usageRate),
        leagueAvg: LEAGUE_AVERAGES.usageRate,
        description: '% of team plays used while on floor',
      },
      {
        metric: 'True Shooting %',
        player: parseRate(metricRecord.trueShootingPct),
        leagueAvg: LEAGUE_AVERAGES.trueShootingPct,
        description: 'Overall scoring efficiency (2PT, 3PT, FT)',
      },
      {
        metric: 'Effective FG %',
        player: parseRate(metricRecord.effectiveFgPct),
        leagueAvg: LEAGUE_AVERAGES.effectiveFgPct,
        description: 'Field goal % adjusted for extra 3PT value',
      },
      {
        metric: 'Assist Rate',
        player: parseRate(metricRecord.assistRate),
        leagueAvg: LEAGUE_AVERAGES.assistRate,
        description: '% of teammate FGs assisted while on floor',
      },
      {
        metric: 'Rebound Rate',
        player: parseRate(metricRecord.reboundRate),
        leagueAvg: LEAGUE_AVERAGES.reboundRate,
        description: '% of available rebounds grabbed while on floor',
      },
    ];
  };

  // Fetch metrics list from API
  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      setAllSeasonsData([]);
      return;
    }

    let isMounted = true;

    const fetchAdvancedMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await playerService.getAdvancedMetrics(playerId);
        const rawData = response.data;

        if (!isMounted) return;

        if (Array.isArray(rawData) && rawData.length > 0) {
          setAllSeasonsData(rawData);
          const latest = rawData[rawData.length - 1];
          setSelectedSeasonId(latest.seasonId || latest.id);
          setChartData(buildChartData(latest));
        } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
          setAllSeasonsData([rawData]);
          setSelectedSeasonId(rawData.seasonId || rawData.id || 'Current');
          setChartData(buildChartData(rawData));
        } else {
          setAllSeasonsData([]);
          setChartData([]);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load advanced metrics:', err);
          setError('Failed to load advanced metrics');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdvancedMetrics();

    return () => {
      isMounted = false;
    };
  }, [playerId]);

  // Select a season, update chart, and remove focus state instantly
  const handleSelectSeason = (seasonKey) => {
    setSelectedSeasonId(seasonKey);
    setIsDropdownOpen(false);

    const selectedRecord = allSeasonsData.find(
      (item) => (item.seasonId || item.id) === seasonKey
    );

    if (selectedRecord) {
      setChartData(buildChartData(selectedRecord));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-black rounded-2xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        <p className="text-xs text-zinc-500 font-mono mt-3">Loading performance profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-rose-400 py-12 bg-black rounded-2xl p-6">
        <p className="font-medium text-sm">{error}</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-black rounded-2xl text-zinc-500">
        <p className="text-sm font-medium">No advanced metrics available</p>
        <p className="text-xs text-zinc-600 mt-1">Run data pipeline to generate advanced metrics for this player.</p>
      </div>
    );
  }

  const getMetric = (name) => chartData.find((d) => d.metric === name)?.player || 0;
  const usg = getMetric('Usage Rate');
  const ts = getMetric('True Shooting %');
  const ast = getMetric('Assist Rate');
  const reb = getMetric('Rebound Rate');

  const selectedSeasonLabel = (() => {
    const found = allSeasonsData.find((s) => (s.seasonId || s.id) === selectedSeasonId);
    if (!found) return selectedSeasonId;
    return found.seasonId ? found.seasonId : `ID: ${String(found.id).slice(0, 8)}`;
  })();

  return (
    <div className="w-full bg-black rounded-2xl p-6 relative">
      
      {/* Header Container with Standardized Minimum Height */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-h-[42px]">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Efficiency vs Volume Profile
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Player metrics benchmarked against league baseline averages
          </p>
        </div>

        {/* Custom Rounded Dropdown Menu or Height Balance Container */}
        <div className="min-h-[32px] flex items-center">
          {allSeasonsData.length > 1 && (
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Season:</span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 text-xs font-mono rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all duration-150 focus:outline-none"
                >
                  <span>{selectedSeasonLabel}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Translucent Rounded Options Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/70 shadow-2xl z-50 overflow-hidden py-1">
                  {allSeasonsData.map((s) => {
                    const key = s.seasonId || s.id;
                    const label = s.seasonId ? s.seasonId : `ID: ${String(key).slice(0, 8)}`;
                    const isSelected = key === selectedSeasonId;

                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectSeason(key)}
                        className={`w-full text-left px-3.5 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-400 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <span className="text-orange-400 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Hover Insight Cards - Fixed Anchor Position */}
      <div className="flex flex-col gap-2.5 mt-4 md:mt-0 md:absolute md:top-24 md:right-6 md:w-60 z-10">
        {/* Primary Strength */}
        <div className="group relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/95 border border-orange-500/20 hover:border-orange-500/60 rounded-xl p-3 shadow-md hover:shadow-2xl hover:shadow-orange-500/10 backdrop-blur-sm hover:backdrop-blur-md opacity-50 hover:opacity-100 scale-[0.97] hover:scale-100 transition-all duration-300 ease-out cursor-pointer">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50 group-hover:bg-orange-500 transition-colors duration-300" />
          <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-orange-400/80 group-hover:text-orange-400 transition-colors block mb-0.5">
            Primary Strength
          </span>
          <p className="text-xs font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors leading-snug">
            {usg >= 28 && ts >= 58
              ? 'High-volume primary scorer with elite efficiency'
              : ts >= 60
              ? 'Elite scoring efficiency'
              : ast >= 25
              ? 'Primary playmaker and floor general'
              : reb >= 11
              ? 'High-impact glass cleaner'
              : 'Balanced offensive role'}
          </p>
        </div>

        {/* Focus Area */}
        <div className="group relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/95 border border-sky-500/20 hover:border-sky-500/60 rounded-xl p-3 shadow-md hover:shadow-2xl hover:shadow-sky-500/10 backdrop-blur-sm hover:backdrop-blur-md opacity-50 hover:opacity-100 scale-[0.97] hover:scale-100 transition-all duration-300 ease-out cursor-pointer">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-400/50 group-hover:bg-sky-400 transition-colors duration-300" />
          <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-sky-400/80 group-hover:text-sky-400 transition-colors block mb-0.5">
            Focus Area
          </span>
          <p className="text-xs font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors leading-snug">
            {ts < 52
              ? 'Below-average shooting efficiency'
              : ast < 10
              ? 'Low playmaking contribution'
              : usg < 15
              ? 'Low offensive involvement'
              : 'Consistent overall contribution'}
          </p>
        </div>
      </div>

      {/* 5-Point Radar Chart Container */}
      <div className="w-full h-80 sm:h-[420px] mt-4 md:mt-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#3f3f46" strokeWidth={1.2} />
            
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#f4f4f5', fontSize: 11, fontWeight: 700 }}
            />
            
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* League Baseline Line */}
            <Radar
              name="League Avg"
              dataKey="leagueAvg"
              stroke="#38bdf8"
              fill="#38bdf8"
              fillOpacity={0.12}
              strokeWidth={2}
              strokeDasharray="4 4"
            />

            {/* Primary Player Line */}
            <Radar
              name="Player"
              dataKey="player"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.4}
              strokeWidth={3}
            />

            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-zinc-300 font-semibold ml-1.5">{value}</span>}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default EfficiencyRadarChart;