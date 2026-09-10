import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { hexbin } from 'd3-hexbin';

// Custom Glassmorphic Tooltip
const CustomTooltip = ({ tooltipData }) => {
  if (!tooltipData) return null;

  const { x, y, total, made, pct } = tooltipData;
  const pctDisplay = (pct * 100).toFixed(1);

  return (
    <div
      className="fixed z-50 pointer-events-none bg-black/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3 shadow-2xl text-xs font-mono max-w-xs text-left transition-all duration-75"
      style={{
        left: `${x + 12}px`,
        top: `${y - 40}px`,
      }}
    >
      <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] mb-1">
        Shot Sector Details
      </p>

      <div className="flex items-baseline gap-3 my-1 font-sans">
        <span className="text-2xl font-extrabold text-orange-500">{pctDisplay}%</span>
        <span className="text-xs text-zinc-300 font-mono">({made}/{total} FG)</span>
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-4 font-sans text-zinc-400 text-[11px]">
        <span>Attempt Volume:</span>
        <span className="font-mono font-bold text-zinc-200">{total} shots</span>
      </div>
    </div>
  );
};

const HexagonalShotChart = ({ shots = [], playerName, season }) => {
  const svgRef = useRef();
  const dropdownRef = useRef();

  const [selectedSeason, setSelectedSeason] = useState(season || '2025-26');
  const [seasons, setSeasons] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);

  // Extract available seasons from incoming shot data
  useEffect(() => {
    if (shots && shots.length > 0) {
      const uniqueSeasons = [...new Set(shots.map((s) => s.seasonId || s.season))].filter(Boolean).sort();
      setSeasons(uniqueSeasons);

      if (!uniqueSeasons.includes(selectedSeason) && uniqueSeasons.length > 0) {
        setSelectedSeason(uniqueSeasons[uniqueSeasons.length - 1]);
      }
    }
  }, [shots]);

  // Handle dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main D3 Rendering Pipeline
  useEffect(() => {
    if (!shots || shots.length === 0) return;

    const filteredShots = shots.filter(
      (s) => (s.seasonId || s.season) === selectedSeason
    );

    drawChart(filteredShots.length > 0 ? filteredShots : shots);
  }, [shots, selectedSeason]);

  const drawChart = (filteredShots) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 470;

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', '#000000');

    // Court bounds & aspect container
    const courtWidth = 470;
    const courtHeight = 440;
    const courtX = (width - courtWidth) / 2;
    const courtY = (height - courtHeight) / 2;

    const courtGroup = svg
      .append('g')
      .attr('transform', `translate(${courtX}, ${courtY})`);

    // Draw dark minimalist court vector lines
    drawCourt(courtGroup, courtWidth, courtHeight);

    // Normalize court scales (NBA standard feet/coordinates scale)
    const xScale = d3
      .scaleLinear()
      .domain([-250, 250])
      .range([10, courtWidth - 10]);

    const yScale = d3
      .scaleLinear()
      .domain([-50, 420])
      .range([courtHeight - 10, 10]);

    // Valid coordinate filtering
    const validShots = filteredShots.filter(
      (s) => (s.locX ?? s.x) !== null && (s.locY ?? s.y) !== null
    );

    if (validShots.length === 0) {
      courtGroup
        .append('text')
        .attr('x', courtWidth / 2)
        .attr('y', courtHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#71717a')
        .style('font-family', 'ui-monospace, monospace')
        .style('font-size', '13px')
        .text('No shot location data available');
      return;
    }

    // Configure Hexbin Generator
    const hexbinGenerator = hexbin()
      .x((d) => xScale(d.locX ?? d.x))
      .y((d) => yScale(d.locY ?? d.y))
      .radius(14);

    const hexData = validShots.map((d) => ({
      locX: d.locX ?? d.x,
      locY: d.locY ?? d.y,
      made: d.shotMade === 1 || d.made === true || d.isMake === true,
    }));

    const bins = hexbinGenerator(hexData);

    const binData = bins.map((bin) => {
      const total = bin.length;
      const made = bin.filter((d) => d.made).length;
      return {
        x: bin.x,
        y: bin.y,
        total,
        made,
        pct: total > 0 ? made / total : 0,
      };
    });

    // Color interpolation matching style scale (Sky Blue -> Zinc -> Deep Orange)
    const colorScale = d3
      .scaleSequential()
      .domain([0.25, 0.65])
      .interpolator(
        d3.interpolateRgbBasis([
          '#0284c7', // Sky blue (<35%)
          '#38bdf8',
          '#a1a1aa', // Neutral zinc (~42-45%)
          '#fb923c',
          '#f97316', // Elite orange (55%+)
        ])
      );

    // Render Binned Hexagons
    courtGroup
      .selectAll('.hex-cell')
      .data(binData)
      .enter()
      .append('path')
      .attr('class', 'hex-cell')
      .attr('d', hexbinGenerator.hexagon())
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('fill', (d) => colorScale(d.pct))
      .attr('stroke', '#000000')
      .attr('stroke-width', 1)
      .attr('opacity', (d) => (d.total > 1 ? 0.9 : 0.45))
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease')
      .on('mousemove', (event, d) => {
        d3.select(event.currentTarget)
          .attr('opacity', 1)
          .attr('stroke', '#f97316')
          .attr('stroke-width', 2);

        setTooltipData({
          x: event.clientX,
          y: event.clientY,
          total: d.total,
          made: d.made,
          pct: d.pct,
        });
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget)
          .attr('opacity', d.total > 1 ? 0.9 : 0.45)
          .attr('stroke', '#000000')
          .attr('stroke-width', 1);

        setTooltipData(null);
      });

    // Render Raw Shot Location Points
    courtGroup
      .selectAll('.shot-dot')
      .data(validShots.slice(0, 1500))
      .enter()
      .append('circle')
      .attr('class', 'shot-dot')
      .attr('cx', (d) => xScale(d.locX ?? d.x))
      .attr('cy', (d) => yScale(d.locY ?? d.y))
      .attr('r', 1.2)
      .attr('pointer-events', 'none')
      .attr('fill', (d) =>
        d.shotMade || d.made ? 'rgba(249, 115, 22, 0.4)' : 'rgba(56, 189, 248, 0.25)'
      );

    // Summary Statistics Header Banner
    const totalShots = validShots.length;
    const madeShots = validShots.filter((d) => d.shotMade || d.made).length;
    const fgPct = ((madeShots / totalShots) * 100).toFixed(1);

    const statsGroup = svg
      .append('g')
      .attr('transform', `translate(20, ${height - 15})`);

    statsGroup
      .append('text')
      .attr('fill', '#a1a1aa')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '11px')
      .text(`${totalShots} shots • ${fgPct}% FG overall`);
  };

  const drawCourt = (group, width, height) => {
    // Outer Border
    group
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#000000')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1.5)
      .attr('rx', 8);

    // Key / Paint area
    group
      .append('rect')
      .attr('x', width / 2 - 80)
      .attr('y', 0)
      .attr('width', 160)
      .attr('height', 190)
      .attr('fill', 'none')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1.5);

    // Free throw arc
    const ftArc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(60)
      .startAngle(Math.PI / 2)
      .endAngle((3 * Math.PI) / 2);

    group
      .append('path')
      .attr('d', ftArc)
      .attr('transform', `translate(${width / 2}, 190)`)
      .attr('fill', 'none')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    // 3-Point Line Arc
    group
      .append('path')
      .attr(
        'd',
        `M 40 0 L 40 140 A 220 220 0 0 0 ${width - 40} 140 L ${width - 40} 0`
      )
      .attr('fill', 'none')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1.5);

    // Rim
    group
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', 40)
      .attr('r', 7)
      .attr('fill', 'none')
      .attr('stroke', '#f97316')
      .attr('stroke-width', 2);

    // Backboard
    group
      .append('line')
      .attr('x1', width / 2 - 30)
      .attr('y1', 28)
      .attr('x2', width / 2 + 30)
      .attr('y2', 28)
      .attr('stroke', '#52525b')
      .attr('stroke-width', 3);
  };

  return (
    <div className="w-full bg-black rounded-2xl p-6 relative select-none">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {playerName ? `${playerName}'s Shot Chart` : 'Shot Efficiency Matrix'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hexagon density & field goal efficiency scale
          </p>
        </div>

        {/* Custom Season Dropdown */}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                    {s === selectedSeason && <span className="text-orange-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SVG Canvas Stage */}
      <div className="w-full flex justify-center items-center relative overflow-hidden my-2">
        <svg ref={svgRef} className="w-full max-w-2xl h-auto" />
        <CustomTooltip tooltipData={tooltipData} />
      </div>

      {/* Footer Legend */}
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
              <span className="w-2.5 h-2.5 rounded-sm bg-[#a1a1aa]" /> Avg
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#fb923c]" /> 48-55%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316]" /> 55%+
            </span>
          </div>
        </div>

        <div className="text-zinc-500 text-[11px]">
          Hover hexagon for precise FG totals
        </div>
      </div>
    </div>
  );
};

export default HexagonalShotChart;