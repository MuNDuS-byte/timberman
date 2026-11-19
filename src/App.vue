<script setup>
import { computed, ref } from 'vue';
import { GAME_STATE } from './game/constants.js';
import { useTimberGame } from './composables/useTimberGame.js';
import GameHud from './components/GameHud.vue';
import LevelBanner from './components/LevelBanner.vue';
import TapHints from './components/TapHints.vue';
import StartScreen from './components/StartScreen.vue';
import GameOverScreen from './components/GameOverScreen.vue';

const canvasRef = ref(null);

const {
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
  handleCanvasPointerDown,
} = useTimberGame(canvasRef);

const showHud = computed(() => gameState.value !== GAME_STATE.MENU);
const showStartScreen = computed(() => gameState.value === GAME_STATE.MENU);
</script>

<template>
  <canvas
    id="game-canvas"
    ref="canvasRef"
    aria-label="Timberman 2D Game"
    @pointerdown="handleCanvasPointerDown"
  ></canvas>

  <GameHud
    v-if="showHud"
    :score="hud.score"
    :best-score="hud.bestScore"
    :level="hud.level"
    :time-left="hud.timeLeft"
    :combo="hud.combo"
    :pop-score="hud.popScore"
    :muted="muted"
    @toggle-sound="toggleSound"
  />

  <LevelBanner
    :visible="levelBanner.visible"
    :level="levelBanner.level"
    :banner-key="levelBanner.key"
  />

  <TapHints v-if="showTapHints" />

  <StartScreen
    v-if="showStartScreen"
    :characters="characterPreviews"
    :selected-char-id="selectedCharId"
    @select-character="selectCharacter"
    @start="startRun"
  />

  <GameOverScreen
    v-if="showGameOverModal"
    :reason="gameOverStats.reason"
    :score="gameOverStats.score"
    :best-score="gameOverStats.bestScore"
    :level="gameOverStats.level"
    :cps="gameOverStats.cps"
    :is-new-record="gameOverStats.isNewRecord"
    @restart="startRun"
    @menu="showMenu"
  />
</template>
