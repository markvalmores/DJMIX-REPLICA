
import React, { useState } from 'react';
import { UserProfile, SongSlot, DifficultyLevel, GameSettings } from '../types';
import SettingsModal from './SettingsModal';

interface MenuScreenProps {
  profile: UserProfile;
  slots: SongSlot[];
  settings: GameSettings;
  stats?: { activePlayers: number; totalGamersJoined: number };
  onUpdateSettings: (s: GameSettings) => void;
  onStart: (slot: SongSlot) => void;
  onBack: () => void;
}

const GAMEPAD_LABELS: Record<number, string> = {
  14: 'DPAD L', 12: 'DPAD U', 15: 'DPAD R', 13: 'DPAD D',
  3: 'Y / △', 2: 'X / □', 1: 'B / ○', 0: 'A / ×',
  4: 'LB / L1', 5: 'RB / R1', 6: 'LT / L2', 7: 'RT / R2',
  67: 'LT & RT',
  8: 'SELECT / SHARE', 9: 'START / OPTIONS'
};

const MenuScreen: React.FC<MenuScreenProps> = ({ profile, slots, settings, stats, onUpdateSettings, onStart, onBack }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const activeSlot = slots[selectedIdx];

  const handleStart = () => {
    if (activeSlot && activeSlot.videoUrl) {
      onStart({
        ...activeSlot,
        difficulty
      });
    }
  };

  const formatScore = (val?: number) => {
    if (val === undefined || val === 0) return "---,---";
    return val.toLocaleString().padStart(7, '0');
  };

  const formatCombo = (val?: number) => {
    if (val === undefined || val === 0) return "---";
    return val.toString();
  };

  const displayName = profile.name.toUpperCase().startsWith('DJ') ? profile.name : `DJ ${profile.name}`;
  
  const gb = settings.gamepadBindings || { left1: 14, left2: 12, right1: 3, right2: 1, fever: 67, pause: 9 };
  const kb = settings.keyBindings || { left1: 'd', left2: 'f', right1: 'j', right2: 'k', fever: ' ', pause: 'escape' };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-orbitron">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(0,100,255,0.1),_transparent)]"></div>
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_70%_70%,_rgba(255,0,100,0.1),_transparent)]"></div>
      </div>

      {/* Header */}
      <header className="z-10 p-8 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-chevron-left text-white"></i>
          </button>
          <div className="w-16 h-16 rounded-full border-4 border-cyan-400 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.5)]">
            {profile.avatar && <img src={profile.avatar} className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="text-white font-black text-2xl italic tracking-tighter">{displayName}</div>
            <div className="text-cyan-400 text-xs font-bold tracking-widest">LEVEL {profile.level} // SYSTEM READY</div>
          </div>
        </div>
        <div className="flex items-center gap-8 text-right">
          {stats && (
            <div className="flex gap-6 pr-6 border-r border-white/20">
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Active</span>
                <span className="text-green-400 font-black italic">{stats.activePlayers}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total</span>
                <span className="text-white font-black italic">{stats.totalGamersJoined}</span>
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-[0.5em]">Network Protocol</div>
            <div className="text-white text-lg font-black italic">CONNECTED_PRO_V2</div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="z-10 flex-grow flex p-8 gap-8 h-0 overflow-hidden">
        {/* Left: Song List Grid */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {slots.map((slot, i) => (
            <div 
              key={slot.id}
              onClick={() => setSelectedIdx(i)}
              className={`group flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                selectedIdx === i 
                  ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.15)]' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="w-16 aspect-video bg-black rounded overflow-hidden mr-4">
                {slot.thumbnail ? (
                  <img src={slot.thumbnail} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-700">EMPTY</div>
                )}
              </div>
              <div className="flex-grow">
                <div className={`text-xs font-bold truncate ${selectedIdx === i ? 'text-white' : 'text-gray-400'}`}>
                  {slot.videoUrl ? slot.name : `SLOT ${i + 1}`}
                </div>
                <div className="text-[10px] text-gray-600">MISSION DATA</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detailed View */}
        <div className="flex-grow flex flex-col bg-gray-900/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
          {activeSlot && activeSlot.videoUrl ? (
            <div className="flex h-full">
              {/* Left Side: Preview & Title */}
              <div className="w-1/2 h-full flex flex-col border-r border-white/10">
                <div className="flex-grow relative overflow-hidden bg-black">
                  <img src={activeSlot.thumbnail || ''} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  
                  {/* Song Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-cyan-400 text-xs font-bold italic mb-1">Missions/Trance</div>
                    <h2 className="text-4xl font-black text-white italic truncate uppercase">{activeSlot.name}</h2>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rotate-45 border ${i < (selectedIdx + 4) ? 'bg-yellow-400 border-yellow-200' : 'border-gray-700'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Big Circular Play Button */}
                <div className="h-32 flex items-center justify-center bg-black/60 relative">
                  <button 
                    onClick={handleStart}
                    className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,255,255,0.6)] group hover:scale-110 transition-all z-20"
                  >
                    <i className="fas fa-play text-4xl ml-2"></i>
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-cyan-500/30 animate-ping"></div>
                  </div>
                </div>
              </div>

              {/* Right Side: Stats & Difficulty */}
              <div className="w-1/2 h-full flex flex-col p-8 bg-black/60">
                <div className="space-y-4 flex-grow">
                  <StatRow label="BEST RECORD" value={formatScore(activeSlot.bestScore)} color="text-yellow-400" />
                  <StatRow label="MY RECORD" value={formatScore(activeSlot.lastScore)} color="text-orange-500" />
                  <StatRow label="MAX COMBO" value={formatCombo(activeSlot.bestCombo)} color="text-cyan-400" />
                </div>

                {/* Difficulty Select Buttons */}
                <div className="space-y-3 mt-8">
                  <DifficultyBtn 
                    label="MASTER" level={10} active={difficulty === 'MASTER'} 
                    color="bg-purple-600" onClick={() => setDifficulty('MASTER')} 
                  />
                  <DifficultyBtn 
                    label="HARD" level={8} active={difficulty === 'HARD'} 
                    color="bg-blue-600" onClick={() => setDifficulty('HARD')} 
                  />
                  <DifficultyBtn 
                    label="NORMAL" level={5} active={difficulty === 'NORMAL'} 
                    color="bg-yellow-600" onClick={() => setDifficulty('NORMAL')} 
                  />
                  <DifficultyBtn 
                    label="EASY" level={2} active={difficulty === 'EASY'} 
                    color="bg-green-600" onClick={() => setDifficulty('EASY')} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-700 text-3xl font-black italic text-center p-12">
              NO MISSION DATA DETECTED<br/>
              <span className="text-sm font-bold opacity-50 block mt-4 tracking-[0.3em]">IMPORT VIDEO IN SETUP TO INITIALIZE SLOT</span>
            </div>
          )}
        </div>
      </main>

      <footer className="z-10 p-6 flex justify-between bg-black/80 border-t border-white/5 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
        <div>CORE OS // BUILD 2025.02 // NEON.TECH</div>
        <div className="flex gap-12 text-[14px]">
          <span onClick={() => setShowSettings(true)} className="hover:text-cyan-400 cursor-pointer transition-colors text-cyan-500 flex items-center gap-2">
            <i className="fas fa-cog"></i> Settings
          </span>
          <span onClick={() => setShowHelp(true)} className="hover:text-cyan-400 cursor-pointer transition-colors text-cyan-500 flex items-center gap-2">
            <i className="fas fa-question-circle"></i> Help Guide
          </span>
        </div>
      </footer>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={onUpdateSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md p-8">
          <div className="max-w-2xl w-full bg-[#0a0a0f] border border-cyan-500/50 rounded-3xl p-10 relative shadow-[0_0_50px_rgba(0,255,255,0.1)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black font-orbitron italic text-cyan-400 tracking-tighter uppercase">OPERATION GUIDE</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-white transition-colors text-3xl">✕</button>
            </div>
            <div className="space-y-6 text-lg font-rajdhani">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-white font-bold mb-3 uppercase tracking-widest text-sm">Keybinds & Controls</h3>
                <p className="text-gray-400 mb-2"><strong className="text-cyan-400 mr-2">Track 1:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.left1.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.left1] || 'Gamepad'})</p>
                <p className="text-gray-400 mb-2"><strong className="text-blue-400 mr-2">Track 2:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.left2.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.left2] || 'Gamepad'})</p>
                <p className="text-gray-400 mb-2"><strong className="text-pink-400 mr-2">Track 3:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.right1.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.right1] || 'Gamepad'})</p>
                <p className="text-gray-400 mb-2"><strong className="text-purple-400 mr-2">Track 4:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.right2.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.right2] || 'Gamepad'})</p>
                <p className="text-gray-400 mb-2"><strong className="text-yellow-400 mr-2">Overdrive:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.fever === ' ' ? 'SPACE' : kb.fever.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.fever] || 'Gamepad'})</p>
                <p className="text-gray-400 mb-2"><strong className="text-red-400 mr-2">Pause/Menu:</strong> Press <kbd className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 mx-1">{kb.pause === 'escape' ? 'ESC' : kb.pause?.toUpperCase()}</kbd> (or {GAMEPAD_LABELS[gb.pause] || 'Gamepad'})</p>
                <p className="text-gray-400"><strong className="text-white mr-2">Mobile/Touch:</strong> Tap notes directly</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-gray-400">
                <h3 className="text-white font-bold mb-3 uppercase tracking-widest text-sm">Rhythm Mechanics</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Tap the notes on their respective lanes exactly when the vertical scanner crosses them.</li>
                  <li><strong className="text-white">Long Notes:</strong> Identified by a spinning dashed ring. HOLD the key down! Release at any time to collect points.</li>
                  <li><strong className="text-yellow-400">Fever:</strong> Build the meter to 100%, then trigger Fever to DOUBLE your points for 7 seconds.</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-8 w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-400 text-black font-black font-orbitron text-xl rounded-2xl hover:scale-[1.02] transition-all"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
    <span className="text-gray-500 text-[10px] font-black">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);

const DifficultyBtn = ({ label, level, active, color, onClick }: { label: string, level: number, active: boolean, color: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex justify-between items-center px-6 py-3 rounded-lg transition-all border-2 ${
      active 
        ? `${color} border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105` 
        : `bg-black/40 border-white/10 opacity-60 hover:opacity-100`
    }`}
  >
    <span className="font-black italic tracking-tighter">{label}</span>
    <span className="text-xs">LV {level}</span>
  </button>
);

export default MenuScreen;
