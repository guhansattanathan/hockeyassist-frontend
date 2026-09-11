import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM GLASSMORPHIC TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ tooltipData }) => {
  if (!tooltipData) return null;

  const { x, y, title, total, made, pct } = tooltipData;
  const pctDisplay = (pct * 100).toFixed(1);

  return (
    <div
      className="fixed z-50 pointer-events-none bg-black/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl text-xs font-mono max-w-xs text-left transition-all duration-75"
      style={{
        left: `${x + 14}px`,
        top: `${y - 50}px`,
      }}
    >
      <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] mb-1">
        {title}
      </p>

      <div className="flex items-baseline gap-3 my-1 font-sans">
        <span className="text-2xl font-extrabold text-orange-500">{pctDisplay}%</span>
        <span className="text-xs text-zinc-300 font-mono">
          ({made}/{total} FG)
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-4 font-sans text-zinc-400 text-[11px]">
        <span>Volume:</span>
        <span className="font-mono font-bold text-zinc-200">{total} attempts</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOT ZONE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const SHOT_ZONES = [
  { id: 'restricted', name: 'Restricted Area' },
  { id: 'paint', name: 'In The Paint (Non-RA)' },
  { id: 'mid_left', name: 'Mid-Range (Left)' },
  { id: 'mid_center', name: 'Mid-Range (Center)' },
  { id: 'mid_right', name: 'Mid-Range (Right)' },
  { id: 'corner_3_left', name: 'Left Corner 3' },
  { id: 'corner_3_right', name: 'Right Corner 3' },
  { id: 'atb_3_left', name: 'Above Break 3 (Left)' },
  { id: 'atb_3_center', name: 'Above Break 3 (Center)' },
  { id: 'atb_3_right', name: 'Above Break 3 (Right)' },
  { id: 'backcourt', name: 'Backcourt' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED COORDINATE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
// NBA API court coordinates (from shotchartdetail):
//   Basket at origin (0, 0)
//   X: horizontal offset from basket (negative = right of basket, positive = left)
//   Y: distance from baseline toward half-court (0 at basket, ~470 at half-court)
//
// Pixel system (horizontal half-court display):
//   Canvas: 940 × 500
//   Left basket at pixel (52.5, 250)
//   Scale: 10px per foot
//
// Mapping (for a shot on the LEFT half):
//   pixelX = LEFT_BASKET_X + Y + 52.5   → moves right as Y increases
//   pixelY = BASKET_Y - X               → negate X because NBA X is +left
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 940;
const CANVAS_HEIGHT = 500;
const LEFT_BASKET_X = 52.5;
const BASKET_Y = 250;

const nbaToPixel = (nbaX, nbaY) => {
  const px = LEFT_BASKET_X + nbaY + 52.5;
  const py = BASKET_Y - nbaX;
  return [px, py];
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const HorizontalCourtChart = ({ shots = [], playerName, season }) => {
  const svgRef = useRef();
  const dropdownRef = useRef();

  const [selectedSeason, setSelectedSeason] = useState(season || '2025-26');
  const [viewMode, setViewMode] = useState('zones');
  const [seasons, setSeasons] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);

  // ── Extract available seasons ─────────────────────────────────────────────
  useEffect(() => {
    if (shots && shots.length > 0) {
      const uniqueSeasons = [
        ...new Set(shots.map((s) => s.seasonId || s.season)),
      ]
        .filter(Boolean)
        .sort();
      setSeasons(uniqueSeasons);

      if (!uniqueSeasons.includes(selectedSeason) && uniqueSeasons.length > 0) {
        setSelectedSeason(uniqueSeasons[uniqueSeasons.length - 1]);
      }
    }
  }, [shots]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Filter shots for selected season ──────────────────────────────────────
  const activeShots = useMemo(() => {
    if (!shots || shots.length === 0) return [];
    const filtered = shots.filter(
      (s) => (s.seasonId || s.season) === selectedSeason
    );
    return filtered.length > 0 ? filtered : shots;
  }, [shots, selectedSeason]);

  // ── Categorize each shot into a zone ──────────────────────────────────────
  const categorizeShot = (x, y) => {
    const d = Math.sqrt(x * x + y * y);

    if (y > 470) return 'backcourt';

    // Corner 3s (Y ≤ 88, |X| ≥ 220)
    if (y <= 88 && x <= -220) return 'corner_3_left';
    if (y <= 88 && x >= 220) return 'corner_3_right';

    // Above-the-break 3s (distance ≥ 237.5)
    if (d >= 237.5) {
      if (x < -80) return 'atb_3_left';
      if (x > 80) return 'atb_3_right';
      return 'atb_3_center';
    }

    // Paint (|X| ≤ 80, Y ≤ 190)
    if (Math.abs(x) <= 80 && y <= 190) {
      if (d <= 40) return 'restricted';
      return 'paint';
    }

    // Mid-range
    if (x < -80) return 'mid_left';
    if (x > 80) return 'mid_right';
    return 'mid_center';
  };

  // ── Redraw whenever shots or view mode changes ────────────────────────────
  useEffect(() => {
    drawHorizontalCourt();
  }, [activeShots, viewMode]);

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN DRAW FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  const drawHorizontalCourt = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`)
      .style('background', '#000000');

    // ── Filter valid shots ────────────────────────────────────────────────
    const validShots = activeShots.filter(
      (s) => (s.locX ?? s.x) != null && (s.locY ?? s.y) != null
    );

    // ── Aggregate zone stats ──────────────────────────────────────────────
    const zoneStats = {};
    SHOT_ZONES.forEach((z) => {
      zoneStats[z.id] = { ...z, total: 0, made: 0, pct: 0 };
    });

    validShots.forEach((shot) => {
      const x = Number(shot.locX ?? shot.x);
      const y = Number(shot.locY ?? shot.y);
      const made = Boolean(shot.shotMade ?? shot.made ?? shot.isMake);
      const zoneId = categorizeShot(x, y);

      if (zoneStats[zoneId]) {
        zoneStats[zoneId].total += 1;
        if (made) zoneStats[zoneId].made += 1;
      }
    });

    Object.keys(zoneStats).forEach((k) => {
      const z = zoneStats[k];
      z.pct = z.total > 0 ? z.made / z.total : 0;
    });

    // ── Color scale ───────────────────────────────────────────────────────
    const colorScale = d3
      .scaleSequential()
      .domain([0.3, 0.6])
      .interpolator(
        d3.interpolateRgbBasis([
          '#0284c7', // <35% cold blue
          '#38bdf8', // 35-42% blue
          '#52525b', // ~45% neutral zinc
          '#fb923c', // 48-54% orange
          '#f97316', // 55%+ hot orange
        ])
      );

    const courtGroup = svg.append('g').attr('class', 'court-base');

    // ── 1. Zone heatmap layer ─────────────────────────────────────────────
    if (viewMode === 'zones') {
      const zonesGroup = svg.append('g').attr('class', 'zones-layer');

      const describeArc = (cx, cy, radius, startAngle, endAngle) => {
        const startX = cx + radius * Math.cos(startAngle);
        const startY = cy + radius * Math.sin(startAngle);
        const endX = cx + radius * Math.cos(endAngle);
        const endY = cy + radius * Math.sin(endAngle);
        const largeArc = endAngle - startAngle <= Math.PI ? '0' : '1';
        return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
      };

      // Zone paths drawn in pixel space (basket at 52.5, 250)
      const zonePaths = [
        // Corner 3s
        { id: 'corner_3_left', d: 'M 0 0 L 140 0 L 140 30 L 0 30 Z' },
        { id: 'corner_3_right', d: 'M 0 470 L 140 470 L 140 500 L 0 500 Z' },

        // Above-the-break 3s
        {
          id: 'atb_3_left',
          d: 'M 140 0 L 470 0 L 470 170 L 255 170 A 237.5 237.5 0 0 0 140 30 Z',
        },
        {
          id: 'atb_3_center',
          d: 'M 470 170 L 470 330 L 255 330 A 237.5 237.5 0 0 0 255 170 Z',
        },
        {
          id: 'atb_3_right',
          d: 'M 140 500 L 470 500 L 470 330 L 255 330 A 237.5 237.5 0 0 1 140 470 Z',
        },

        // Mid-range
        {
          id: 'mid_left',
          d: 'M 0 30 L 140 30 A 237.5 237.5 0 0 1 255 170 L 242 170 L 242 190 L 0 190 Z',
        },
        {
          id: 'mid_right',
          d: 'M 0 310 L 242 310 L 242 330 L 255 330 A 237.5 237.5 0 0 1 140 470 L 0 470 Z',
        },
        {
          id: 'mid_center',
          d: 'M 242 170 L 255 170 A 237.5 237.5 0 0 1 255 330 L 242 330 L 242 170 Z',
        },

        // Paint
        { id: 'paint', d: 'M 0 190 L 242 190 L 242 310 L 0 310 Z' },

        // Restricted area
        {
          id: 'restricted',
          d: describeArc(52.5, 250, 40, -Math.PI / 2, Math.PI / 2),
        },
      ];

      zonePaths.forEach((zp) => {
        const stats = zoneStats[zp.id];
        const fill = stats.total > 0 ? colorScale(stats.pct) : '#18181b';
        const opacity = stats.total > 0 ? 0.45 : 0.15;

        zonesGroup
          .append('path')
          .attr('d', zp.d)
          .attr('fill', fill)
          .attr('fill-opacity', opacity)
          .attr('stroke', '#000000')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .style('transition', 'all 0.15s ease')
          .on('mousemove', (event) => {
            d3.select(event.currentTarget)
              .attr('fill-opacity', 0.8)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2)
              .raise();

            setTooltipData({
              x: event.clientX,
              y: event.clientY,
              title: stats.name,
              total: stats.total,
              made: stats.made,
              pct: stats.pct,
            });
          })
          .on('mouseleave', (event) => {
            d3.select(event.currentTarget)
              .attr('fill-opacity', opacity)
              .attr('stroke', '#000000')
              .attr('stroke-width', 1.5);

            setTooltipData(null);
          });
      });
    }

    // ── 2. Court markings (always drawn) ──────────────────────────────────
    drawFullCourtMarkings(courtGroup, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ── 3. Scatter layer ──────────────────────────────────────────────────
    if (viewMode === 'scatter') {
      const scatterGroup = svg.append('g').attr('class', 'scatter-layer');

      scatterGroup
        .selectAll('circle')
        .data(validShots)
        .enter()
        .append('circle')
        .attr('cx', (d) => nbaToPixel(Number(d.locX ?? d.x), Number(d.locY ?? d.y))[0])
        .attr('cy', (d) => nbaToPixel(Number(d.locX ?? d.x), Number(d.locY ?? d.y))[1])
        .attr('r', 2.8)
        .attr('fill', (d) =>
          Boolean(d.shotMade ?? d.made ?? d.isMake) ? '#f97316' : '#27272a'
        )
        .attr('stroke', (d) =>
          Boolean(d.shotMade ?? d.made ?? d.isMake) ? '#fb923c' : '#52525b'
        )
        .attr('stroke-width', 0.8)
        .attr('opacity', (d) =>
          Boolean(d.shotMade ?? d.made ?? d.isMake) ? 0.9 : 0.5
        );
    }

    // ── 4. Stats summary bar ──────────────────────────────────────────────
    const totalShots = validShots.length;
    const madeShots = validShots.filter((d) =>
      Boolean(d.shotMade ?? d.made ?? d.isMake)
    ).length;
    const fgPct =
      totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : '0.0';

    svg
      .append('text')
      .attr('x', 20)
      .attr('y', CANVAS_HEIGHT - 15)
      .attr('fill', '#a1a1aa')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '11px')
      .text(`${totalShots.toLocaleString()} total shots • ${fgPct}% FG`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FULL COURT MARKINGS (unchanged)
  // ─────────────────────────────────────────────────────────────────────────
  const drawFullCourtMarkings = (group, width, height) => {
    const lineStroke = '#3f3f46';
    const lineWidth = 1.4;

    // Court perimeter
    group
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('stroke', lineStroke)
      .attr('stroke-width', lineWidth)
      .attr('rx', 12);

    // Half-court line
    group
      .append('line')
      .attr('x1', width / 2)
      .attr('y1', 0)
      .attr('x2', width / 2)
      .attr('y2', height)
      .attr('stroke', lineStroke)
      .attr('stroke-width', lineWidth);

    // Center circle
    group
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 60)
      .attr('fill', 'none')
      .attr('stroke', lineStroke)
      .attr('stroke-width', lineWidth);

    // Inner center circle
    group
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 20)
      .attr('fill', 'none')
      .attr('stroke', lineStroke)
      .attr('stroke-width', 1);

    // Both halves (left and right)
    [0, 1].forEach((isRightSide) => {
      const halfGroup = group.append('g');
      if (isRightSide) {
        halfGroup.attr(
          'transform',
          `translate(${width}, ${height}) rotate(180)`
        );
      }

      // Paint area
      halfGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 250 - 80)
        .attr('width', 190)
        .attr('height', 160)
        .attr('fill', 'none')
        .attr('stroke', lineStroke)
        .attr('stroke-width', lineWidth);

      // Free throw arc (solid outer)
      const ftArc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(60)
        .startAngle(0)
        .endAngle(Math.PI);

      halfGroup
        .append('path')
        .attr('d', ftArc)
        .attr('transform', 'translate(190, 250)')
        .attr('fill', 'none')
        .attr('stroke', lineStroke)
        .attr('stroke-width', lineWidth);

      // Free throw arc (dashed inner)
      const ftDashedArc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(60)
        .startAngle(Math.PI)
        .endAngle(2 * Math.PI);

      halfGroup
        .append('path')
        .attr('d', ftDashedArc)
        .attr('transform', 'translate(190, 250)')
        .attr('fill', 'none')
        .attr('stroke', '#52525b')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4 4');

      // 3-point boundary
      const cornerLength = 140;
      const cornerDist = 220;
      const arcR = 237.5;

      const threePtPath = `
        M 0 ${250 - cornerDist}
        L ${cornerLength} ${250 - cornerDist}
        A ${arcR} ${arcR} 0 0 1 ${cornerLength} ${250 + cornerDist}
        L 0 ${250 + cornerDist}
      `;

      halfGroup
        .append('path')
        .attr('d', threePtPath)
        .attr('fill', 'none')
        .attr('stroke', lineStroke)
        .attr('stroke-width', lineWidth);

      // Restricted area arc
      const restrictedArc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(40)
        .startAngle(0)
        .endAngle(Math.PI);

      halfGroup
        .append('path')
        .attr('d', restrictedArc)
        .attr('transform', 'translate(52.5, 250)')
        .attr('fill', 'none')
        .attr('stroke', lineStroke)
        .attr('stroke-width', lineWidth);

      // Backboard
      halfGroup
        .append('line')
        .attr('x1', 40)
        .attr('y1', 250 - 30)
        .attr('x2', 40)
        .attr('y2', 250 + 30)
        .attr('stroke', '#a1a1aa')
        .attr('stroke-width', 3);

      // Rim
      halfGroup
        .append('circle')
        .attr('cx', 52.5)
        .attr('cy', 250)
        .attr('r', 7.5)
        .attr('fill', 'none')
        .attr('stroke', '#f97316')
        .attr('stroke-width', 2.2);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-black rounded-2xl p-6 relative select-none border border-zinc-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {playerName
              ? `${playerName}'s Shot Chart`
              : 'Shot Efficiency Matrix'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {viewMode === 'zones'
              ? 'Court partitioned by analytical shooting zones • Heatmap color indicates efficiency'
              : 'Full-court scatter trajectory (Orange = Make, Dark = Miss)'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mode switcher */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setViewMode('zones')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                viewMode === 'zones'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Zones
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                viewMode === 'scatter'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Scatter
            </button>
          </div>

          {/* Season dropdown */}
          {seasons.length > 1 && (
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
                  {seasons.map((s) => (
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
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full flex justify-center items-center relative overflow-hidden my-2 rounded-xl bg-black">
        <svg ref={svgRef} className="w-full h-auto max-h-[460px]" />
        <CustomTooltip tooltipData={tooltipData} />
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Efficiency:</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" /> &lt;35%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" /> 35-42%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#52525b]" /> Avg
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#fb923c]" /> 48-54%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316]" /> 55%+
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
          <span>Hover sectors for details</span>
        </div>
      </div>
    </div>
  );
};

export default HorizontalCourtChart;