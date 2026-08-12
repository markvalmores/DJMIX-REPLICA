
import React, { useState } from 'react';
import { ScoreState, SongSlot, UserProfile, GameSettings } from '../types';
import SettingsModal from './SettingsModal';

interface ResultScreenProps {
  score: ScoreState;
  slot: SongSlot;
  profile: UserProfile;
  settings: GameSettings;
  onUpdateSettings: (s: GameSettings) => void;
  onRetry: () => void;
  onExit: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ score, slot, profile, settings, onUpdateSettings, onRetry, onExit }) => {
  const [sharing, setSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getRank = () => {
    if (score.accuracyRatio > 98) return 'S+';
    if (score.accuracyRatio > 95) return 'S';
    if (score.accuracyRatio > 90) return 'A';
    if (score.accuracyRatio > 80) return 'B';
    return 'C';
  };

  const displayName = profile.name.toUpperCase().startsWith('DJ') ? profile.name : `DJ ${profile.name}`;

  const handleShare = async () => {
    setSharing(true);
    
    // Create an offscreen canvas to draw the score image
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // standard open graph image size
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Sleek Dark Background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 1200, 630);
      
      // Cyberpunk Grid lines
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1200; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 630); ctx.stroke();
      }
      for (let i = 0; i < 630; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1200, i); ctx.stroke();
      }

      // Neon Accents
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(0, 0, 1200, 15);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 615, 1200, 15);

      // Header Text
      ctx.fillStyle = '#00ffff';
      ctx.font = 'italic 900 36px "Orbitron", sans-serif';
      ctx.fillText('DJMIX REPLICA // TERMINAL REPORT', 60, 80);

      // Mission Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 900 72px "Orbitron", sans-serif';
      ctx.fillText(slot.name.toUpperCase(), 60, 180);

      // Pilot Info
      ctx.fillStyle = '#aaaaaa';
      ctx.font = 'bold 32px "Rajdhani", sans-serif';
      ctx.fillText(displayName, 60, 240);

      // Core Score Stats
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 50px "Rajdhani", sans-serif';
      ctx.fillText(`SCORE: ${score.points.toLocaleString()}`, 60, 360);
      ctx.fillText(`MAX COMBO: ${score.maxCombo}`, 60, 440);
      ctx.fillText(`ACCURACY: ${score.accuracyRatio.toFixed(2)}%`, 60, 520);

      // Rank Visual
      ctx.fillStyle = '#facc15';
      ctx.font = 'italic 900 280px "Orbitron", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(getRank(), 1140, 480);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Rajdhani", sans-serif';
      ctx.fillText('RANK', 1120, 200);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }

        const file = new File([blob], 'djmix-score.png', { type: 'image/png' });
        const shareData = {
          title: 'DJMIX REPLICA Result',
          text: `Mission Accomplished! Rank ${getRank()} on ${slot.name} with ${score.points.toLocaleString()} points. #DJMIXREPLICA`,
          files: [file]
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.error('Error sharing:', err);
          }
        } else {
          // Fallback: Trigger direct download if Native Share API is unavailable
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'djmix-score.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('Share API not available - Image downloaded instead!');
        }
        
        setSharing(false);
      }, 'image/png');
    } else {
      setSharing(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#050505] p-12 flex flex-col items-center justify-center relative overflow-hidden font-orbitron">
      <div className="z-10 w-full max-w-4xl bg-black/60 border border-white/10 rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <div className="text-cyan-400 text-[10px] font-bold tracking-[0.5em] uppercase mb-1">Mission Report</div>
            <h1 className="text-4xl font-black text-white italic truncate w-64 uppercase">{slot.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-[180px] leading-[0.8] font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {getRank()}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
             <ResultStat label="FINAL SCORE" value={score.points.toLocaleString()} color="text-yellow-400" />
             <ResultStat label="MAX COMBO" value={score.maxCombo.toString()} color="text-cyan-400" />
             <ResultStat label="ACCURACY" value={`${score.accuracyRatio.toFixed(2)}%`} color="text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <MiniStat label="PERFECT" value={score.perfect} color="text-yellow-400" />
             <MiniStat label="GREAT" value={score.great} color="text-cyan-400" />
             <MiniStat label="NICE" value={score.nice} color="text-green-400" />
             <MiniStat label="MISS" value={score.miss} color="text-pink-500" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button 
              onClick={onRetry} 
              className="flex-grow py-5 bg-cyan-500 text-black font-black text-xl rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              RETRY MISSION
            </button>
            <button 
              onClick={handleShare}
              disabled={sharing}
              className="px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-lg rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,100,255,0.4)] disabled:opacity-50"
            >
              <i className={`fas ${sharing ? 'fa-spinner fa-spin' : 'fa-share-nodes'} mr-2`}></i>
              {sharing ? 'GENERATING...' : 'SHARE REPORT'}
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowSettings(true)} 
              className="flex-grow py-4 bg-gray-800 text-white font-black text-lg rounded-xl hover:bg-gray-700 transition-all border border-white/10"
            >
              ADJUST SPEED
            </button>
            <button 
              onClick={onExit} 
              className="px-12 py-4 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-all"
            >
              QUIT TO MENU
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={onUpdateSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

const ResultStat = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
    <span className="text-[10px] text-gray-500 font-black italic">{label}</span>
    <span className={`text-4xl font-black ${color}`}>{value}</span>
  </div>
);

const MiniStat = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
    <div className={`text-[8px] font-bold ${color} mb-1`}>{label}</div>
    <div className="text-xl font-black text-white">{value}</div>
  </div>
);

export default ResultScreen;
