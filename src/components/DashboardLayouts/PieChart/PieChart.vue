<template>
  <v-col cols="12" md="6">
    <v-card class="pie-chart-card">
      <div class="chart-container">
        <canvas id="pieChart"></canvas>
      </div>
    </v-card>
  </v-col>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { Chart, registerables, ArcElement, PieController } from 'chart.js';
import axios from 'axios';

const totalApartmentTombOccupied = ref(0);
const totalApartmentBabyTombOccupied = ref(0);
const totalLotOccupied = ref(0);
const totalBoneVaultOccupied = ref(0);
let chartInstance = null;

const apiUrl = 'http://localhost:8055';
const apartmentStoresEndpoint = `${apiUrl}/items/apartment_stores`;
const graveyardsEndpoint = `${apiUrl}/items/graveyards`;
const boneVaultStoresEndpoint = `${apiUrl}/items/bone_vault_stores`;
const apartmentBabyStoresEndpoint = `${apiUrl}/items/apartment_baby_stores`;

Chart.register(...registerables, ArcElement, PieController);

const fetchData = async () => {
  try {
    const authToken = localStorage.getItem('auth-token');
    const responses = await Promise.all([
      axios.get(apartmentStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(graveyardsEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(boneVaultStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(apartmentBabyStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
    ]);

    const apartmentData = responses[0].data.data;
    totalApartmentTombOccupied.value = apartmentData.filter(item => item.status !== null && item.status !== 'available').length;

    const graveyardData = responses[1].data.data;
    totalLotOccupied.value = graveyardData.filter(item => item.status !== null && item.status !== 'available').length;

    const boneVaultData = responses[2].data.data;
    totalBoneVaultOccupied.value = boneVaultData.filter(item => item.status !== null && item.status !== 'available').length;

    const apartmentBabyData = responses[3].data.data;
    totalApartmentBabyTombOccupied.value = apartmentBabyData.filter(item => item.status !== null && item.status !== 'available').length;
  } catch (error) {
    console.error(error);
  }
};

const createOccupancyChart = async () => {
  await fetchData();

  nextTick(() => {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const occupiedCounts = [
      totalApartmentTombOccupied.value,
      totalApartmentBabyTombOccupied.value,
      totalLotOccupied.value,
      totalBoneVaultOccupied.value,
    ];
    const occupiedTotal = occupiedCounts.reduce((sum, count) => sum + count, 0);
    const hasOccupancy = occupiedTotal > 0;

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: hasOccupancy
          ? ['Apartment Tomb', 'Apartment Baby Tomb', 'Lot', 'Bone Vault']
          : ['No occupied spaces yet'],
        datasets: [{
          label: 'Occupancy',
          data: hasOccupancy ? occupiedCounts : [1],
          backgroundColor: hasOccupancy
            ? ['#2563eb', '#7c3aed', '#d97706', '#047857']
            : ['#e5e7eb'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              usePointStyle: true,
              color: '#344054',
              font: {
                size: 12,
                weight: '500',
              },
            },
          },
          title: {
            display: true,
            text: 'Tomb Occupancy by Type',
            padding: {
              top: 8,
              bottom: 16,
            },
            color: '#101828',
            font: {
              size: 16,
              weight: '700',
              family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            },
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((sum, count) => sum + count, 0);
                const value = hasOccupancy ? context.raw : 0;
                const percentage = hasOccupancy && total > 0 ? Math.round((context.raw / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
            backgroundColor: '#101828',
            titleFont: { size: 13, weight: '700' },
            bodyFont: { size: 12 },
            padding: 10,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            position: 'nearest',
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 500,
        },
        layout: {
          padding: 8,
        },
        elements: {
          arc: {
            hoverBorderColor: '#ffffff',
          },
        },
        rotation: -45,
      },
    });
  });
};

onMounted(createOccupancyChart);
</script>

<style scoped>
.pie-chart-card {
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: none;
  display: flex;
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  padding: 16px;
  width: 100%;
}

.chart-container {
  height: 380px;
  position: relative;
  width: 100%;
}

@media (max-width: 960px) {
  .pie-chart-card {
    min-height: 360px;
  }

  .chart-container {
    height: 320px;
  }
}
</style>
