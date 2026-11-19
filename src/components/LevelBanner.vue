<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  level: {
    type: Number,
    required: true,
  },
  bannerKey: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <div
    v-if="visible"
    :key="bannerKey"
    id="level-banner"
    class="level-banner"
    aria-live="assertive"
  >
    LEVEL <span id="level-banner-num">{{ level }}</span>!
  </div>
</template>
