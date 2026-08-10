import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EfficiencyChart = ({ seasons }) => {
    if (!seasons || seasons.length === 0) {
        return <div className="text-gray-500 text-center py-8">No efficiency data available</div>;
    }

    const data = [...seasons]
        .sort((a, b) => a.seasonId.localeCompare(b.seasonId))
        .map(season => ({
            season: season.seasonId,
            fgPct: season.fieldGoalPct ? (season.fieldGoalPct * 100).toFixed(1) : 0,
            threePct: season.threePointPct ? (season.threePointPct * 100).toFixed(1) : 0,
            ftPct: season.freeThrowPct ? (season.freeThrowPct * 100).toFixed(1) : 0,
        }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                    formatter={(value) => `${value}%`}
                    labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar 
                    dataKey="fgPct" 
                    fill="#3B82F6" 
                    name="FG%" 
                    radius={[4, 4, 0, 0]}
                />
                <Bar 
                    dataKey="threePct" 
                    fill="#10B981" 
                    name="3P%" 
                    radius={[4, 4, 0, 0]}
                />
                <Bar 
                    dataKey="ftPct" 
                    fill="#F59E0B" 
                    name="FT%" 
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default EfficiencyChart;