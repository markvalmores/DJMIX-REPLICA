
import React from 'react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  onClose: () => void;
}

const GAMEPAD_OPTIONS = [
  { value: 14, label: 'DPAD L' },
  { value: 12, label: 'DPAD U' },
  { value: 15, label: 'DPAD R' },
  { value: 13, label: 'DPAD D' },
  { value: 3, label: 'Y / △' },
  { value: 2, label: 'X / □' },
  { value: 1, label: 'B / ○' },
  { value: 0, label: 'A / ×' },
  { value: 4, label: 'LB / L1' },
  { value: 5, label: 'RB / R1' },
  { value: 6, label: 'LT / L2' },
  { value: 7, label: 'RT / R2' },
  { value: 67, label: 'LT & RT' },
  { value: 8, label: 'SELECT / SHARE' },
  { value: 9, label: 'START / OPTIONS' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  const handleChange = (key: keyof GameSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleKeyChange = (key: keyof GameSettings['keyBindings'], value: string) => {
    // Avoid setting empty strings for keys, fallback to a space or handle length gracefully
    const val = value ? value.toLowerCase() : ' ';
    onUpdate({ 
      ...settings, 
      keyBindings: { ...settings.keyBindings, [key]: val }
    });
  };

  const handleGamepadChange = (key: keyof GameSettings['gamepadBindings'], value: string) => {
    onUpdate({ 
      ...settings, 
      gamepadBindings: { ...settings.gamepadBindings, [key]: parseInt(value, 10) }
    });
  };

  // Ensure fallback defaults exist for older sessions
  const gb = settings.gamepadBindings || { left1: 14, left2: 12, right1: 3, right2: 1, fever: 67, pause: 9 };
  const kb = settings.keyBindings || { left1: 'd', left2: 'f', right1: 'j', right2: 'k', fever: ' ', pause: 'escape' };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md p-8">
      <div className="max-w-4xl w-full bg-[#0a0a0f] border border-cyan-500/50 rounded-3xl p-10 overflow-hidden relative shadow-[0_0_50px_rgba(0,255,255,0.1)] h-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black font-orbitron italic text-white tracking-tighter uppercase">Hardware & Core Calibration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-3xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Gameplay Calibration */}
          <div className="space-y-8">
            <h3 className="text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-500/30 pb-2">Execution Protocol</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-white font-bold uppercase text-sm">Note Speed (Hz)</label>
                <span className="text-cyan-400 font-black italic">{settings.noteSpeed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="3.0" step="0.1" 
                value={settings.noteSpeed} 
                onChange={(e) => handleChange('noteSpeed', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-white font-bold uppercase text-sm">Sync Calibration (ms)</label>
                <span className="text-cyan-400 font-black italic">{settings.calibration} ms</span>
              </div>
              <input 
                type="range" min="-200" max="200" step="1" 
                value={settings.calibration} 
                onChange={(e) => handleChange('calibration', parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-white font-bold uppercase text-sm">Audio Master Volume</label>
                <span className="text-cyan-400 font-black italic">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.masterVolume} 
                onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-white font-bold uppercase text-sm">SFX Feedback Level</label>
                <span className="text-cyan-400 font-black italic">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={settings.sfxVolume} 
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Controls & Input */}
          <div className="space-y-6">
            <h3 className="text-pink-500 font-bold uppercase tracking-widest border-b border-pink-500/30 pb-2">Control Mappings & Assists</h3>
            
            <div className="space-y-2">
              <Toggle 
                label="Gamepad / Controller Input" 
                enabled={settings.gamepadEnabled} 
                onToggle={() => handleChange('gamepadEnabled', !settings.gamepadEnabled)} 
              />
              <Toggle 
                label="Auto Overdrive (Fever)" 
                enabled={settings.autoFever} 
                onToggle={() => handleChange('autoFever', !settings.autoFever)} 
              />
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex flex-col">Left Lane Keys <span className="text-[10px] text-gray-500">KB / Gamepad</span></span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end">
                    <input type="text" maxLength={1} value={kb.left1.toUpperCase()} onChange={(e) => handleKeyChange('left1', e.target.value)} className="w-10 h-10 bg-black/50 text-center text-xl font-bold uppercase border border-cyan-500 rounded text-cyan-400 focus:outline-none focus:bg-white/10" />
                    <input type="text" maxLength={1} value={kb.left2.toUpperCase()} onChange={(e) => handleKeyChange('left2', e.target.value)} className="w-10 h-10 bg-black/50 text-center text-xl font-bold uppercase border border-cyan-500 rounded text-cyan-400 focus:outline-none focus:bg-white/10" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <select value={gb.left1} onChange={(e) => handleGamepadChange('left1', e.target.value)} className="w-20 bg-black/50 text-[10px] text-center border border-cyan-500/50 rounded text-cyan-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select value={gb.left2} onChange={(e) => handleGamepadChange('left2', e.target.value)} className="w-20 bg-black/50 text-[10px] text-center border border-cyan-500/50 rounded text-cyan-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex flex-col">Right Lane Keys <span className="text-[10px] text-gray-500">KB / Gamepad</span></span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end">
                    <input type="text" maxLength={1} value={kb.right1.toUpperCase()} onChange={(e) => handleKeyChange('right1', e.target.value)} className="w-10 h-10 bg-black/50 text-center text-xl font-bold uppercase border border-pink-500 rounded text-pink-400 focus:outline-none focus:bg-white/10" />
                    <input type="text" maxLength={1} value={kb.right2.toUpperCase()} onChange={(e) => handleKeyChange('right2', e.target.value)} className="w-10 h-10 bg-black/50 text-center text-xl font-bold uppercase border border-pink-500 rounded text-pink-400 focus:outline-none focus:bg-white/10" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <select value={gb.right1} onChange={(e) => handleGamepadChange('right1', e.target.value)} className="w-20 bg-black/50 text-[10px] text-center border border-pink-500/50 rounded text-pink-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select value={gb.right2} onChange={(e) => handleGamepadChange('right2', e.target.value)} className="w-20 bg-black/50 text-[10px] text-center border border-pink-500/50 rounded text-pink-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex flex-col">Overdrive Key <span className="text-[10px] text-gray-500">KB / Gamepad</span></span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end">
                    <input 
                      type="text" 
                      maxLength={10} 
                      placeholder="SPACE"
                      value={kb.fever === ' ' ? '' : kb.fever.toUpperCase()} 
                      onChange={(e) => handleKeyChange('fever', e.target.value)} 
                      className="w-24 h-10 bg-black/50 text-center text-sm font-bold uppercase border border-yellow-500 rounded text-yellow-400 focus:outline-none focus:bg-white/10" 
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <select value={gb.fever} onChange={(e) => handleGamepadChange('fever', e.target.value)} className="w-24 bg-black/50 text-[10px] text-center border border-yellow-500/50 rounded text-yellow-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex flex-col">Pause / Menu <span className="text-[10px] text-gray-500">KB / Gamepad</span></span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end">
                    <input 
                      type="text" 
                      maxLength={10} 
                      placeholder="ESC"
                      value={kb.pause === 'escape' ? 'ESC' : kb.pause?.toUpperCase() || ''} 
                      onChange={(e) => handleKeyChange('pause', e.target.value)} 
                      className="w-24 h-10 bg-black/50 text-center text-sm font-bold uppercase border border-red-500 rounded text-red-400 focus:outline-none focus:bg-white/10" 
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <select value={gb.pause || 9} onChange={(e) => handleGamepadChange('pause', e.target.value)} className="w-24 bg-black/50 text-[10px] text-center border border-red-500/50 rounded text-red-400 focus:outline-none p-1 cursor-pointer">
                      {GAMEPAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 text-center mt-2 font-bold italic">MOBILE TOUCH CONTROLS ARE ALWAYS ACTIVE</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-12 w-full py-5 bg-gradient-to-r from-cyan-600 to-cyan-400 text-black font-black font-orbitron text-xl rounded-2xl hover:scale-[1.02] transition-all"
        >
          APPLY MODIFICATIONS
        </button>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ label: string, enabled: boolean, onToggle: () => void }> = ({ label, enabled, onToggle }) => (
  <div 
    onClick={onToggle}
    className="flex justify-between items-center p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
  >
    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{label}</span>
    <div className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`}></div>
    </div>
  </div>
);

export default SettingsModal;
