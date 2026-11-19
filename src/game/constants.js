export const SIDE = {
  NONE: 0,
  LEFT: -1,
  RIGHT: 1,
};

export const GAME_STATE = {
  MENU: 'menu',
  READY: 'ready',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};

// Virtual 2D orthographic world units (height = 1000 units, width scales dynamically with aspect ratio)
export const WORLD = {
  HEIGHT: 1000,
  GROUND_Y: -360,
  STUMP_HEIGHT: 68,
  TRUNK_WIDTH: 146,
  SEGMENT_HEIGHT: 112,
  BRANCH_WIDTH: 196,
  BRANCH_HEIGHT: 64,
  VISIBLE_SEGMENTS: 10,
  PLAYER_OFFSET_X: 162,
  PLAYER_WIDTH: 148,
  PLAYER_HEIGHT: 162,
};

export const TIMING = {
  INITIAL_TIME: 0.58, // fraction of max bar [0..1]
  MAX_TIME: 1.0,
  CHOP_REFILL: 0.088, // time gained per chop
  BASE_DRAIN_PER_SEC: 0.145, // level 1 drain per second
  LEVEL_DRAIN_STEP: 0.032, // added drain per level
  MAX_DRAIN_PER_SEC: 0.52,
  CHOPS_PER_LEVEL: 20,
  CHOP_POSE_DURATION: 0.11,
};

export const STORAGE_KEYS = {
  BEST_SCORE: 'timberman_threejs_best_v1',
  CHARACTER: 'timberman_threejs_char_v1',
  MUTED: 'timberman_threejs_muted_v1',
};

export const CHARACTERS = [
  {
    id: 'lumberjack',
    name: 'Дровосек',
    hatColor: '#c92a2a',
    hatAccent: '#8f1919',
    shirtColor: '#d93829',
    shirtStripe: '#2c1512',
    beardColor: '#5c3317',
    skinColor: '#f6c39b',
    pantsColor: '#29527a',
    axeColor: '#c9d6df',
  },
  {
    id: 'viking',
    name: 'Викинг',
    hatColor: '#7f8c8d',
    hatAccent: '#ecf0f1',
    shirtColor: '#2b5876',
    shirtStripe: '#1c3b50',
    beardColor: '#d35400',
    skinColor: '#f7caa6',
    pantsColor: '#4e342e',
    axeColor: '#b0bec5',
    hasHorns: true,
  },
  {
    id: 'ninja',
    name: 'Ниндзя',
    hatColor: '#1e272e',
    hatAccent: '#ff3f34',
    shirtColor: '#222f3e',
    shirtStripe: '#101820',
    beardColor: '#1e272e',
    skinColor: '#f5c6a5',
    pantsColor: '#151c24',
    axeColor: '#48dbfb',
    isNinja: true,
  },
  {
    id: 'bear',
    name: 'Гризли',
    hatColor: '#6d4c41',
    hatAccent: '#4e342e',
    shirtColor: '#2e7d32',
    shirtStripe: '#1b5e20',
    beardColor: '#8d6e63',
    skinColor: '#795548',
    pantsColor: '#3e2723',
    axeColor: '#ffd54f',
    isBear: true,
  },
];

// Sky palettes cycled by level (Day -> Warm Afternoon -> Sunset -> Twilight Night)
export const SKY_PALETTES = [
  { top: '#2b86d6', bottom: '#9fe2ff', sun: '#fff3a1', hillFar: '#4c8e99', hillMid: '#2d6a4f', hillNear: '#1b4332' },
  { top: '#1d78b8', bottom: '#b7f0d8', sun: '#ffe885', hillFar: '#457b9d', hillMid: '#2a6f59', hillNear: '#194a38' },
  { top: '#7f3c8d', bottom: '#ff9a62', sun: '#ffca57', hillFar: '#6b4269', hillMid: '#48284a', hillNear: '#2a182d' },
  { top: '#0c1631', bottom: '#274375', sun: '#e9f2ff', hillFar: '#1d2d50', hillMid: '#13203b', hillNear: '#0b1426' },
];
