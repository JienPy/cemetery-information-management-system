<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />

    <v-main class="mainStyle">
      <v-container fluid >
        <BurialRecordsTable/>
      </v-container>
    </v-main>

    <CemeteryRenewalReport 
      v-if="selectedRecord" 
      :record-data="selectedRecord"
      @close="selectedRecord = null"
    />
  </v-app>
</template>

<script setup>

import AppBar from '@/components/AppBar.vue'
import NavigationDrawer from '@/components/NavigationDrawer.vue'
import CemeteryRenewalReport from '@/components/GenerateReportLayouts/CemeteryRenewalReport.vue'

import BurialRecordsTable from '@/components/GenerateReportLayouts/BurialRecordsTable.vue'


</script>

<style scoped>
.mainStyle {
  background-color: #90A4AE;
}
.search-input {
  max-width: 250px;
}
.form-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}
.form-wrapper {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.form-header {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.5px;
  background-color: #1976D2 !important;
}
</style>