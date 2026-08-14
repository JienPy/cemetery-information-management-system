<template>
  <VaultFacilityPage
    type="baby_apartment"
    title="Baby Vault"
    description="Dedicated facility layout for baby vault units and their linked cemetery records."
    default-facility="Baby Vault A"
    unit-label="Baby vault"
    icon="mdi-baby-face-outline"
    :columns="5"
    :rows="4"
  />
</template>

<script setup>
import VaultFacilityPage from '@/components/ManagePlotLayouts/VaultFacilityPage.vue';
</script>
