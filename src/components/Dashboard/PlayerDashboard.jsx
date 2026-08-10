import React, { useEffect, useState } from 'react';
import { playerService } from '../../services/api';
import CareerTrajectory from '../Charts/CareerTrajectory';
import EfficiencyChart from '../Charts/EfficiencyChart';

const PlayerDashboard = ({ player }) => {
    const [seasons, setSeasons] = useState([]);
    const [careerTotals, setCareerTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!player) {
            setLoading(false);
            return;
        }

        const fetchPlayerData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [seasonsRes, totalsRes] = await Promise.all([
                    playerService.getPlayerSeasons(player.nbaPlayerId),
                    playerService.getCareerTotals(player.nbaPlayerId),
                ]);
                setSeasons(seasonsRes.data);
                setCareerTotals(totalsRes.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                console.error('Error fetching player data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerData();
    }, [player]);

    if (!player) {
        return (
            <div className="text-center text-gray-500 py-20">
                <span className="text-4xl block mb-4">🏀</span>
                <p>Search for a player above to see their dashboard</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading player data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-500">
                <p>Error loading data: {error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Format position: clean up any extra text
    const formatPosition = (position) => {
        if (!position) return 'N/A';
        // Remove any numbers or extra hyphens
        return position.replace(/[0-9#-]/g, '').trim() || 'N/A';
    };

    // Get team display name
    const getTeamDisplay = () => {
        if (player.team) {
            return player.team; // Now returns abbreviation (e.g., "BOS")
        }
        return 'NBA';
    };

    return (
        <div className="space-y-6 mt-8">
            {/* Player Profile Card - Clean Version */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                        {player.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-800">{player.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-gray-600 font-medium">{getTeamDisplay()}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600">{formatPosition(player.position)}</span>
                        </div>
                        {player.teamName && (
                            <p className="text-sm text-gray-400 mt-1">{player.teamName}</p>
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
                        icon="🏀"
                    />
                    <StatCard 
                        label="Rebounds" 
                        value={careerTotals.totalRebounds || 0} 
                        icon="📊"
                    />
                    <StatCard 
                        label="Assists" 
                        value={careerTotals.totalAssists || 0} 
                        icon="🎯"
                    />
                    <StatCard 
                        label="Seasons" 
                        value={careerTotals.totalSeasons || 0} 
                        icon="📅"
                    />
                </div>
            )}

            {/* Charts */}
            {seasons.length > 0 && (
                <>
                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            📈 Career Trajectory
                        </h2>
                        <CareerTrajectory seasons={seasons} />
                    </div>

                    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            🎯 Shooting Efficiency
                        </h2>
                        <EfficiencyChart seasons={seasons} />
                    </div>
                </>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, icon }) => (
    <div className="bg-white shadow rounded-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">
            {value.toLocaleString()}
        </p>
        <span className="text-lg">{icon}</span>
    </div>
);

export default PlayerDashboard;