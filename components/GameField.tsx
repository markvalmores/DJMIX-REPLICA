
import React, { useState, useEffect } from 'react';
import { GameNote, NoteType } from '../types';

interface GameFieldProps {
  notes: GameNote[];
  currentTime: number;
  sweepDuration: number;
  isFeverActive: boolean;
  keyHints: string[];
  onNoteDown: (id: string) => void;
  onNoteUp: (id: string) => void;
}

const GameField: React.FC<GameFieldProps> = ({ notes, currentTime, sweepDuration, isFeverActive, keyHints, onNoteDown, onNoteUp }) => {
  const sweepProgress = (currentTime % sweepDuration) / sweepDuration;
  const currentLane = (Math.floor(currentTime / sweepDuration) % 2) as 0 | 1;
  const sweepStart = Math.floor(currentTime / sweepDuration) * sweepDuration;

  const visibleNotes = notes.filter(n => {
    return n.startTime >= sweepStart - 1000 && n.startTime <= sweepStart + (sweepDuration * 2);
  });

  return (
    <div className="absolute inset-0 w-full h-full z-20 overflow-hidden font-orbitron select-none">
      {/* Central horizontal divider for the two sweeping halves */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 z-10 shadow-[0_0_15px_rgba(255,255,255,0.4)] pointer-events-none"></div>

      {/* Vertical Sweeping Scanner Line */}
      <div 
        className={`absolute z-30 w-[3px] pointer-events-none transition-colors duration-100 ${currentLane === 0 ? 'bg-cyan-400 shadow-[0_0_15px_#00ffff]' : 'bg-pink-400 shadow-[0_0_15px_#ff00ff]'}`}
        style={{ 
          left: `${(currentLane === 0 ? sweepProgress : 1 - sweepProgress) * 100}%`,
          top: currentLane === 0 ? '0' : '50%',
          height: '50%',
          willChange: 'left',
          transform: 'translateZ(0)'
        }}
      >
        <div className={`absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 ${currentLane === 0 ? 'bg-cyan-500 shadow-[0_0_25px_cyan]' : 'bg-pink-500 shadow-[0_0_25px_pink]'} border-white ${currentLane === 0 ? 'top-0' : 'bottom-0'}`}>
          <div className="w-full h-full animate-ping rounded-full bg-white/30"></div>
        </div>
      </div>

      {visibleNotes.map(note => (
        <NoteItem 
          key={note.id} 
          note={note} 
          isCurrentLane={note.lane === currentLane} 
          currentTime={currentTime} 
          onDown={() => onNoteDown(note.id)}
          onUp={() => onNoteUp(note.id)}
          isFeverActive={isFeverActive}
          sweepDuration={sweepDuration}
          keyHint={keyHints[note.keyIndex]}
        />
      ))}
    </div>
  );
};

const NoteItem: React.FC<{ 
  note: GameNote, 
  isCurrentLane: boolean, 
  currentTime: number, 
  onDown: () => void, 
  onUp: () => void, 
  isFeverActive: boolean,
  sweepDuration: number,
  keyHint: string
}> = ({ note, isCurrentLane, currentTime, onDown, onUp, isFeverActive, sweepDuration, keyHint }) => {
  const [bursting, setBursting] = useState(false);
  const [burstAcc, setBurstAcc] = useState<'PERFECT' | 'GREAT' | 'NICE' | 'MISS' | null>(null);

  useEffect(() => {
    if (note.hit && !bursting) {
      setBursting(true);
      setBurstAcc(note.accuracy || 'GREAT');
    }
  }, [note.hit, note.accuracy, bursting]);

  if (note.missed && currentTime > note.startTime + 250) return null;
  if (note.hit && !note.isHolding && currentTime > note.startTime + 400) return null;

  // Lane 0 is top half (0-50%), Lane 1 is bottom half (50-100%)
  const laneTop = note.lane === 0 ? 0 : 50;
  
  const isActive = isCurrentLane && Math.abs(currentTime - note.startTime) < 1500;
  const opacity = isActive ? 1 : 0.4;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onDown();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onUp();
  };

  // Note Coloring Based on keyIndex
  const getGradientColor = () => {
    if (isFeverActive) return 'bg-gradient-to-tr from-yellow-400 via-orange-400 to-yellow-200';
    switch(note.keyIndex) {
      case 0: return 'bg-gradient-to-tr from-cyan-600 via-cyan-400 to-cyan-200';
      case 1: return 'bg-gradient-to-tr from-blue-600 via-blue-400 to-blue-200';
      case 2: return 'bg-gradient-to-tr from-pink-600 via-pink-400 to-pink-200';
      case 3: return 'bg-gradient-to-tr from-purple-600 via-purple-400 to-purple-200';
      default: return 'bg-white';
    }
  };

  return (
    <div 
      className={`absolute flex items-center justify-center cursor-pointer z-30 group transition-all duration-200 ${note.hit && !note.isHolding ? 'pointer-events-none' : ''}`}
      style={{ 
        left: `${note.x * 100}%`, 
        top: `${laneTop + (note.y * 50)}%`,
        transform: 'translate(-50%, -50%) translateZ(0)',
        width: '120px',
        height: '120px',
        opacity: opacity,
        willChange: 'transform, opacity'
      }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Restored and Enhanced Spark Burst Effect */}
      {bursting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {/* Main Expanding Ring */}
          <div 
             className={`w-full h-full rounded-full border-[6px] ${burstAcc === 'PERFECT' ? 'border-yellow-400' : burstAcc === 'GREAT' ? 'border-cyan-400' : 'border-white'} animate-ping opacity-0`}
             style={{ animationDuration: '0.4s', animationIterationCount: 1, animationFillMode: 'forwards' }}
          ></div>
          {/* Eight Spark Particles */}
          <div className="absolute w-full h-full">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className={`absolute w-3 h-3 rounded-full animate-ping opacity-0 ${burstAcc === 'PERFECT' ? 'bg-yellow-400 shadow-[0_0_15px_yellow]' : burstAcc === 'GREAT' ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-white shadow-[0_0_15px_white]'}`}
                style={{
                  left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 45}%`,
                  top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 45}%`,
                  animationDuration: '0.5s',
                  animationIterationCount: 1,
                  animationFillMode: 'forwards',
                  animationDelay: `${i * 0.02}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Note Body */}
      <div 
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
          note.hit && !note.isHolding ? 'opacity-0 scale-[1.5]' : 'opacity-100 scale-100'
        } ${
          note.isHolding ? 'scale-125 shadow-[0_0_40px_rgba(255,255,255,0.8)]' : 'shadow-xl'
        } ${
          note.type === NoteType.LONG ? 'border-[6px] border-dashed border-white/80' : 'border-4 border-white'
        } ${getGradientColor()}`}
      >
        <span className="text-2xl font-black italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] select-none">
          {keyHint}
        </span>
        
        <div className="absolute top-1 left-2 w-8 h-4 bg-white/30 rounded-full -rotate-12"></div>

        {note.isHolding && (
           <div className="absolute -inset-4 rounded-full border-4 border-white animate-pulse shadow-[0_0_30px_white]"></div>
        )}

        {note.type === NoteType.LONG && !note.isHolding && (
           <div className="absolute -inset-2 rounded-full border-2 border-white/20 animate-[spin_4s_linear_infinite]"></div>
        )}
      </div>

      {note.isHolding && (
        <div className="absolute -top-10 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <span className="text-[10px] font-black italic text-white tracking-[0.2em] animate-pulse">
            HOLDING
          </span>
        </div>
      )}
    </div>
  );
};

export default GameField;
