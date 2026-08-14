<template>
  <v-toolbar-title>
    <img src="/OCP_logo.png" :style="logoStyle" alt="OPCO seal" />
    <span class="system-name">Cemetery Records Office</span>
  </v-toolbar-title>
</template>

<script setup>
const logoStyle = {
  height: '42px',
  verticalAlign: 'middle',
  marginRight: '11px',
};
</script>

<style scoped>
.system-name {
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 700;
}

@media (max-width: 600px) {
  .system-name {
    font-size: 0.84rem;
  }
}
</style>
