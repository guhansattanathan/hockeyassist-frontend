import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { playerService } from '../../services/api';

const AVAILABLE_SEASONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ player, pos }) => {
  if (!player || !pos) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-black/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl text-xs font-mono max-w-xs text-left"
      style={{
        left: `${pos.x + 14}px`,
        top: `${pos.y - 50}px`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-white font-bold tracking-tight text-sm font-sans">
          {player.displayName}
        </p>
        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded ml-auto">
          {player.team || 'NBA'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center font-sans">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase block font-mono">PPG</span>
          <span className="text-sm font-bold text-orange-400 font-mono">
            {player.ppg.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase block font-mono">RPG</span>
          <span className="text-sm font-bold text-sky-400 font-mono">
            {player.rpg.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase block font-mono">APG</span>
          <span className="text-sm font-bold text-purple-400 font-mono">
            {player.apg.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const TwoWayVennChart = ({ season: initialSeason = '2025-26', currentPlayerId }) => {
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [thresholds, setThresholds] = useState({ ppg: 18, rpg: 7, apg: 6 });
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const width = 640;
  const height = 500;
  const radius = 135;

  // Circle centers
  const centers = useMemo(
    () => ({
      scoring: {
        x: width / 2,
        y: height / 2 - 65,
        label: 'Scoring',
        color: '#f97316',
      },
      rebounding: {
        x: width / 2 - 75,
        y: height / 2 + 55,
        label: 'Rebounding',
        color: '#38bdf8',
      },
      playmaking: {
        x: width / 2 + 75,
        y: height / 2 + 55,
        label: 'Playmaking',
        color: '#c084fc',
      },
    }),
    [width, height]
  );

  // Click outside listener for the season selector
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch venn data ────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchVennData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await playerService.getTwoWayVenn(
          selectedSeason,
          thresholds.ppg,
          thresholds.rpg,
          thresholds.apg
        );

        if (!isMounted) return;

        const data = res?.data;
        setRawData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load Two-Way Venn data:', err);
        if (isMounted) {
          setError('Failed to load venn data');
          setRawData([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVennData();

    return () => {
      isMounted = false;
    };
  }, [selectedSeason, thresholds.ppg, thresholds.rpg, thresholds.apg]);

  // ── Sanitize: backend already sends per-game averages ─────────────────────
  const parsedPlayers = useMemo(() => {
    return rawData.map((p, idx) => {
      const displayName =
        p.name ||
        p.playerName ||
        p.player_name ||
        `Player ${idx + 1}`;

      const ppg = Number(p.pointsPerGame ?? 0);
      const rpg = Number(p.reboundsPerGame ?? 0);
      const apg = Number(p.assistsPerGame ?? 0);

      const id = String(p.nbaPlayerId ?? idx);

      return {
        ...p,
        id,
        displayName,
        ppg: isNaN(ppg) ? 0 : ppg,
        rpg: isNaN(rpg) ? 0 : rpg,
        apg: isNaN(apg) ? 0 : apg,
        isCurrent: id === String(currentPlayerId),
      };
    });
  }, [rawData, currentPlayerId]);

  // ── Categorize and lay out with d3-force ──────────────────────────────────
  const { nodes, counts, unassignedCount } = useMemo(() => {
    const qualified = [];
    let unassigned = 0;
    const c = { scoring: 0, rebounding: 0, playmaking: 0, tripleThreat: 0 };

    parsedPlayers.forEach((p) => {
      const hasS = p.ppg >= thresholds.ppg;
      const hasR = p.rpg >= thresholds.rpg;
      const hasA = p.apg >= thresholds.apg;

      if (!hasS && !hasR && !hasA) {
        unassigned++;
        return;
      }

      let tx = width / 2;
      let ty = height / 2;

      if (hasS && hasR && hasA) {
        tx = width / 2;
        ty = height / 2 + 15;
        c.tripleThreat++;
      } else if (hasS && hasR) {
        tx = width / 2 - 45;
        ty = height / 2 - 10;
      } else if (hasS && hasA) {
        tx = width / 2 + 45;
        ty = height / 2 - 10;
      } else if (hasR && hasA) {
        tx = width / 2;
        ty = height / 2 + 85;
      } else if (hasS) {
        tx = centers.scoring.x;
        ty = centers.scoring.y - 45;
        c.scoring++;
      } else if (hasR) {
        tx = centers.rebounding.x - 40;
        ty = centers.rebounding.y + 30;
        c.rebounding++;
      } else if (hasA) {
        tx = centers.playmaking.x + 40;
        ty = centers.playmaking.y + 30;
        c.playmaking++;
      }

      qualified.push({ ...p, targetX: tx, targetY: ty });
    });

    const simNodes = qualified.map((d) => ({
      ...d,
      x: d.targetX + (Math.random() - 0.5) * 8,
      y: d.targetY + (Math.random() - 0.5) * 8,
    }));

    const simulation = d3
      .forceSimulation(simNodes)
      .force('x', d3.forceX((d) => d.targetX).strength(0.45))
      .force('y', d3.forceY((d) => d.targetY).strength(0.45))
      .force('collide', d3.forceCollide((d) => (d.isCurrent ? 8.5 : 5.5)))
      .stop();

    for (let i = 0; i < 90; ++i) simulation.tick();

    return { nodes: simNodes, counts: c, unassignedCount: unassigned };
  }, [parsedPlayers, thresholds, centers, width, height]);

  const activeHoveredPlayer = useMemo(
    () => nodes.find((n) => n.id === hoveredPlayerId),
    [nodes, hoveredPlayerId]
  );

  const handleThresholdChange = (key, delta) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: Math.max(0, Number((prev[key] + delta).toFixed(1))),
    }));
  };

  return (
    <div className="w-full bg-black rounded-2xl p-6 relative select-none border border-zinc-800 shadow-2xl">
      {/* ── Header + Controls ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Multi-Threat Archetype Distribution
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Player classification across scoring, rebounding, and playmaking thresholds
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Season dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 text-xs font-mono rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all focus:outline-none"
            >
              <span>{selectedSeason}</span>
              <svg
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700/70 shadow-2xl z-50 overflow-hidden py-1">
                {AVAILABLE_SEASONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSelectedSeason(s);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                      s === selectedSeason
                        ? 'bg-orange-500/20 text-orange-400 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <span>{s}</span>
                    {s === selectedSeason && (
                      <span className="text-orange-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stepper controls */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {/* PPG */}
            <div className="flex items-center bg-zinc-900 border border-orange-500/30 rounded-xl px-2 py-1 gap-1">
              <span className="text-orange-400 font-bold mr-1">PPG ≥</span>
              <button
                onClick={() => handleThresholdChange('ppg', -1)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                -
              </button>
              <span className="text-white font-bold w-6 text-center">
                {thresholds.ppg}
              </span>
              <button
                onClick={() => handleThresholdChange('ppg', 1)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                +
              </button>
            </div>

            {/* RPG */}
            <div className="flex items-center bg-zinc-900 border border-sky-500/30 rounded-xl px-2 py-1 gap-1">
              <span className="text-sky-400 font-bold mr-1">RPG ≥</span>
              <button
                onClick={() => handleThresholdChange('rpg', -0.5)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                -
              </button>
              <span className="text-white font-bold w-6 text-center">
                {thresholds.rpg}
              </span>
              <button
                onClick={() => handleThresholdChange('rpg', 0.5)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                +
              </button>
            </div>

            {/* APG */}
            <div className="flex items-center bg-zinc-900 border border-purple-500/30 rounded-xl px-2 py-1 gap-1">
              <span className="text-purple-400 font-bold mr-1">APG ≥</span>
              <button
                onClick={() => handleThresholdChange('apg', -0.5)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                -
              </button>
              <span className="text-white font-bold w-6 text-center">
                {thresholds.apg}
              </span>
              <button
                onClick={() => handleThresholdChange('apg', 0.5)}
                className="text-zinc-400 hover:text-white px-1 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SVG Stage ──────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center items-center relative overflow-hidden my-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
            <p className="text-xs text-zinc-500 font-mono mt-3">
              Evaluating archetype metrics for {selectedSeason}...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-80 text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-zinc-500">
            <p className="text-sm">No qualifying players for these thresholds</p>
            <p className="text-xs mt-2">
              Try lowering PPG, RPG, or APG thresholds
            </p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xl h-auto">
            {/* Venn circles */}
            <g>
              <circle
                cx={centers.scoring.x}
                cy={centers.scoring.y}
                r={radius}
                fill="#f97316"
                fillOpacity={0.06}
                stroke="#f97316"
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
              <circle
                cx={centers.rebounding.x}
                cy={centers.rebounding.y}
                r={radius}
                fill="#38bdf8"
                fillOpacity={0.06}
                stroke="#38bdf8"
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
              <circle
                cx={centers.playmaking.x}
                cy={centers.playmaking.y}
                r={radius}
                fill="#c084fc"
                fillOpacity={0.06}
                stroke="#c084fc"
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
            </g>

            {/* Category labels */}
            <g className="font-mono text-[11px] uppercase tracking-wider font-bold">
              <text
                x={centers.scoring.x}
                y={centers.scoring.y - radius - 8}
                fill="#f97316"
                textAnchor="middle"
              >
                Scoring ({thresholds.ppg}+)
              </text>
              <text
                x={centers.rebounding.x - 45}
                y={centers.rebounding.y + radius + 18}
                fill="#38bdf8"
                textAnchor="middle"
              >
                Rebounding ({thresholds.rpg}+)
              </text>
              <text
                x={centers.playmaking.x + 45}
                y={centers.playmaking.y + radius + 18}
                fill="#c084fc"
                textAnchor="middle"
              >
                Playmaking ({thresholds.apg}+)
              </text>
            </g>

            {/* Player nodes */}
            <g>
              {nodes.map((d) => {
                const isHovered = hoveredPlayerId === d.id;
                const r = d.isCurrent ? 7.5 : isHovered ? 6.5 : 4;
                const fill = d.isCurrent || isHovered ? '#f97316' : '#e4e4e7';
                const stroke = d.isCurrent || isHovered ? '#ffffff' : '#18181b';
                const strokeWidth = d.isCurrent || isHovered ? 2 : 1;

                return (
                  <circle
                    key={d.id}
                    cx={d.x}
                    cy={d.y}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={(e) => {
                      setHoveredPlayerId(d.id);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredPlayerId(null);
                      setTooltipPos(null);
                    }}
                  />
                );
              })}
            </g>
          </svg>
        )}

        <CustomTooltip player={activeHoveredPlayer} pos={tooltipPos} />
      </div>

      {/* ── Footer breakdown ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Triple-Threat:{' '}
            <strong className="text-white">{counts.tripleThreat}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            Qualifying:{' '}
            <strong className="text-white">{nodes.length}</strong>
          </span>
          {unassignedCount > 0 && (
            <span className="flex items-center gap-1.5 text-zinc-500">
              Below Thresholds:{' '}
              <strong className="text-zinc-400">{unassignedCount}</strong>
            </span>
          )}
        </div>

        <div className="text-[11px] text-zinc-500">
          Adjust thresholds with +/− or select a season
        </div>
      </div>
    </div>
  );
};

export default TwoWayVennChart;