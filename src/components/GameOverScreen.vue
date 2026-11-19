<script setup>
defineProps({
  reason: {
    type: String,
    required: true,
  },
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
  cps: {
    type: Number,
    required: true,
  },
  isNewRecord: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['restart', 'menu']);
</script>

<template>
  <section id="gameover-screen" class="overlay">
    <div class="wood-card gameover-card">
      <div id="death-reason" class="badge-danger">{{ reason }}</div>
      <h2 class="gameover-title">GAME OVER</h2>
      <div v-if="isNewRecord" id="new-record-badge" class="new-record">
        ★ НОВЫЙ РЕКОРД! ★
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-label">СЧЁТ</span>
          <span id="final-score" class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">РЕКОРД</span>
          <span id="final-best" class="stat-value accent">{{ bestScore }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">УРОВЕНЬ</span>
          <span id="final-level" class="stat-value">{{ level }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">УДАРОВ/С</span>
          <span id="final-cps" class="stat-value">{{ cps.toFixed(1) }}</span>
        </div>
      </div>

      <div class="gameover-actions">
        <button id="btn-restart" class="btn-primary" type="button" @click="emit('restart')">
          ИГРАТЬ СНОВА
        </button>
        <button id="btn-menu" class="btn-secondary" type="button" @click="emit('menu')">
          ГЕРОИ
        </button>
      </div>
      <div class="controls-legend">
        Нажми <kbd>Space</kbd> или <kbd>Enter</kbd> для быстрого старта
      </div>
    </div>
  </section>
</template>
