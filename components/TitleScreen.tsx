
import React, { useEffect, useRef } from 'react';

interface TitleScreenProps {
  onStart: () => void;
  stats?: { activePlayers: number; totalGamersJoined: number };
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, stats }) => {
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const pollGamepad = () => {
      if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          // Button 9 is standard mapping for Start
          if (gp && gp.buttons[9]?.pressed) {
            onStart();
            return; // Prevent multiple start calls
          }
        }
      }
      requestRef.current = requestAnimationFrame(pollGamepad);
    };

    requestRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [onStart]);

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-orbitron">
      {/* Background visualizer aesthetic */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(0,255,255,0.1),_transparent)]"></div>
        <div className="flex h-full w-full items-end justify-center gap-1 px-4 pb-2">
          {Array.from({ length: 60 }).map((_, i) => (
            <div 
              key={i} 
              className="w-full bg-cyan-500/20" 
              style={{ 
                height: `${Math.random() * 80}%`,
                animation: `pulse ${0.5 + Math.random() * 2}s infinite ease-in-out`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Network Stats Overlay */}
      {stats && (
        <div className="absolute top-8 right-8 z-20 text-right space-y-2">
          <div className="flex flex-col items-end">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Active Players</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-cyan-400 font-black text-xl italic">{stats.activePlayers.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total Gamers</span>
            <span className="text-white font-black text-xl italic">{stats.totalGamersJoined.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="z-10 text-center space-y-12">
        <div className="relative">
          <h1 className="text-[120px] font-black italic text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,255,0.6)]">
            DJMIX<br/>REPLICA
          </h1>
          <div className="absolute -top-4 -right-8 bg-cyan-500 text-black px-4 py-1 font-black text-xl italic skew-x-[-20deg]">
            PRO EDITION
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group relative px-20 py-6 bg-transparent border-4 border-white overflow-hidden transition-all hover:border-cyan-400"
        >
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10 text-4xl font-black text-white group-hover:text-black transition-colors">
            START INTERFACE
          </span>
        </button>

        <div className="text-gray-500 text-xs font-bold tracking-[0.8em] animate-pulse">
          LINKING CORE KERNEL... STABLE
        </div>
      </div>

      <div className="absolute bottom-8 left-8 text-gray-700 text-[10px] font-black uppercase tracking-widest">
        &copy; 2025 NEON.TECH // ALL RIGHTS RESERVED
      </div>
    </div>
  );
};

export default TitleScreen;
