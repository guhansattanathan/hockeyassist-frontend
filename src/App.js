import React, { useState } from 'react';
import PlayerSearch from './components/Search/PlayerSearch';
import PlayerDashboard from './components/Dashboard/PlayerDashboard';
import './index.css';

function App() {
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    return (
        <div className="relative min-h-screen bg-white text-zinc-900 flex flex-col justify-between overflow-x-hidden">
            
            {/* Header: Styled with a light orange background tinge */}
            <header className="relative z-50 bg-orange-50/80 border-b border-orange-100 text-zinc-900 transition-all duration-300">
                <div className="w-full px-4 sm:px-8 py-4">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            
                            {/* Logo Box */}
                            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-orange-200/80 shadow-sm overflow-hidden transition-all duration-300 group-hover:border-zinc-900 group-hover:bg-zinc-900">
                                <img
                                    src="/basketball-player.png"
                                    alt="Hockey Assist Logo"
                                    className="w-6 h-6 object-contain transition-all duration-500 ease-out group-hover:invert group-hover:brightness-200 group-hover:scale-110 group-hover:-rotate-6"
                                />
                            </div>

                            {/* Serif Header Text */}
                            <h1 className="font-serif-header vibrant-hover-lift text-3xl sm:text-4xl font-bold tracking-wider text-zinc-900 group-hover:text-black transition-colors duration-200">
                                Hockey Assist
                            </h1>

                        </div>
                    </div>
                </div>
            </header>

            {/* Dark Hero Section */}
            <section className="relative border-b border-zinc-800/60 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-20 px-6 overflow-hidden text-zinc-100">
                
                {/* Primary Orange Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
                {/* Secondary Ambient Glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-zinc-700/10 blur-[140px] rounded-full pointer-events-none opacity-60" aria-hidden="true" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    
                    {/* Headline */}
                    <div className="group/headline inline-block cursor-pointer mb-7">
                        <h2 className="font-serif-header text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight transition-colors duration-500 group-hover/headline:text-zinc-200">
                            Analytics Visualized. <br className="hidden sm:inline" />
                            <span className="text-orange-400 font-normal italic transition-colors duration-500 group-hover/headline:text-orange-300">
                                Engineered for Precision.
                            </span>
                        </h2>
                    </div>

                    {/* Subtitle Card */}
                    <div className="subtitle-hover-box inline-block rounded-2xl px-6 py-4 cursor-pointer max-w-2xl mx-auto border border-transparent hover:border-orange-500/20 transition-all duration-300">
                        <p className="font-mono-sub text-xs sm:text-sm text-zinc-400 tracking-wide leading-relaxed uppercase transition-colors duration-300 hover:text-zinc-200">
                            Visualizing deep basketball metrics to reveal the true narrative behind every play, player, and performance.
                        </p>
                    </div>

                </div>
            </section>

            {/* Light Main Content Area */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 w-full flex-grow bg-white text-zinc-900">
                <div className="mb-10">
                    <PlayerSearch onPlayerSelect={setSelectedPlayer} />
                </div>
                <PlayerDashboard player={selectedPlayer} />
            </main>

            {/* Light Gray Footer */}
            <footer className="bg-zinc-50 border-t border-zinc-200 py-6 mt-16 text-zinc-700">
                <div className="w-full px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium tracking-wide">
                    
                    {/* Copyright */}
                    <div className="flex items-center gap-1.5 text-zinc-700">
                        <span>&copy; {new Date().getFullYear()} Hockey Assist. All rights reserved.</span>
                    </div>

                    {/* Social Icons */}
                    <div className="flex items-center gap-3">
                        {/* GitHub */}
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            className="text-zinc-900 hover:text-orange-500 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                        </a>

                        {/* LinkedIn */}
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="text-zinc-900 hover:text-orange-500 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                            </svg>
                        </a>
                    </div>

                </div>
            </footer>
        </div>
    );
}

export default App;