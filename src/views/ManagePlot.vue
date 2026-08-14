<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />

    <v-main class="plot-page">
      <section class="plot-header-band">
        <div class="plot-header-content">
          <div>
            <p class="eyebrow">Cemetery Inventory</p>
            <h1>Plot Management</h1>
            <p class="header-description">
              Monitor availability, occupancy, maintenance status, and location details across all cemetery spaces.
            </p>
          </div>
          <div class="registry-status">
            <span class="registry-status__icon">
              <v-icon icon="mdi-map-marker-check-outline" size="20" />
            </span>
            <div>
              <strong>Central plot registry</strong>
              <span>Prisma and SQLite</span>
            </div>
          </div>
        </div>
      </section>

      <v-container fluid class="plot-container">
        <TombsList />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import AppBar from '../components/AppBar.vue';
import NavigationDrawer from '../components/NavigationDrawer.vue';
import TombsList from '@/components/ManagePlotLayouts/TombsList.vue';
</script>

<style scoped>
.plot-page {
  background: #e8eef5;
  min-height: 100vh;
}

.plot-header-band {
  background: #102a43;
  border-top: 1px solid #27496d;
  color: #ffffff;
}

.plot-header-content {
  align-items: center;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1600px;
  min-height: 154px;
  padding: 26px 24px 30px;
}

.eyebrow {
  color: #9fc0df;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin: 0 0 7px;
  text-transform: uppercase;
}

.plot-header-content h1 {
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1.2;
  margin: 0;
}

.header-description {
  color: #c8d6e5;
  font-size: 0.86rem;
  margin: 8px 0 0;
  max-width: 720px;
}

.registry-status {
  align-items: center;
  background: #163b60;
  border: 1px solid #315a82;
  border-radius: 7px;
  display: flex;
  flex: 0 0 auto;
  gap: 11px;
  min-width: 220px;
  padding: 12px 14px;
}

.registry-status__icon {
  align-items: center;
  background: #dbeafe;
  border-radius: 50%;
  color: #1d4ed8;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.registry-status > div {
  display: grid;
}

.registry-status strong {
  font-size: 0.78rem;
}

.registry-status span:last-child {
  color: #b9c9da;
  font-size: 0.7rem;
  margin-top: 2px;
}

.plot-container {
  max-width: 1600px;
  min-width: 0;
  padding: 20px 24px 32px;
}

@media (max-width: 800px) {
  .plot-header-content {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    padding: 24px 16px;
  }

  .registry-status {
    min-width: 0;
    width: 100%;
  }

  .plot-container {
    padding: 14px;
  }
}
</style>
