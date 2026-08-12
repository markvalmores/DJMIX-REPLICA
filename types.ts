
export enum GameState {
  TITLE = 'TITLE',
  SETUP = 'SETUP',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}

export enum NoteType {
  BASIC = 'BASIC',
  LONG = 'LONG'
}

export type DifficultyLevel = 'EASY' | 'NORMAL' | 'HARD' | 'MASTER';

export interface GameSettings {
  noteSpeed: number;
  calibration: number;
  masterVolume: number;
  sfxVolume: number;
  rtxEnabled: boolean;
  fsrEnabled: boolean;
  gpuAcceleration: boolean;
  gamepadEnabled: boolean;
  autoFever: boolean;
  keyBindings: {
    left1: string;
    left2: string;
    right1: string;
    right2: string;
    fever: string;
    pause: string;
  };
  gamepadBindings: {
    left1: number;
    left2: number;
    right1: number;
    right2: number;
    fever: number;
    pause: number;
  };
}

export interface GameNote {
  id: string;
  type: NoteType;
  startTime: number;
  endTime?: number;
  lane: 0 | 1; // 0 = L->R sweep, 1 = R->L sweep
  keyIndex: 0 | 1 | 2 | 3; // 0=left1, 1=left2, 2=right1, 3=right2
  x: number;
  y: number;
  hit: boolean;
  missed: boolean;
  isHolding?: boolean; // Track if currently being held
  accuracy?: 'PERFECT' | 'GREAT' | 'NICE' | 'MISS';
}

export interface UserProfile {
  name: string;
  avatar: string | null;
  level: number;
  exp: number;
}

export interface SongSlot {
  id: number;
  videoUrl: string | null;
  thumbnail: string | null;
  name: string;
  notes: GameNote[];
  difficulty?: DifficultyLevel;
  difficultyLevel?: number;
  bestScore?: number;
  lastScore?: number;
  bestCombo?: number;
}

export interface ScoreState {
  points: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  nice: number;
  miss: number;
  accuracyRatio: number;
  fever: number; 
  isFeverActive: boolean;
  feverTimer: number;
  health: number;
  shield: number;
}
