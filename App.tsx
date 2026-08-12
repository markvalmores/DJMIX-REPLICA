
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { GameState, UserProfile, SongSlot, ScoreState, GameSettings } from './types';
import SetupScreen from './components/SetupScreen';
import MenuScreen from './components/MenuScreen';
import RhythmGame from './components/RhythmGame';
import ResultScreen from './components/ResultScreen';
import TitleScreen from './components/TitleScreen';

const DEFAULT_SETTINGS: GameSettings = {
  noteSpeed: 1.0,
  calibration: 0,
  masterVolume: 1.0, // Set to max for clear, loud audio
  sfxVolume: 1.0,    // Set to max for clear, loud audio
  rtxEnabled: true,
  fsrEnabled: true,
  gpuAcceleration: true,
  gamepadEnabled: true,
  autoFever: false,
  keyBindings: {
    left1: 'd',
    left2: 'f',
    right1: 'j',
    right2: 'k',
    fever: ' ',
    pause: 'escape'
  },
  gamepadBindings: {
    left1: 14, // D-Pad Left
    left2: 12, // D-Pad Up
    right1: 3,  // Y Button
    right2: 1,  // B Button
    fever: 67,  // LT & RT Custom Combo
    pause: 9    // Start
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>({ 
    name: 'PLAYER 1', 
    avatar: null,
    level: 3,
    exp: 420
  });
  const [slots, setSlots] = useState<SongSlot[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, videoUrl: null, thumbnail: null, name: `SLOT ${i+1}`, notes: [] }))
  );
  const [activeSlot, setActiveSlot] = useState<SongSlot | null>(null);
  const [finalScore, setFinalScore] = useState<ScoreState | null>(null);
  const [serverStats, setServerStats] = useState({ activePlayers: 0, totalGamersJoined: 0 });

  useEffect(() => {
    const socket = io();

    socket.on('stats_update', (stats) => {
      setServerStats(stats);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSetupComplete = (p: UserProfile, s: SongSlot[]) => {
    setProfile({ ...p, level: 3, exp: 420 });
    setSlots(s);
    setGameState(GameState.MENU);
  };

  const startLevel = (slot: SongSlot) => {
    setActiveSlot(slot);
    setGameState(GameState.PLAYING);
  };

  const updateSlotRecord = (score: ScoreState) => {
    if (!activeSlot) return;
    
    setSlots(prevSlots => prevSlots.map(s => {
      if (s.id === activeSlot.id) {
        return {
          ...s,
          lastScore: score.points,
          bestScore: Math.max(s.bestScore || 0, score.points),
          bestCombo: Math.max(s.bestCombo || 0, score.maxCombo)
        };
      }
      return s;
    }));
    
    // Also update active slot so results screen and menu screen see fresh data
    setActiveSlot(prev => {
      if (!prev) return null;
      return {
        ...prev,
        lastScore: score.points,
        bestScore: Math.max(prev.bestScore || 0, score.points),
        bestCombo: Math.max(prev.bestCombo || 0, score.maxCombo)
      };
    });
  };

  return (
    <div className={`h-screen w-screen bg-black overflow-hidden select-none ${settings.rtxEnabled ? 'rtx-on' : ''}`}>
      {gameState === GameState.TITLE && (
        <TitleScreen onStart={() => setGameState(GameState.SETUP)} stats={serverStats} />
      )}
      {gameState === GameState.SETUP && (
        <SetupScreen onComplete={handleSetupComplete} initialSlots={slots} />
      )}
      {gameState === GameState.MENU && (
        <MenuScreen 
          profile={profile} 
          slots={slots} 
          settings={settings}
          stats={serverStats}
          onUpdateSettings={setSettings}
          onStart={startLevel} 
          onBack={() => setGameState(GameState.TITLE)} 
        />
      )}
      {gameState === GameState.PLAYING && activeSlot && (
        <RhythmGame 
          slot={activeSlot} 
          profile={profile}
          settings={settings}
          onUpdateSettings={setSettings}
          onEnd={(score) => {
            updateSlotRecord(score);
            setFinalScore(score);
            setGameState(GameState.RESULTS);
          }}
          onExit={() => setGameState(GameState.MENU)}
        />
      )}
      {gameState === GameState.RESULTS && finalScore && activeSlot && (
        <ResultScreen 
          score={finalScore} 
          slot={activeSlot} 
          profile={profile}
          settings={settings}
          onUpdateSettings={setSettings}
          onRetry={() => setGameState(GameState.PLAYING)}
          onExit={() => setGameState(GameState.MENU)}
        />
      )}
    </div>
  );
};

export default App;
