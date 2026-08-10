import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CareerTrajectory = ({ seasons }) => {
    if (!seasons || seasons.length === 0) {
        return <div className="text-gray-500 text-center py-8">No season data available</div>;
    }

    const data = [...seasons]
        .sort((a, b) => a.seasonId.localeCompare(b.seasonId))
        .map(season => ({
            season: season.seasonId,
            points: season.points || 0,
            rebounds: season.rebounds || 0,
            assists: season.assists || 0,
        }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" />
                <YAxis />
                <Tooltip 
                    formatter={(value) => value.toLocaleString()}
                    labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Points"
                />
                <Line 
                    type="monotone" 
                    dataKey="rebounds" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Rebounds"
                />
                <Line 
                    type="monotone" 
                    dataKey="assists" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Assists"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default CareerTrajectory;