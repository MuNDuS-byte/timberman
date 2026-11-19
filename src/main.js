import { GAME_STATE, SIDE } from './game/constants.js';
import { SoundEngine } from './game/audio.js';
import { TimberGame } from './game/TimberGame.js';

const canvas = document.getElementById('game-canvas');
const hud = document.getElementById('hud');
const hudLevel = document.getElementById('hud-level');
const hudScore = document.getElementById('hud-score');
const hudBest = document.getElementById('hud-best');
const hudCombo = document.getElementById('hud-combo');
const timerBar = document.getElementById('timer-bar');
const timerFill = document.getElementById('timer-fill');
const btnSound = document.getElementById('btn-sound');

const startScreen = document.getElementById('start-screen');
const characterGrid = document.getElementById('character-grid');
const btnPlay = document.getElementById('btn-play');
const tapHints = document.getElementById('tap-hints');

const levelBanner = document.getElementById('level-banner');
const levelBannerNum = document.getElementById('level-banner-num');

const gameoverScreen = document.getElementById('gameover-screen');
const deathReason = document.getElementById('death-reason');
const newRecordBadge = document.getElementById('new-record-badge');
const finalScore = document.getElementById('final-score');
const finalBest = document.getElementById('final-best');
const finalLevel = document.getElementById('final-level');
const finalCps = document.getElementById('final-cps');
const btnRestart = document.getElementById('btn-restart');
const btnMenu = document.getElementById('btn-menu');

const sound = new SoundEngine();
let levelBannerTimeout = null;
let scorePopTimeout = null;

function syncSoundButton() {
  btnSound.textContent = sound.muted ? '🔇' : '🔊';
  btnSound.setAttribute('aria-pressed', String(sound.muted));
}
syncSoundButton();

const game = new TimberGame(canvas, sound, {
  onHudUpdate({ score, bestScore, level, timeLeft, combo, popScore }) {
    hudScore.textContent = String(score);
    hudBest.textContent = String(bestScore);
    hudLevel.textContent = String(level);

    const pct = Math.max(0, Math.min(100, timeLeft * 100));
    timerFill.style.width = `${pct.toFixed(1)}%`;
    timerBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    timerFill.classList.toggle('low', timeLeft < 0.25);

    if (combo >= 5) {
      hudCombo.textContent = `COMBO x${combo}`;
      hudCombo.classList.remove('hidden');
    } else {
      hudCombo.classList.add('hidden');
    }

    if (popScore) {
      hudScore.classList.add('pop');
      clearTimeout(scorePopTimeout);
      scorePopTimeout = setTimeout(() => hudScore.classList.remove('pop'), 90);
    }
  },

  onFirstChop() {
    tapHints.classList.add('hidden');
  },

  onLevelUp(level) {
    levelBannerNum.textContent = String(level);
    levelBanner.classList.remove('hidden');
    // Restart CSS keyframe animation cleanly
    levelBanner.style.animation = 'none';
    void levelBanner.offsetWidth;
    levelBanner.style.animation = '';

    clearTimeout(levelBannerTimeout);
    levelBannerTimeout = setTimeout(() => {
      levelBanner.classList.add('hidden');
    }, 1180);
  },

  onGameOver({ reason, score, bestScore, level, cps, isNewRecord }) {
    tapHints.classList.add('hidden');
    deathReason.textContent = reason;
    finalScore.textContent = String(score);
    finalBest.textContent = String(bestScore);
    finalLevel.textContent = String(level);
    finalCps.textContent = cps.toFixed(1);
    newRecordBadge.classList.toggle('hidden', !isNewRecord);

    // Slight delay so player sees the tombstone impact moment
    setTimeout(() => {
      if (game.state === GAME_STATE.GAMEOVER) {
        gameoverScreen.classList.remove('hidden');
      }
    }, 340);
  },
});

// Build Character Selector buttons using live procedural sprite previews
function renderCharacterPicker() {
  characterGrid.innerHTML = '';
  const previews = game.getCharacterPreviews();
  for (const item of previews) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `char-btn${item.id === game.selectedCharId ? ' active' : ''}`;
    btn.dataset.charId = item.id;

    const img = document.createElement('img');
    img.src = item.preview;
    img.alt = item.name;
    img.className = 'char-preview';

    const span = document.createElement('span');
    span.className = 'char-name';
    span.textContent = item.name;

    btn.append(img, span);
    btn.addEventListener('click', () => {
      sound.playClick();
      game.setCharacter(item.id);
      for (const el of characterGrid.querySelectorAll('.char-btn')) {
        el.classList.toggle('active', el.dataset.charId === item.id);
      }
    });
    characterGrid.appendChild(btn);
  }
}
renderCharacterPicker();

function startRun() {
  sound.playClick();
  startScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  tapHints.classList.remove('hidden');
  game.startNewGame();
}

function showMenu() {
  sound.playClick();
  gameoverScreen.classList.add('hidden');
  hud.classList.add('hidden');
  tapHints.classList.add('hidden');
  startScreen.classList.remove('hidden');
  game.openMenu();
}

btnPlay.addEventListener('click', startRun);
btnRestart.addEventListener('click', startRun);
btnMenu.addEventListener('click', showMenu);

btnSound.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.toggleMute();
  syncSoundButton();
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  if (game.state === GAME_STATE.READY || game.state === GAME_STATE.PLAYING) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      game.chop(SIDE.LEFT);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      game.chop(SIDE.RIGHT);
    }
    return;
  }

  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (game.state === GAME_STATE.MENU || game.state === GAME_STATE.GAMEOVER) {
      startRun();
    }
  }
});

// Pointer / Touch controls on canvas (left half = chop left, right half = chop right)
canvas.addEventListener('pointerdown', (e) => {
  if (game.state !== GAME_STATE.READY && game.state !== GAME_STATE.PLAYING) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const relX = e.clientX - rect.left;
  const side = relX < rect.width / 2 ? SIDE.LEFT : SIDE.RIGHT;
  game.chop(side);
});
