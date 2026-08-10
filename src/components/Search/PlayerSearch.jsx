import React, { useState, useEffect, useCallback } from 'react';
import { playerService } from '../../services/api';

const PlayerSearch = ({ onPlayerSelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                searchPlayers(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const formatPosition = (position) => {
        if (!position) return 'N/A';
        // Remove any numbers or extra hyphens
        return position.replace(/[0-9#-]/g, '').trim() || 'N/A';
    };

    const searchPlayers = async (searchQuery) => {
        setLoading(true);
        try {
            const response = await playerService.searchPlayers(searchQuery);
            setSuggestions(response.data);
            setIsOpen(true);
        } catch (error) {
            console.error('Search error:', error);
            setSuggestions([]);
        }
        setLoading(false);
    };

    const handleSelect = (player) => {
        setSelectedPlayer(player);
        setQuery(player.name);
        setSuggestions([]);
        setIsOpen(false);
        onPlayerSelect(player);
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (e.target.value === '') {
            setSelectedPlayer(null);
            onPlayerSelect(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            <div className="relative">
                <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-blue-500 transition-colors bg-white">
                    <span className="pl-3 text-gray-400 text-lg">🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        placeholder="Search for an NBA player..."
                        className="w-full px-3 py-3 outline-none bg-transparent text-gray-700 placeholder-gray-400"
                    />
                    {loading && (
                        <span className="pr-3 text-gray-400">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {suggestions.map((player) => (
                        <div
                            key={player.id}
                            onClick={() => handleSelect(player)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-gray-800">{player.name}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {player.team || 'NBA'}  {/* ✅ Now shows abbreviation */}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    {formatPosition(player.position)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.length >= 2 && suggestions.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No players found matching "{query}"
                </div>
            )}
        </div>
    );
};

export default PlayerSearch;