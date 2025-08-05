<template>
  <div class="data-inspector-view">
    <BigQueryDataInspector />
  </div>
</template>

<script setup>
import BigQueryDataInspector from '@/components/BigQueryDataInspector.vue'
</script>

<style scoped>
.data-inspector-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>