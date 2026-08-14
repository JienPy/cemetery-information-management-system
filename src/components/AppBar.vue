<template>
  <v-app-bar 
    app 
    elevation="0"
    color="primary"
    height="64"
    class="app-bar-container"
    :class="{ 'scrolled': scrolled }"
  >
    <div class="d-flex align-center app-bar-content">
      <!-- Left section -->
      <div class="left-section d-flex align-center">
        <v-btn
          icon="mdi-menu"
          variant="text"
          color="white"
          class="hidden-md-and-up"
          aria-label="Open navigation"
          @click="toggleNavigation"
        />
        <LogoCom class="mr-4" />
      </div>

      <v-spacer />

      <!-- Right section -->
      <div class="right-section d-flex align-center">
        <NotificationsCom class="mx-2" />
        <v-divider vertical class="mx-3" />
       
        <SettingsCom class="ml-2" />
      </div>
    </div>

    <!-- Mobile search (visible on small screens) -->
    <v-expand-transition>
      <div v-if="isMobileSearchVisible" class="mobile-search pa-2">
        <SearchCom />
      </div>
    </v-expand-transition>
  </v-app-bar>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SettingsCom from './AppBarLayouts/SettingsCom.vue';
import LogoCom from './AppBarLayouts/LogoCom.vue';
import NotificationsCom from './AppBarLayouts/NotificationsCom.vue';
import SearchCom from './AppBarLayouts/SearchCom.vue';
import ProfileCom from './AppBarLayouts/ProfileCom.vue';

const scrolled = ref(false);
const isMobileSearchVisible = ref(false);

const handleScroll = () => {
  scrolled.value = window.scrollY > 20;
};

const toggleNavigation = () => {
  window.dispatchEvent(new CustomEvent('toggle-navigation'));
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.app-bar-container {
  border-bottom: 1px solid #27496d;
}

.app-bar-container.scrolled {
  border-bottom: 1px solid #315a82;
  background-color: #102a43 !important;
}

.app-bar-content {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0 20px;
}

.left-section,
.right-section {
  gap: 8px;
}

.mobile-search {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #102a43;
  border-bottom: 1px solid #315a82;
  z-index: 1;
}

.v-divider {
  border-color: #829ab1;
  opacity: 0.5;
  height: 24px !important;
}

@media (max-width: 600px) {
  .app-bar-container {
    height: 60px !important;
  }
  
  .app-bar-content {
    padding: 0 8px;
  }
}

:deep(.v-btn) {
  color: #ffffff;
  transition: background 0.15s ease;
}
</style>
