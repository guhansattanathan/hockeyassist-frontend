import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/stats`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const playerService = {
    // Get all players (for autocomplete)
    getAllPlayers: () => api.get('/players'),
    
    // Get player by NBA ID
    getPlayerById: (id) => api.get(`/players/${id}`),
    
    // Get player seasons
    getPlayerSeasons: (id) => api.get(`/players/${id}/seasons`),
    
    // Get career totals
    getCareerTotals: (id) => api.get(`/players/${id}/career`),
    
    // Get career averages
    getCareerAverages: (id) => api.get(`/players/${id}/averages`),
    
    // Search players
    searchPlayers: (query) => api.get(`/players/search?query=${query}`),
    
    // Get all teams
    getAllTeams: () => api.get('/teams'),
    
    // Get league leaders
    getLeagueLeaders: (season, stat, limit = 10) => 
        api.get(`/leaders/${season}/${stat}?limit=${limit}`),
    
    // Compare two players
    comparePlayers: (player1Id, player2Id) => 
        api.get(`/compare?player1=${player1Id}&player2=${player2Id}`),
};

export default api;