import React, { useState, useEffect, useRef } from 'react';
import { playerService } from '../../services/api';

const PlayerSearch = ({ onPlayerSelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown AND handle dashboard removal on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                
                // If the user clicked outside and the search bar is empty, clear the selection
                if (query.trim() === '') {
                    setSelectedPlayer(null);
                    onPlayerSelect(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [query, onPlayerSelect]);

    // Debounced search
    useEffect(() => {
        if (selectedPlayer && query === selectedPlayer.name) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length >= 2) {
                searchPlayers(query);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, selectedPlayer]);

    const formatPosition = (position) => {
        if (!position) return 'N/A';

        // Map common combined or camelCase position strings to clean slash format
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

        // Normalize input (lowercase, trimmed)
        const normalized = position.toString().trim().toLowerCase();

        // Check if direct match exists in map
        if (positionMap[normalized]) {
            return positionMap[normalized];
        }

        // Handle CamelCase/Merged strings like GuardForward or ForwardCenter dynamically
        const formattedCamelCase = position
            .replace(/([a-z])([A-Z])/g, '$1/$2') // Insert slash between CamelCase words
            .replace(/[-_]+/g, '/')              // Convert hyphens or underscores to slashes
            .replace(/[0-9#]/g, '')             // Strip numbers or hashes
            .trim();

        return formattedCamelCase || 'N/A';
    };

    const searchPlayers = async (searchQuery) => {
        setLoading(true);
        try {
            const response = await playerService.searchPlayers(searchQuery);
            if (response.data && response.data.length > 0) {
                setSuggestions(response.data);
                setIsOpen(true);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSuggestions([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (player) => {
        setSelectedPlayer(player);
        setQuery(player.name);
        setSuggestions([]);
        setIsOpen(false);
        onPlayerSelect(player);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // DO NOT reset `selectedPlayer` here when `value === ''`.
        // We leave `selectedPlayer` intact so the dashboard stays visible while editing.
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="w-full max-w-2xl mx-auto relative">
            <div className="relative">
                <div className="flex items-center border border-zinc-200 focus-within:border-orange-500/80 focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl transition-all duration-200 bg-zinc-50/50 shadow-sm hover:border-zinc-300">
                    <span className="pl-4 text-zinc-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0 && (!selectedPlayer || query !== selectedPlayer.name)) {
                                setIsOpen(true);
                            }
                        }}
                        placeholder="Search for an NBA player..."
                        className="w-full px-3 py-3.5 outline-none bg-transparent text-zinc-900 placeholder-zinc-400 font-medium text-sm sm:text-base"
                    />
                    {loading && (
                        <span className="pr-4 text-orange-500">
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
                <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-80 overflow-y-auto divide-y divide-zinc-100">
                    {suggestions.map((player) => (
                        <div
                            key={player.id || player.nbaPlayerId}
                            onClick={() => handleSelect(player)}
                            className="px-4 py-3 hover:bg-orange-50/60 cursor-pointer transition-colors duration-150 group"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-semibold text-zinc-900 group-hover:text-orange-900 transition-colors">
                                        {player.name}
                                    </span>
                                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 group-hover:text-orange-600/80">
                                        {player.team || 'NBA'}
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-100 group-hover:bg-orange-100/70 group-hover:text-orange-700 px-2.5 py-1 rounded-md transition-colors">
                                    {formatPosition(player.position)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlayerSearch;