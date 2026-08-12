
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SongSlot, GameNote, NoteType, ScoreState, UserProfile, GameSettings } from '../types';
import { SWEEP_DURATION, HIT_WINDOWS, generateProceduralNotes } from '../constants';
import GameField from './GameField';
import UIOverlay from './UIOverlay';
import SettingsModal from './SettingsModal';

interface RhythmGameProps {
  slot: SongSlot;
  profile: UserProfile;
  settings: GameSettings;
  onUpdateSettings: (s: GameSettings) => void;
  onEnd: (score: ScoreState) => void;
  onExit: () => void;
}

const applyHeal = (current: {health: number, shield: number}, amount: number) => {
  let newHealth = current.health + amount;
  let newShield = current.shield;
  if (newHealth > 100) {
      newShield += (newHealth - 100);
      newHealth = 100;
  }
  if (newShield > 100) newShield = 100;
  return { health: newHealth, shield: newShield };
};

const applyDamage = (current: {health: number, shield: number}, amount: number) => {
  let newHealth = current.health;
  let newShield = current.shield;
  if (newShield >= amount) {
      newShield -= amount;
  } else {
      const remainingDamage = amount - newShield;
      newShield = 0;
      newHealth -= remainingDamage;
  }
  return { health: Math.max(0, newHealth), shield: newShield };
};

const RhythmGame: React.FC<RhythmGameProps> = ({ slot, profile, settings, onUpdateSettings, onEnd, onExit }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [notes, setNotes] = useState<GameNote[]>([]); 
  
  const [score, setScore] = useState<ScoreState>({
    points: 0, combo: 0, maxCombo: 0, perfect: 0, great: 0, nice: 0, miss: 0, 
    accuracyRatio: 100, fever: 0, isFeverActive: false, feverTimer: 0,
    health: 100, shield: 50
  });
  
  const [feedback, setFeedback] = useState<{ text: string, id: number } | null>(null);

  const audioCtx = useRef<AudioContext | null>(null);
  const compressorNode = useRef<DynamicsCompressorNode | null>(null);
  const videoSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const videoGainRef = useRef<GainNode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number>(0);
  const feverTimerInterval = useRef<number | null>(null);
  const bonusComboInterval = useRef<number | null>(null);
  
  const gamepadStateRef = useRef({ left1: false, left2: false, right1: false, right2: false, fever: false, pause: false });

  // Refs for decoupling rapid input validation from slow React render cycles
  const isPausedRef = useRef(isPaused);
  const isFailedRef = useRef(isFailed);
  const notesRef = useRef<GameNote[]>([]);
  const scoreRef = useRef<ScoreState>(score);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isFailedRef.current = isFailed; }, [isFailed]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const adjustedSweepDuration = SWEEP_DURATION / settings.noteSpeed;

  const initNotes = useCallback(() => {
    if (videoRef.current && videoRef.current.duration) {
      const durationMs = videoRef.current.duration * 1000;
      setNotes(generateProceduralNotes(durationMs, slot.difficulty || 'NORMAL'));
    }
  }, [slot.difficulty]);

  const initAudioSystem = useCallback(() => {
    if (!audioCtx.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });
      
      compressorNode.current = audioCtx.current.createDynamicsCompressor();
      compressorNode.current.threshold.setValueAtTime(-24, audioCtx.current.currentTime);
      compressorNode.current.knee.setValueAtTime(30, audioCtx.current.currentTime);
      compressorNode.current.ratio.setValueAtTime(12, audioCtx.current.currentTime);
      compressorNode.current.attack.setValueAtTime(0.003, audioCtx.current.currentTime);
      compressorNode.current.release.setValueAtTime(0.25, audioCtx.current.currentTime);
      compressorNode.current.connect(audioCtx.current.destination);
    }

    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }

    if (videoRef.current && !videoSourceRef.current) {
      try {
        videoSourceRef.current = audioCtx.current.createMediaElementSource(videoRef.current);
        
        const vCompressor = audioCtx.current.createDynamicsCompressor();
        vCompressor.threshold.setValueAtTime(-35, audioCtx.current.currentTime);
        vCompressor.knee.setValueAtTime(40, audioCtx.current.currentTime);
        vCompressor.ratio.setValueAtTime(12, audioCtx.current.currentTime);
        vCompressor.attack.setValueAtTime(0.003, audioCtx.current.currentTime);
        vCompressor.release.setValueAtTime(0.25, audioCtx.current.currentTime);

        const vEq = audioCtx.current.createBiquadFilter();
        vEq.type = 'highshelf';
        vEq.frequency.setValueAtTime(3000, audioCtx.current.currentTime);
        vEq.gain.setValueAtTime(6, audioCtx.current.currentTime);

        videoGainRef.current = audioCtx.current.createGain();
        videoGainRef.current.gain.setValueAtTime(settings.masterVolume * 2.5, audioCtx.current.currentTime);

        videoSourceRef.current.connect(vEq);
        vEq.connect(vCompressor);
        vCompressor.connect(videoGainRef.current);
        videoGainRef.current.connect(audioCtx.current.destination);

        videoRef.current.volume = 1.0;
      } catch (e) {
        console.warn("Video audio routing error:", e);
      }
    }
  }, [settings.masterVolume]);

  useEffect(() => {
    initAudioSystem();
  }, [initAudioSystem]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 1) {
      initNotes();
    }
  }, [initNotes]);

  useEffect(() => {
    if (videoGainRef.current && audioCtx.current) {
      videoGainRef.current.gain.setTargetAtTime(settings.masterVolume * 2.5, audioCtx.current.currentTime, 0.1);
      if (videoRef.current) videoRef.current.volume = 1.0;
    } else if (videoRef.current) {
      videoRef.current.volume = settings.masterVolume;
    }
  }, [settings.masterVolume]);

  // Retrieves instantaneous elapsed time bypassing render cycles
  const getExactTime = useCallback(() => {
    if (isPausedRef.current || isFailedRef.current) return pauseTimeRef.current;
    if (startTimeRef.current === null) return pauseTimeRef.current;
    return performance.now() - startTimeRef.current;
  }, []);

  const triggerGameOver = useCallback(() => {
    if (isFailedRef.current) return;
    pauseTimeRef.current = getExactTime();
    startTimeRef.current = null;
    videoRef.current?.pause();
    setIsFailed(true);
    isFailedRef.current = true;
  }, [getExactTime]);

  useEffect(() => {
    if (score.health <= 0 && !isFailedRef.current) {
      triggerGameOver();
    }
  }, [score.health, triggerGameOver]);

  const resumeFromFail = useCallback(() => {
    if (!isFailedRef.current) return;
    setScore(s => ({ ...s, health: 100, shield: 50 }));
    scoreRef.current = { ...scoreRef.current, health: 100, shield: 50 };
    
    startTimeRef.current = performance.now() - pauseTimeRef.current;
    videoRef.current?.play();
    setIsFailed(false);
    isFailedRef.current = false;
  }, []);

  const playSfx = useCallback((type: 'hit' | 'hold' | 'fever') => {
    initAudioSystem();
    if (!audioCtx.current || !compressorNode.current) return;
    
    const ctx = audioCtx.current;
    const dest = compressorNode.current;
    
    if (type === 'fever') {
      const now = ctx.currentTime;
      
      const root = 261.63; // C4
      const ratios = [1, 1.25, 1.5, 1.8877, 2.25]; 
      ratios.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(root * ratio, now);
        osc.detune.setValueAtTime(i * 3 - 6, now); 

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(settings.sfxVolume * 0.15, now + 1.0); 
        g.gain.setValueAtTime(settings.sfxVolume * 0.15, now + 5.0); 
        g.gain.linearRampToValueAtTime(0.001, now + 7.0); 

        osc.connect(g);
        g.connect(dest);
        osc.start(now);
        osc.stop(now + 7.0);
      });

      const arpNotes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98, 2093.00];
      arpNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const startTime = now + (i * 0.12); 
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(settings.sfxVolume * 0.12, startTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 3.0);

        osc.connect(g);
        g.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + 3.0);
      });
      return; 
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'hit') {
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(settings.sfxVolume * 0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else if (type === 'hold') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(settings.sfxVolume * 0.4, ctx.currentTime);
    }
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + (type === 'hold' ? 0.05 : 0.1));
  }, [settings.sfxVolume, initAudioSystem]);

  const activateFever = useCallback(() => {
    if (scoreRef.current.fever >= 100 && !scoreRef.current.isFeverActive && !isPausedRef.current && !isFailedRef.current) {
      playSfx('fever'); 
      
      setScore(s => ({ ...s, isFeverActive: true, feverTimer: 7 }));
      
      bonusComboInterval.current = window.setInterval(() => {
        setScore(prev => ({ 
          ...prev, 
          points: prev.points + 250,
        }));
      }, 250);

      feverTimerInterval.current = window.setInterval(() => {
        setScore(s => {
          if (s.feverTimer <= 1) {
            if (feverTimerInterval.current) clearInterval(feverTimerInterval.current);
            if (bonusComboInterval.current) clearInterval(bonusComboInterval.current);
            return { ...s, isFeverActive: false, feverTimer: 0, fever: 0 };
          }
          return { ...s, feverTimer: s.feverTimer - 1 };
        });
      }, 1000);
    }
  }, [playSfx]);

  // Handle Auto Fever Activation
  useEffect(() => {
    if (settings.autoFever && score.fever >= 100 && !score.isFeverActive && !isPaused && !isFailed) {
      activateFever();
    }
  }, [settings.autoFever, score.fever, score.isFeverActive, isPaused, isFailed, activateFever]);

  const handleInputStart = useCallback((keyIndex: 0 | 1 | 2 | 3) => {
    if (isPausedRef.current || isFailedRef.current) return;
    
    const now = getExactTime() - settings.calibration;
    
    const target = notesRef.current.find(n => !n.hit && !n.missed && n.keyIndex === keyIndex && Math.abs(now - n.startTime) < HIT_WINDOWS.MISS);
    
    if (target) {
      const diff = Math.abs(now - target.startTime);
      let acc: 'PERFECT' | 'GREAT' | 'NICE' | 'MISS' = 'MISS';
      let pts = 0;

      if (diff < HIT_WINDOWS.PERFECT) { acc = 'PERFECT'; pts = 1000; }
      else if (diff < HIT_WINDOWS.GREAT) { acc = 'GREAT'; pts = 500; }
      else if (diff < HIT_WINDOWS.NICE) { acc = 'NICE'; pts = 200; }

      if (acc !== 'MISS') {
        playSfx('hit');
        setFeedback({ text: acc, id: Date.now() });
        
        setNotes(prev => prev.map(n => {
          if (n.id === target.id) {
            return target.type === NoteType.LONG ? { ...n, isHolding: true, accuracy: acc } : { ...n, hit: true, accuracy: acc };
          }
          return n;
        }));

        setScore(prev => {
          const newCombo = prev.combo + 1;
          const newPerfect = acc === 'PERFECT' ? prev.perfect + 1 : prev.perfect;
          const newGreat = acc === 'GREAT' ? prev.great + 1 : prev.great;
          const newNice = acc === 'NICE' ? prev.nice + 1 : prev.nice;
          
          const totalHits = newPerfect + newGreat + newNice + prev.miss;
          const newAccuracy = totalHits === 0 ? 100 : ((newPerfect * 1 + newGreat * 0.8 + newNice * 0.5) / totalHits) * 100;
          
          let heal = acc === 'PERFECT' ? 2 : acc === 'GREAT' ? 1 : 0;
          const { health, shield } = heal > 0 ? applyHeal(prev, heal) : prev;

          return {
            ...prev,
            points: prev.points + (prev.isFeverActive ? pts * 2 : pts),
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            perfect: newPerfect,
            great: newGreat,
            nice: newNice,
            accuracyRatio: newAccuracy,
            fever: Math.min(100, prev.fever + 4),
            health,
            shield
          };
        });
      }
    }
  }, [getExactTime, settings.calibration, playSfx]);

  const handleInputEnd = useCallback((keyIndex: 0 | 1 | 2 | 3) => {
    if (isPausedRef.current || isFailedRef.current) return;
    
    setNotes(prev => prev.map(n => {
      if (n.isHolding && n.keyIndex === keyIndex) {
        playSfx('hit');
        setScore(s => {
          const { health, shield } = applyHeal(s, 5);
          return { 
            ...s, 
            points: s.points + (s.isFeverActive ? 2000 : 1000), 
            fever: Math.min(100, s.fever + 5),
            health,
            shield
          };
        });
        return { ...n, isHolding: false, hit: true };
      }
      return n;
    }));
  }, [playSfx]);

  const togglePause = useCallback(() => {
    if (isFailedRef.current) return;
    if (!isPausedRef.current) {
      pauseTimeRef.current = getExactTime();
      startTimeRef.current = null;
      videoRef.current?.pause();
      setIsPaused(true);
    } else {
      startTimeRef.current = performance.now() - pauseTimeRef.current;
      videoRef.current?.play();
      setIsPaused(false);
    }
  }, [getExactTime]);

  const handleRetry = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.warn("Retry play error:", e));
    }

    if (feverTimerInterval.current) clearInterval(feverTimerInterval.current);
    if (bonusComboInterval.current) clearInterval(bonusComboInterval.current);

    const initialScore = {
      points: 0, combo: 0, maxCombo: 0, perfect: 0, great: 0, nice: 0, miss: 0, 
      accuracyRatio: 100, fever: 0, isFeverActive: false, feverTimer: 0,
      health: 100, shield: 50
    };
    setScore(initialScore);
    scoreRef.current = initialScore;

    setFeedback(null);
    initNotes();

    pauseTimeRef.current = 0;
    startTimeRef.current = null;
    setCurrentTime(0);

    setIsPaused(false);
    isPausedRef.current = false;
    setIsFailed(false);
    isFailedRef.current = false;
  }, [initNotes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      
      const pauseKey = (settings.keyBindings.pause || 'escape').toLowerCase();
      if (key === pauseKey || e.key === 'Escape') togglePause();
      
      if (key === settings.keyBindings.left1.toLowerCase()) handleInputStart(0);
      else if (key === settings.keyBindings.left2.toLowerCase()) handleInputStart(1);
      else if (key === settings.keyBindings.right1.toLowerCase()) handleInputStart(2);
      else if (key === settings.keyBindings.right2.toLowerCase()) handleInputStart(3);
      else if (key === settings.keyBindings.fever.toLowerCase()) activateFever();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === settings.keyBindings.left1.toLowerCase()) handleInputEnd(0);
      else if (key === settings.keyBindings.left2.toLowerCase()) handleInputEnd(1);
      else if (key === settings.keyBindings.right1.toLowerCase()) handleInputEnd(2);
      else if (key === settings.keyBindings.right2.toLowerCase()) handleInputEnd(3);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInputStart, handleInputEnd, activateFever, togglePause, settings.keyBindings]);

  // Fast Gamepad Polling Loop (250Hz) - Decoupled from monitor refresh rate for true instantaneous response
  useEffect(() => {
    if (!settings.gamepadEnabled) return;
    
    const interval = setInterval(() => {
      if (isPausedRef.current || isFailedRef.current || !navigator.getGamepads) return;

      const gamepads = navigator.getGamepads();
      let gp0 = false, gp1 = false, gp2 = false, gp3 = false, gpFever = false, gpPause = false;
      
      const gb = settings.gamepadBindings || { left1: 14, left2: 12, right1: 3, right2: 1, fever: 67, pause: 9 };

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp) continue;
        
        if (gp.buttons[gb.left1]?.pressed) gp0 = true; 
        if (gp.buttons[gb.left2]?.pressed) gp1 = true; 
        if (gp.buttons[gb.right1]?.pressed) gp2 = true; 
        if (gp.buttons[gb.right2]?.pressed) gp3 = true; 
        
        if (gb.fever === 67) {
          if (gp.buttons[6]?.pressed || gp.buttons[7]?.pressed) gpFever = true;
        } else {
          if (gp.buttons[gb.fever]?.pressed) gpFever = true;
        }
        
        if (gp.buttons[gb.pause]?.pressed) gpPause = true;
      }

      if (gp0 && !gamepadStateRef.current.left1) handleInputStart(0);
      if (!gp0 && gamepadStateRef.current.left1) handleInputEnd(0);

      if (gp1 && !gamepadStateRef.current.left2) handleInputStart(1);
      if (!gp1 && gamepadStateRef.current.left2) handleInputEnd(1);

      if (gp2 && !gamepadStateRef.current.right1) handleInputStart(2);
      if (!gp2 && gamepadStateRef.current.right1) handleInputEnd(2);

      if (gp3 && !gamepadStateRef.current.right2) handleInputStart(3);
      if (!gp3 && gamepadStateRef.current.right2) handleInputEnd(3);

      if (gpFever && !gamepadStateRef.current.fever) activateFever();
      
      if (gpPause && !gamepadStateRef.current.pause) togglePause();

      gamepadStateRef.current = { left1: gp0, left2: gp1, right1: gp2, right2: gp3, fever: gpFever, pause: gpPause };
    }, 4); // Polling every 4ms (250 times per second)

    return () => clearInterval(interval);
  }, [settings.gamepadEnabled, settings.gamepadBindings, handleInputStart, handleInputEnd, activateFever, togglePause]);

  const update = useCallback((time: number) => {
    if (isPausedRef.current || isFailedRef.current) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = time - pauseTimeRef.current;
    }
    const elapsed = time - startTimeRef.current;
    setCurrentTime(elapsed);

    setNotes(prev => {
      let missedCount = 0;
      let completedLong = 0;

      const next = prev.map(n => {
        if (!n.hit && !n.missed && !n.isHolding && elapsed > n.startTime + 400) {
          missedCount++;
          return { ...n, missed: true };
        }
        if (n.isHolding && n.endTime && elapsed > n.endTime + 500) {
           completedLong++;
           return { ...n, isHolding: false, hit: true };
        }
        return n;
      });

      if (missedCount > 0 || completedLong > 0) {
        setScore(s => {
          const newMiss = s.miss + missedCount;
          const newPerfect = s.perfect + completedLong; 
          
          const newPoints = s.points + (completedLong * (s.isFeverActive ? 2000 : 1000));
          let newFever = s.fever - (5 * missedCount) + (5 * completedLong);
          newFever = Math.max(0, Math.min(100, newFever));
          
          const newCombo = missedCount > 0 ? 0 : s.combo + completedLong;

          const totalHits = newPerfect + s.great + s.nice + newMiss;
          const newAccuracy = totalHits === 0 ? 100 : ((newPerfect * 1 + s.great * 0.8 + s.nice * 0.5) / totalHits) * 100;

          let tempState = { health: s.health, shield: s.shield };
          if (missedCount > 0) tempState = applyDamage(tempState, missedCount * 15);
          if (completedLong > 0) tempState = applyHeal(tempState, completedLong * 5);

          return {
            ...s,
            points: newPoints,
            combo: newCombo,
            perfect: newPerfect,
            miss: newMiss,
            fever: newFever,
            accuracyRatio: newAccuracy,
            health: tempState.health,
            shield: tempState.shield
          };
        });
      }
      
      return (missedCount > 0 || completedLong > 0) ? next : prev;
    });

    if (videoRef.current && videoRef.current.duration && elapsed/1000 > videoRef.current.duration) {
      onEnd(scoreRef.current);
    } else {
      requestRef.current = requestAnimationFrame(update);
    }
  }, [onEnd]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  return (
    <div className={`w-full h-full relative bg-black flex flex-col touch-none ${settings.rtxEnabled ? 'rtx-visual-mode' : ''}`}>
      {/* Fever Active Visual Overlay */}
      {score.isFeverActive && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden border-[24px] border-yellow-400/40 animate-pulse-fast">
           <div className="absolute inset-0 bg-yellow-400/5 mix-blend-overlay"></div>
           <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,255,0,0.6)]"></div>
        </div>
      )}

      {/* Smooth GPU accelerated video tag, audio decoupled and compressed */}
      <video 
        ref={videoRef} 
        src={slot.videoUrl || ''} 
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        crossOrigin="anonymous"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isPaused || isFailed ? 'opacity-10' : 'opacity-70'}`}
        style={{ 
          transform: 'translate3d(0,0,0)', 
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          filter: settings.fsrEnabled ? 'contrast(1.2) brightness(1.1) saturate(1.1)' : 'none' 
        }}
        onLoadedMetadata={initNotes}
        autoPlay 
        muted={false}
      />

      {/* Aesthetic Gray Transparent Overlays for Gameplay Readability */}
      <div className="absolute inset-0 z-[5] pointer-events-none bg-gray-900/60 backdrop-blur-[2px] mix-blend-multiply transform-gpu"></div>
      <div className="absolute inset-0 z-[6] pointer-events-none bg-black/30 transform-gpu"></div>

      <UIOverlay 
        score={score} 
        profile={profile} 
        slot={slot}
        currentTime={currentTime}
        feedback={feedback} 
        onPause={togglePause} 
        onFever={activateFever}
        settings={settings}
      />
      
      <GameField 
        notes={notes} 
        currentTime={currentTime} 
        sweepDuration={adjustedSweepDuration}
        isFeverActive={score.isFeverActive}
        keyHints={[
          settings.keyBindings.left1.toUpperCase(),
          settings.keyBindings.left2.toUpperCase(),
          settings.keyBindings.right1.toUpperCase(),
          settings.keyBindings.right2.toUpperCase()
        ]}
        onNoteDown={(id) => {
          const n = notes.find(x => x.id === id);
          if (n) handleInputStart(n.keyIndex);
        }}
        onNoteUp={(id) => {
          const n = notes.find(x => x.id === id);
          if (n) handleInputEnd(n.keyIndex);
        }}
      />

      {isPaused && !isFailed && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-2xl">
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <h2 className="text-8xl font-black font-orbitron text-white italic drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">CORE HALT</h2>
            <div className="flex flex-col gap-6 min-w-[360px]">
              <button onClick={togglePause} className="py-6 bg-cyan-500 text-black font-black rounded-2xl hover:scale-105 transition-all text-2xl uppercase italic">Resume Pilot</button>
              <button onClick={handleRetry} className="py-5 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all text-xl uppercase italic">Retry Mission</button>
              <button onClick={() => setShowSettings(true)} className="py-5 border border-white/20 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-xl uppercase italic">Hardware Config</button>
              <button onClick={onExit} className="py-4 text-red-500 font-bold uppercase tracking-widest hover:text-red-400 transition-all mt-4">Abort Mission</button>
            </div>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="absolute inset-0 z-50 bg-red-950/90 flex items-center justify-center backdrop-blur-2xl">
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <h2 className="text-8xl font-black font-orbitron text-red-500 italic drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">SYSTEM FAILURE</h2>
            <div className="text-xl text-red-300 font-bold tracking-widest uppercase">Critical Damage Sustained</div>
            <div className="flex flex-col gap-6 min-w-[360px]">
              <button onClick={resumeFromFail} className="py-6 bg-cyan-500 text-black font-black rounded-2xl hover:scale-105 transition-all text-2xl uppercase italic">Revive Pilot</button>
              <button onClick={handleRetry} className="py-5 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all text-xl uppercase italic">Retry Mission</button>
              <button onClick={() => setShowSettings(true)} className="py-5 border border-white/20 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-xl uppercase italic">Hardware Config</button>
              <button onClick={onExit} className="py-4 text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-all mt-4">Abort Mission</button>
            </div>
          </div>
        </div>
      )}

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

export default RhythmGame;
