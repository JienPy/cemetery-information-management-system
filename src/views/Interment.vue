<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />

    <v-main class="interment-page">
      <section class="interment-header-band">
        <div class="interment-header-content">
          <div>
            <p class="eyebrow">Operations Registry</p>
            <h1>Interment Records</h1>
            <p class="header-description">
              Maintain deceased records, plot assignments, contacts, payments, and renewal coverage.
            </p>
          </div>
          <div class="office-status">
            <span class="office-status__icon">
              <v-icon icon="mdi-database-check-outline" size="20" />
            </span>
            <div>
              <strong>Local registry online</strong>
              <span>Prisma and SQLite</span>
            </div>
          </div>
        </div>
      </section>
      <v-container fluid class="interment-container">
        <DataList />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import AppBar from '../components/AppBar.vue';
import NavigationDrawer from '../components/NavigationDrawer.vue';
import DataList from '@/components/DataindexLayout/DataList.vue';
</script>

<style scoped>
.interment-page {
  background: #e8eef5;
  min-height: 100vh;
}

.interment-container {
  max-width: 1600px;
  min-width: 0;
  padding: 20px 24px 32px;
}

.interment-header-band {
  background: #102a43;
  border-top: 1px solid #27496d;
  color: #ffffff;
}

.interment-header-content {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 24px;
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

.interment-header-content h1 {
  margin: 0;
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1.2;
}

.header-description {
  color: #c8d6e5;
  font-size: 0.86rem;
  margin: 8px 0 0;
  max-width: 680px;
}

.office-status {
  align-items: center;
  background: #163b60;
  border: 1px solid #315a82;
  border-radius: 7px;
  display: flex;
  flex: 0 0 auto;
  gap: 11px;
  min-width: 210px;
  padding: 12px 14px;
}

.office-status__icon {
  align-items: center;
  background: #d1fae5;
  border-radius: 50%;
  color: #047857;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.office-status > div {
  display: grid;
}

.office-status strong {
  font-size: 0.78rem;
}

.office-status span:last-child {
  color: #b9c9da;
  font-size: 0.7rem;
  margin-top: 2px;
}

@media (max-width: 800px) {
  .interment-container {
    padding: 14px;
  }

  .interment-header-content {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    padding: 24px 16px;
  }

  .office-status {
    min-width: 0;
    width: 100%;
  }
}
</style>
