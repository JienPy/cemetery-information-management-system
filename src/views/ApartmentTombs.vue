<template>
  <VaultFacilityPage
    type="apartment"
    title="Apartment Tombs"
    description="Building-style registry of apartment tomb units, occupancy, and assigned interment records."
    default-facility="Apartment A"
    unit-label="Apartment unit"
    icon="mdi-office-building-outline"
    :columns="6"
    :rows="4"
  />
</template>

<script setup>
import VaultFacilityPage from '@/components/ManagePlotLayouts/VaultFacilityPage.vue';
</script>
