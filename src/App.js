import React, { useState } from 'react';
import PlayerSearch from './components/Search/PlayerSearch';
import PlayerDashboard from './components/Dashboard/PlayerDashboard';

function App() {
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🏒</span>
                        <h1 className="text-2xl font-bold text-gray-800">Hockey Assist</h1>
                        <span className="text-sm text-gray-400 ml-2">NBA Analytics</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <PlayerSearch onPlayerSelect={setSelectedPlayer} />
                </div>
                <PlayerDashboard player={selectedPlayer} />
            </main>

            <footer className="bg-white border-t border-gray-200 mt-12 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    Built with 🏀 React • TailwindCSS • Recharts • Spring Boot • PostgreSQL • Kafka • Redis
                </div>
            </footer>
        </div>
    );
}

export default App;