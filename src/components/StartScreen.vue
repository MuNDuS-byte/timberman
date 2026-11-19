<script setup>
defineProps({
  characters: {
    type: Array,
    required: true,
  },
  selectedCharId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['select-character', 'start']);
</script>

<template>
  <section id="start-screen" class="overlay">
    <div class="wood-card">
      <div class="badge-top">VUE 3 + THREE.JS 2D ARCADE</div>
      <h1 class="game-title">TIMBERMAN</h1>
      <p class="game-subtitle">
        Руби дерево, уклоняйся от веток, не дай таймеру иссякнуть!
      </p>

      <div class="character-picker">
        <div class="picker-label">ВЫБЕРИ ГЕРОЯ</div>
        <div id="character-grid" class="character-grid">
          <button
            v-for="item in characters"
            :key="item.id"
            type="button"
            class="char-btn"
            :class="{ active: item.id === selectedCharId }"
            :data-char-id="item.id"
            @click="emit('select-character', item.id)"
          >
            <img :src="item.preview" :alt="item.name" class="char-preview" />
            <span class="char-name">{{ item.name }}</span>
          </button>
        </div>
      </div>

      <button id="btn-play" class="btn-primary" type="button" @click="emit('start')">
        ИГРАТЬ
      </button>

      <div class="controls-legend">
        <span><kbd>←</kbd> <kbd>→</kbd> или <kbd>A</kbd> <kbd>D</kbd></span>
        <span class="dot">•</span>
        <span>Клик / тап слева или справа</span>
      </div>
    </div>
  </section>
</template>
