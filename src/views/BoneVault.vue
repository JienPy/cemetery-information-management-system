<template>
  <VaultFacilityPage
    type="bone_vault"
    title="Bone Vault"
    description="Structured vault elevation for locating remains, monitoring capacity, and reviewing assigned records."
    default-facility="Bone Vault A"
    unit-label="Bone vault"
    icon="mdi-archive-outline"
    :columns="6"
    :rows="5"
  />
</template>

<script setup>
import VaultFacilityPage from '@/components/ManagePlotLayouts/VaultFacilityPage.vue';
</script>
