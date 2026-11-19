import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { GAME_STATE, SIDE, TIMING } from '../game/constants.js';
import { SoundEngine } from '../game/audio.js';
import { TimberGame } from '../game/TimberGame.js';

export function useTimberGame(canvasRef) {
  const sound = new SoundEngine();
  let game = null;
  let levelBannerTimeout = null;
  let scorePopTimeout = null;
  let gameOverDelayTimeout = null;

  const gameState = ref(GAME_STATE.MENU);
  const muted = ref(sound.muted);
  const selectedCharId = ref('lumberjack');
  const characterPreviews = ref([]);

  const hud = reactive({
    score: 0,
    bestScore: 0,
    level: 1,
    timeLeft: TIMING.INITIAL_TIME,
    combo: 0,
    popScore: false,
  });

  const showTapHints = ref(false);
  const showGameOverModal = ref(false);

  const levelBanner = reactive({
    visible: false,
    level: 2,
    key: 0,
  });

  const gameOverStats = reactive({
    reason: 'УДАР ВЕТКОЙ!',
    score: 0,
    bestScore: 0,
    level: 1,
    cps: 0,
    isNewRecord: false,
  });

  function clearPendingTimers() {
    clearTimeout(levelBannerTimeout);
    clearTimeout(scorePopTimeout);
    clearTimeout(gameOverDelayTimeout);
  }

  function startRun() {
    if (!game) return;
    clearPendingTimers();
    sound.playClick();
    showGameOverModal.value = false;
    levelBanner.visible = false;
    hud.popScore = false;
    showTapHints.value = true;
    gameState.value = GAME_STATE.READY;
    game.startNewGame();
  }

  function showMenu() {
    if (!game) return;
    clearPendingTimers();
    sound.playClick();
    showGameOverModal.value = false;
    levelBanner.visible = false;
    hud.popScore = false;
    showTapHints.value = false;
    gameState.value = GAME_STATE.MENU;
    game.openMenu();
  }

  function selectCharacter(charId) {
    if (!game) return;
    sound.playClick();
    game.setCharacter(charId);
    selectedCharId.value = game.selectedCharId;
  }

  function toggleSound() {
    muted.value = sound.toggleMute();
  }

  function chop(side) {
    if (!game) return;
    game.chop(side);
  }

  function handleCanvasPointerDown(event) {
    if (!game || !canvasRef.value) return;
    if (game.state !== GAME_STATE.READY && game.state !== GAME_STATE.PLAYING) {
      return;
    }
    const rect = canvasRef.value.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const side = relX < rect.width / 2 ? SIDE.LEFT : SIDE.RIGHT;
    game.chop(side);
  }

  function handleKeyDown(event) {
    if (!game || event.repeat) return;

    if (game.state === GAME_STATE.READY || game.state === GAME_STATE.PLAYING) {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault();
        game.chop(SIDE.LEFT);
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault();
        game.chop(SIDE.RIGHT);
      }
      return;
    }

    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      if (game.state === GAME_STATE.MENU || game.state === GAME_STATE.GAMEOVER) {
        startRun();
      }
    }
  }

  onMounted(() => {
    if (!canvasRef.value) return;

    game = new TimberGame(canvasRef.value, sound, {
      onHudUpdate({ score, bestScore, level, timeLeft, combo, popScore }) {
        hud.score = score;
        hud.bestScore = bestScore;
        hud.level = level;
        hud.timeLeft = timeLeft;
        hud.combo = combo;

        if (popScore) {
          hud.popScore = true;
          clearTimeout(scorePopTimeout);
          scorePopTimeout = setTimeout(() => {
            hud.popScore = false;
          }, 90);
        }
      },

      onFirstChop() {
        gameState.value = GAME_STATE.PLAYING;
        showTapHints.value = false;
      },

      onLevelUp(level) {
        levelBanner.level = level;
        levelBanner.key += 1;
        levelBanner.visible = true;

        clearTimeout(levelBannerTimeout);
        levelBannerTimeout = setTimeout(() => {
          levelBanner.visible = false;
        }, 1180);
      },

      onGameOver({ reason, score, bestScore, level, cps, isNewRecord }) {
        gameState.value = GAME_STATE.GAMEOVER;
        showTapHints.value = false;
        gameOverStats.reason = reason;
        gameOverStats.score = score;
        gameOverStats.bestScore = bestScore;
        gameOverStats.level = level;
        gameOverStats.cps = cps;
        gameOverStats.isNewRecord = isNewRecord;

        clearTimeout(gameOverDelayTimeout);
        // Slight delay so player sees the tombstone impact moment
        gameOverDelayTimeout = setTimeout(() => {
          if (game && game.state === GAME_STATE.GAMEOVER) {
            showGameOverModal.value = true;
          }
        }, 340);
      },
    });

    selectedCharId.value = game.selectedCharId;
    hud.bestScore = game.bestScore;
    characterPreviews.value = game.getCharacterPreviews();

    window.addEventListener('keydown', handleKeyDown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    clearPendingTimers();
    if (game) {
      game.destroy();
      game = null;
    }
  });

  return {
    gameState,
    hud,
    muted,
    selectedCharId,
    characterPreviews,
    showTapHints,
    showGameOverModal,
    levelBanner,
    gameOverStats,
    startRun,
    showMenu,
    selectCharacter,
    toggleSound,
    chop,
    handleCanvasPointerDown,
  };
}
