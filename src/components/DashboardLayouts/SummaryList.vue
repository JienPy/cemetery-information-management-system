<template>
  <div class="dashboard-layout">
    <DashboardCards/>
    <v-row class="chart-section">
      <PieChart/>
      <SummaryStatistics/>
    </v-row>
  </div>
</template>

<script setup>
import DashboardCards from './DashboardCards.vue';
import PieChart from './PieChart/PieChart.vue';
import SummaryStatistics from './SummaryStatistics.vue';


</script>

<style scoped>
.dashboard-layout {
  padding: 0;
}
.chart-section {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
