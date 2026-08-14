<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />
    <v-main class="dashboard-page">
      <v-container fluid class="dashboard-container">
        <div class="page-header">
          <div>
            <p class="eyebrow">Operations</p>
            <h1>Cemetery Dashboard</h1>
          </div>
          <p class="page-note">Monitor records, plot availability, and renewal workload.</p>
        </div>
        <SummaryList />
        <v-row class="dashboard-secondary">
          <v-col cols="12" md="8">
            <DeathsLineChart />
          </v-col>
          <v-col cols="12" md="4">
            <MonitoringTombsMap />
          </v-col>
        </v-row>
        <SummaryDataFlow class="summary-data-flow-gap" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import AppBar from '../components/AppBar.vue';
import NavigationDrawer from '../components/NavigationDrawer.vue';

import SummaryList from '@/components/DashboardLayouts/SummaryList.vue';
import SummaryDataFlow from '@/components/DashboardLayouts/SummaryDataFlow.vue';
import MonitoringTombsMap from '@/components/DashboardLayouts/MonitoringTombsMap.vue';

import DeathsLineChart from '@/components/DashboardLayouts/DeathsLineChart.vue';
</script>

<style scoped>
.summary-data-flow-gap {
  margin-top: 20px;
}

.dashboard-page {
  background: #f4f6f8;
  min-height: 100vh;
}

.dashboard-container {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 6px 0 2px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #667085;
  font-size: 0.82rem;
  font-weight: 650;
}

.page-header h1 {
  margin: 0;
  color: #101828;
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.2;
}

.page-note {
  margin: 0;
  color: #667085;
  font-size: 0.92rem;
  text-align: right;
}

.dashboard-secondary {
  margin-top: 4px;
}

@media (max-width: 800px) {
  .dashboard-container {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-note {
    text-align: left;
  }
}
</style>
