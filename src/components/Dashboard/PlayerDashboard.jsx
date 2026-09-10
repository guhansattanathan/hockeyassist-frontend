import React, { useEffect, useState, useRef } from 'react';
import { playerService } from '../../services/api';
import CareerTrajectory from '../Charts/CareerTrajectory';
import EfficiencyChart from '../Charts/EfficiencyChart';
import SeasonAveragesChart from '../Charts/SeasonAveragesChart';
import GamesPlayedChart from '../Charts/GamesPlayedChart';
import EfficiencyRadarChart from '../Charts/EfficiencyRadarChart';
import HexagonalShotChart from '../Charts/HexagonalShotChart'; // 1. Import Shot Chart

// Basketball & Analytics SVG Icons
const Icons = {
  Basketball: ({ className = "w-5 h-5 text-zinc-400" }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M5.6 5.6C9.2 9.2 14.8 9.2 18.4 5.6" />
      <path d="M5.6 18.4C9.2 14.8 14.8 14.8 18.4 18.4" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  Rebounds: ({ className = "w-5 h-5 text-zinc-400" }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  Target: ({ className = "w-5 h-5 text-zinc-400" }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5 text-zinc-400" }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

// Custom Hook for Animated Counting
const useCountUp = (endValue, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrameId;

    const parsedTarget = Number(endValue);
    const target = !isNaN(parsedTarget) ? parsedTarget : 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 2);

      setCount(Math.floor(easeOutProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return count;
};

// Stat Card Component
const StatCard = ({ label, value, Icon, accentIcon = false }) => {
  const animatedValue = useCountUp(value, 1000);
  const [isHovered, setIsHovered] = useState(false);

  const iconColorClass = isHovered 
    ? 'text-orange-400' 
    : accentIcon 
      ? 'text-orange-500' 
      : 'text-zinc-400';

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white hover:bg-zinc-900 border border-zinc-200/80 hover:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-default transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono font-medium text-zinc-500 group-hover:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
          {label}
        </span>
        <div className="p-1.5 bg-zinc-50 group-hover:bg-zinc-800 rounded-lg border border-zinc-100 group-hover:border-zinc-700/60 flex items-center justify-center transition-all duration-300">
          <Icon className={`w-5 h-5 transition-colors duration-300 ${iconColorClass}`} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 group-hover:text-white tracking-tight font-mono transition-colors duration-300">
        {animatedValue.toLocaleString()}
      </p>
    </div>
  );
};

const PlayerDashboard = ({ player }) => {
  const [seasons, setSeasons] = useState([]);
  const [seasonAverages, setSeasonAverages] = useState([]);
  const [careerTotals, setCareerTotals] = useState(null);
  const [shotData, setShotData] = useState([]); // 2. State for Shot Chart Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bannerRef = useRef(null);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    bannerRef.current.style.setProperty('--mouse-x', `${x}px`);
    bannerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  useEffect(() => {
    let isCancelled = false;

    if (!player) {
      setLoading(false);
      return;
    }

    const fetchPlayerData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch player seasons, averages, career totals, and shot locations in parallel
        const [seasonsRes, averagesRes, totalsRes, shotsRes] = await Promise.all([
          playerService.getPlayerSeasons(player.nbaPlayerId),
          playerService.getPlayerSeasonsAverages(player.nbaPlayerId),
          playerService.getCareerTotals(player.nbaPlayerId),
          // Fetch shot chart locations if endpoint exists, or fallback gracefully
          playerService.getPlayerShots ? playerService.getPlayerShots(player.nbaPlayerId) : Promise.resolve({ data: [] }),
        ]);

        if (!isCancelled) {
          setSeasons(seasonsRes.data || []);
          setSeasonAverages(averagesRes.data || []);
          setCareerTotals(totalsRes.data || null);
          setShotData(shotsRes.data || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.message || err.message);
          console.error('Error fetching player data:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlayerData();

    return () => {
      isCancelled = true;
    };
  }, [player]);

  if (!player) {
    return (
      <div className="text-center py-24 px-4 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/60 text-orange-600 flex items-center justify-center mx-auto mb-3">
          <Icons.Basketball className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900">No Player Selected</h3>
        <p className="text-sm text-zinc-500 mt-1">Search for an NBA player above to view detailed career analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent"></div>
        <p className="mt-3 text-sm font-medium text-zinc-500">Retrieving player analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 px-4 max-w-md mx-auto">
        <div className="p-6 bg-red-50/50 border border-red-200/80 rounded-2xl">
          <p className="text-sm font-medium text-red-700">Error loading player data</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatPosition = (position) => {
    if (!position) return 'N/A';
    const posStr = String(position);

    const positionMap = {
      'guardforward': 'Guard/Forward',
      'forwardcenter': 'Forward/Center',
      'centerforward': 'Center/Forward',
      'forwardguard': 'Forward/Guard',
      'guard-forward': 'Guard/Forward',
      'forward-center': 'Forward/Center',
      'center-forward': 'Center/Forward',
      'forward-guard': 'Forward/Guard',
      'g-f': 'Guard/Forward',
      'f-c': 'Forward/Center',
      'c-f': 'Center/Forward',
      'f-g': 'Forward/Guard',
      'g': 'Guard',
      'f': 'Forward',
      'c': 'Center'
    };

    const normalized = posStr.trim().toLowerCase();
    if (positionMap[normalized]) return positionMap[normalized];

    return posStr
      .replace(/([a-z])([A-Z])/g, '$1/$2')
      .replace(/[-_]+/g, '/')
      .replace(/[0-9#]/g, '')
      .trim() || 'N/A';
  };

  const getTeamDisplay = () => player.team || 'NBA';

  return (
    <div className="space-y-8 mt-4">
      {/* Player Profile Header Banner */}
      <div 
        ref={bannerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsBannerHovered(true)}
        onMouseLeave={() => setIsBannerHovered(false)}
        className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-xl relative overflow-hidden group cursor-default"
      >
        <div 
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: isBannerHovered ? 1 : 0,
            background: 'radial-gradient(450px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(249, 115, 22, 0.18), transparent 80%)',
          }}
        />

        <div 
          className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl transition-opacity duration-300" 
          style={{ opacity: isBannerHovered ? 0 : 1 }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl overflow-hidden shadow-md border border-zinc-700/60 shrink-0 flex items-center justify-center">
            <img 
              src={player.headshotUrl || '/default-avatar.png'} 
              alt={player.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
          </div>
          
          <div className="flex-1">
            <h1 className="font-serif-header text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {player.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-sm font-medium">
              <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {getTeamDisplay()}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-mono text-xs">{formatPosition(player.position)}</span>
            </div>
            {player.teamName && (
              <p className="text-xs text-zinc-400 mt-2 font-medium">{player.teamName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Career Stats Summary */}
      {careerTotals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Points" 
            value={careerTotals.totalPoints || 0} 
            Icon={Icons.Basketball}
            accentIcon={true}
          />
          <StatCard 
            label="Rebounds" 
            value={careerTotals.totalRebounds || 0} 
            Icon={Icons.Rebounds}
          />
          <StatCard 
            label="Assists" 
            value={careerTotals.totalAssists || 0} 
            Icon={Icons.Target}
          />
          <StatCard 
            label="Seasons" 
            value={careerTotals.totalSeasons || 0} 
            Icon={Icons.Calendar}
          />
        </div>
      )}

      {/* Visual Analytics & Charts Section */}
      {(seasons.length > 0 || seasonAverages.length > 0) && (
        <div className="grid grid-cols-1 gap-8">
          {/* 3. Render Hexagonal Shot Chart */}
          <HexagonalShotChart 
            shots={shotData} 
            playerName={player.name} 
          />

          <CareerTrajectory seasons={seasons} />
          <SeasonAveragesChart seasons={seasonAverages.length > 0 ? seasonAverages : seasons} />
          <GamesPlayedChart seasons={seasons} />
          <EfficiencyChart seasons={seasons} />
          <EfficiencyRadarChart playerId={player.nbaPlayerId} />
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;