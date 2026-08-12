
import React, { useEffect, useState } from 'react';
import { ScoreState, SongSlot, UserProfile, GameSettings } from '../types';

interface UIOverlayProps {
  score: ScoreState;
  profile: UserProfile;
  slot: SongSlot;
  currentTime: number;
  feedback: { text: string; id: number } | null;
  onPause: () => void;
  onFever: () => void;
  settings: GameSettings;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ score, profile, slot, currentTime, feedback, onPause, onFever, settings }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (feedback) {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const displayName = profile.name.toUpperCase().startsWith('DJ') ? profile.name : `DJ ${profile.name}`;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col font-orbitron">
      {/* Top HUD */}
      <div className="h-16 w-full flex items-center bg-black/60 border-b border-cyan-500/30 px-6 pointer-events-auto backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-white rounded overflow-hidden shadow-[0_0_10px_white]">
             {profile.avatar && <img src={profile.avatar} className="w-full h-full object-cover" />}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-xs italic tracking-tighter">{displayName}</span>
            <span className="text-cyan-400 font-bold text-[8px] tracking-[0.2em]">LV {profile.level} MIXER</span>
          </div>
        </div>

        {/* Core Gauges Center */}
        <div className="flex-grow mx-12 flex flex-col gap-1">
          {/* Health & Shield Stack */}
          <div className="flex gap-2 w-full h-2">
            <div className="w-1/2 bg-red-900/30 rounded-sm border border-red-500/20 overflow-hidden relative">
              <div className="h-full bg-red-500 transition-all shadow-[0_0_10px_red]" style={{ width: `${score.health}%` }}></div>
            </div>
            <div className="w-1/2 bg-blue-900/30 rounded-sm border border-cyan-500/20 overflow-hidden relative">
              <div className="h-full bg-cyan-400 transition-all shadow-[0_0_10px_cyan]" style={{ width: `${score.shield}%` }}></div>
            </div>
          </div>
          {/* Fever Bar */}
          <div className="h-4 w-full bg-gray-900/80 rounded-sm border border-white/10 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${score.isFeverActive ? 'bg-gradient-to-r from-yellow-300 via-white to-yellow-500 animate-pulse' : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300'}`}
              style={{ width: `${score.fever}%` }}
            ></div>
            {score.isFeverActive && (
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-black tracking-[0.5em] italic">
                OVERDRIVE ACTIVE {score.feverTimer}s
              </div>
            )}
          </div>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-black text-orange-500 italic drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              {score.points.toLocaleString().padStart(7, '0')}
            </div>
            <div className="text-[10px] text-cyan-400/70 font-bold tracking-tighter">COMBO: {score.combo}</div>
          </div>

          <button 
            onClick={onFever}
            disabled={score.fever < 100 || score.isFeverActive}
            className={`px-6 py-2 rounded-lg font-black italic text-xs transition-all border-2 ${
              score.fever >= 100 
                ? 'bg-yellow-500 border-white text-black animate-pulse shadow-[0_0_20px_yellow]' 
                : 'bg-gray-800 border-white/10 text-gray-500 opacity-50'
            }`}
          >
            FEVER
          </button>

          <button 
            onClick={onPause}
            className="w-10 h-10 flex items-center justify-center text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-pause"></i>
          </button>
        </div>
      </div>

      {/* Accuracy Feedback */}
      <div className="flex-grow flex items-center justify-center p-8">
         {showFeedback && feedback && (
            <div className="text-center animate-out fade-out zoom-out duration-500">
              <div className={`text-6xl font-black italic tracking-tighter ${
                feedback.text === 'PERFECT' ? 'text-yellow-400 drop-shadow-[0_0_20px_#facc15]' :
                feedback.text === 'GREAT' ? 'text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]' :
                'text-pink-400 drop-shadow-[0_0_15px_#f472b6]'
              }`}>
                {feedback.text}
              </div>
            </div>
          )}
      </div>

      {/* Bottom Display */}
      <div className="p-8 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="text-cyan-400 text-5xl font-black italic tracking-tighter">
            {score.combo} <span className="text-lg opacity-50">COMBO</span>
          </div>
          <div className="text-white/40 text-xs font-bold tracking-[0.3em] uppercase">
            ACCURACY: {score.accuracyRatio.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
