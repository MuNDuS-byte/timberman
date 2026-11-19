<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    required: true,
  },
  bestScore: {
    type: Number,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  timeLeft: {
    type: Number,
    required: true,
  },
  combo: {
    type: Number,
    required: true,
  },
  popScore: {
    type: Boolean,
    default: false,
  },
  muted: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle-sound']);

const timerPercent = computed(() => Math.max(0, Math.min(100, props.timeLeft * 100)));
const isLowTime = computed(() => props.timeLeft < 0.25);
</script>

<template>
  <header id="hud" class="hud" aria-live="polite">
    <div class="hud-top-row">
      <div class="hud-pill level-pill">
        <span class="pill-label">LVL</span>
        <span id="hud-level" class="pill-value">{{ level }}</span>
      </div>

      <div
        id="timer-bar"
        class="timer-wrapper"
        role="progressbar"
        aria-label="Оставшееся время"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(timerPercent)"
      >
        <div class="timer-icon" aria-hidden="true">⏱</div>
        <div class="timer-track">
          <div
            id="timer-fill"
            class="timer-fill"
            :class="{ low: isLowTime }"
            :style="{ width: `${timerPercent.toFixed(1)}%` }"
          ></div>
        </div>
      </div>

      <div class="hud-actions">
        <button
          id="btn-sound"
          class="icon-btn"
          type="button"
          title="Звук"
          aria-label="Переключить звук"
          :aria-pressed="String(muted)"
          @click.stop="emit('toggle-sound')"
        >
          {{ muted ? '🔇' : '🔊' }}
        </button>
      </div>
    </div>

    <div class="score-stage">
      <div id="hud-score" class="hud-score" :class="{ pop: popScore }">
        {{ score }}
      </div>
      <div class="hud-subrow">
        <span class="best-tag">
          BEST <strong id="hud-best">{{ bestScore }}</strong>
        </span>
        <span v-if="combo >= 5" id="hud-combo" class="combo-tag">
          COMBO x{{ combo }}
        </span>
      </div>
    </div>
  </header>
</template>
