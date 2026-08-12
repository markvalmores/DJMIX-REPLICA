
import { NoteType, GameNote, DifficultyLevel } from './types';

export const SWEEP_DURATION = 4000;
export const HIT_WINDOWS = {
  PERFECT: 70,
  GREAT: 130,
  NICE: 220,
  MISS: 300
};

export const FEVER_DURATION = 7000; // 7 seconds in ms

export const generateProceduralNotes = (durationMs: number = 180000, difficulty: DifficultyLevel = 'NORMAL'): GameNote[] => {
  // Use a fixed BPM-like grid for "beat" based spawning
  // 120 BPM = 2 beats per second = 500ms per beat
  const beatInterval = 500; 
  
  // Density scaling based on difficulty (steps on the beat grid)
  const steps = {
    'EASY': 4,    // Every 4th beat (2s)
    'NORMAL': 2,  // Every 2nd beat (1s)
    'HARD': 1,    // Every beat (0.5s)
    'MASTER': 0.5 // Every half beat (0.25s)
  };

  const stepMultiplier = steps[difficulty];
  const longNoteChance = difficulty === 'EASY' ? 0.1 : difficulty === 'NORMAL' ? 0.2 : 0.35;

  const generatedNotes: GameNote[] = [];
  const safeDuration = isNaN(durationMs) || durationMs <= 0 ? 180000 : durationMs;
  
  let i = 0;
  while(true) {
    const startTime = 2500 + (i * beatInterval * stepMultiplier);
    
    // Stop spawning notes 3 seconds before the video ends
    if (startTime > safeDuration - 3000) break;

    const type = Math.random() < longNoteChance ? NoteType.LONG : NoteType.BASIC;
    const duration = type === NoteType.LONG ? (600 + Math.random() * 1000) : 0;
    
    // Determine lane based on sweep progress (0 = Left to Right, 1 = Right to Left)
    const sweepProgress = (startTime % (SWEEP_DURATION * 2)) / (SWEEP_DURATION * 2);
    const lane = sweepProgress < 0.5 ? 0 : 1;
    
    const timeInSweep = startTime % SWEEP_DURATION;
    const x = lane === 0 
      ? timeInSweep / SWEEP_DURATION 
      : 1 - (timeInSweep / SWEEP_DURATION);

    // Randomize vertical placement within the half-screen lane
    const y = 0.15 + Math.random() * 0.7;

    // Logically assign D/F to the Upper lane (lane 0), and J/K to the Lower lane (lane 1)
    const keyIndex = lane === 0 
      ? (Math.random() < 0.5 ? 0 : 1) // 0=left1(D), 1=left2(F)
      : (Math.random() < 0.5 ? 2 : 3); // 2=right1(J), 3=right2(K)

    generatedNotes.push({
      id: `note-${i}`,
      type,
      startTime,
      endTime: type === NoteType.LONG ? startTime + duration : undefined,
      lane: lane as 0 | 1,
      keyIndex: keyIndex as 0 | 1 | 2 | 3,
      x,
      y, 
      hit: false,
      missed: false
    });
    i++;
  }

  return generatedNotes;
};
