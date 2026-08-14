<template>
  <div class="dashboard-container mt-6">
      <v-row class="custom-row">
        <v-col
          v-for="(card, index) in cards"
          :key="index"
          cols="12"
          md="3"
          sm="6"
          class="card-column"
          :style="{ '--index': index }"
        >
            <v-card
              class="dashboard-card"
            >
              <div class="card-progress-indicator" :style="{ width: getProgressWidth(card) + '%' }"></div>
              
              <v-card-item>
                <div class="d-flex justify-space-between align-center">
                  <div class="card-icon-wrapper">
                    <v-icon color="primary" size="24" class="card-icon">
                      {{ getCardIcon(card.title) }}
                    </v-icon>
                  </div>
                  
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon
                        variant="text"
                        v-bind="props"
                        class="action-button"
                      >
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item @click="showDetails(card)">
                        <v-list-item-title>View Details</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="openDownloadDialog(card.title)">
                        <v-list-item-title>Download Report</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </v-card-item>

              <v-card-text>
                <div class="stats-container">
                  <h2 class="stats-value">{{ card.subtitle }}</h2>
                  <p class="stats-label">{{ card.title }}</p>
                  <p class="occupied-label">{{ card.occupiedText }}</p>
                </div>
                <div class="availability-info">
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <div class="availability-bar" v-bind="props">
                        <div 
                          class="availability-progress"
                          :style="{ width: getAvailabilityPercentage(card) + '%' }"
                        ></div>
                      </div>
                    </template>
                    <span>{{ card.occupiedText }}</span>
                  </v-tooltip>
                </div>
              </v-card-text>
            </v-card>
        </v-col>
      </v-row>

    <!-- Modal for File Type Selection -->
    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>Select File Type</v-card-title>
        <v-card-text>
          <v-radio-group v-model="selectedFileType">
            <v-radio label="DOC" value="doc"></v-radio>
            <v-radio label="PDF" value="pdf"></v-radio>
            <v-radio label="CSV" value="csv"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="downloadReport">Download</v-btn>
          <v-btn @click="dialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const apartmentStoresEndpoint = `${apiUrl}/items/apartment_stores`;
const graveyardsEndpoint = `${apiUrl}/items/graveyards`;
const boneVaultStoresEndpoint = `${apiUrl}/items/bone_vault_stores`;
const apartmentBabyStoresEndpoint = `${apiUrl}/items/apartment_baby_stores`;

const totalApartmentTombAvailable = ref(0);
const totalLotAvailable = ref(0);
const totalBoneVaultAvailable = ref(0);
const totalApartmentBabyTombAvailable = ref(0);

const totalApartmentTombOccupied = ref(0);
const totalLotOccupied = ref(0);
const totalBoneVaultOccupied = ref(0);
const totalApartmentBabyTombOccupied = ref(0);

const historicalData = ref({
  apartmentTombAvailable: [],
  apartmentBabyTombAvailable: [],
  lotAvailable: [],
  boneVaultAvailable: []
});

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
    totalApartmentTombAvailable.value = apartmentData.filter(item => item.status === null || item.status === 'available').length;
    totalApartmentTombOccupied.value = apartmentData.filter(item => item.status !== null && item.status !== 'available').length;

    const graveyardData = responses[1].data.data;
    totalLotAvailable.value = graveyardData.filter(item => item.status === null || item.status === 'available').length;
    totalLotOccupied.value = graveyardData.filter(item => item.status !== null && item.status !== 'available').length;

    const boneVaultData = responses[2].data.data;
    totalBoneVaultAvailable.value = boneVaultData.filter(item => item.status === null || item.status === 'available').length;
    totalBoneVaultOccupied.value = boneVaultData.filter(item => item.status !== null && item.status !== 'available').length;

    const apartmentBabyData = responses[3].data.data;
    totalApartmentBabyTombAvailable.value = apartmentBabyData.filter(item => item.status === null || item.status === 'available').length;
    totalApartmentBabyTombOccupied.value = apartmentBabyData.filter(item => item.status !== null && item.status !== 'available').length;

  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchData);

const cards = computed(() => [
  {
    title: 'Apartment Tomb Available',
    subtitle: totalApartmentTombAvailable.value,
    occupiedText: `Occupied APT: ${totalApartmentTombOccupied.value}`,
    info: `This is a summary of apartment tomb available: ${totalApartmentTombAvailable.value} available, ${totalApartmentTombOccupied.value} occupied.`,
    historicalData: historicalData.value.apartmentTombAvailable
  },
  {
    title: 'Apartment Tomb Baby Available',
    subtitle: totalApartmentBabyTombAvailable.value,
    occupiedText: `Occupied APT Baby: ${totalApartmentBabyTombOccupied.value}`,
    info: `This is a summary of apartment tomb baby available: ${totalApartmentBabyTombAvailable.value} available, ${totalApartmentBabyTombOccupied.value} occupied.`,
    historicalData: historicalData.value.apartmentBabyTombAvailable
  },
  {
    title: 'Lot Available',
    subtitle: totalLotAvailable.value,
    occupiedText: `Occupied Lot: ${totalLotOccupied.value}`,
    info: `This is a summary of lot available: ${totalLotAvailable.value} available, ${totalLotOccupied.value} occupied.`,
    historicalData: historicalData.value.lotAvailable
  },
  {
    title: 'Bone Vault Available',
    subtitle: totalBoneVaultAvailable.value,
    occupiedText: `Occupied Vault: ${totalBoneVaultOccupied.value}`,
    info: `This is a summary of bone vault available: ${totalBoneVaultAvailable.value} available, ${totalBoneVaultOccupied.value} occupied.`,
    historicalData: historicalData.value.boneVaultAvailable
  },
]);

const getCardIcon = (title) => {
  const icons = {
    'Apartment Tomb Available': 'mdi-home',
    'Apartment Tomb Baby Available': 'mdi-baby-carriage',
    'Lot Available': 'mdi-map-marker',
    'Bone Vault Available': 'mdi-archive'
  };
  return icons[title] || 'mdi-chart-box';
};

const getProgressWidth = (card) => {
  const total = parseInt(card.subtitle) + parseInt(card.occupiedText.match(/\d+/)[0]);
  return (parseInt(card.occupiedText.match(/\d+/)[0]) / total) * 100;
};

const getAvailabilityPercentage = (card) => {
  const available = parseInt(card.subtitle);
  const total = parseInt(card.subtitle) + parseInt(card.occupiedText.match(/\d+/)[0]);
  return (available / total) * 100;
};

const showDetails = (card) => {
  console.log('Show details for:', card.title);
};

const dialog = ref(false);
const selectedFileType = ref('');

const openDownloadDialog = (title) => {
  dialog.value = true;
};

const downloadReport = () => {
  if (selectedFileType.value) {
    // Logic to download the report based on the selected file type
    console.log(`Downloading ${selectedFileType.value} report...`);
    // Here you would typically make an API call to generate/download the report
    // For example:
    // axios.get(`${apiUrl}/download/report?type=${selectedFileType.value}`)
    //   .then(response => {
    //     // Handle the response, e.g., trigger file download
    //   });
    dialog.value = false; // Close the dialog after download
  } else {
    console.error('No file type selected');
  }
};
</script>

<style scoped>
.dashboard-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.card-progress-indicator {
  height: 3px;
  background: #1f2937;
}

.card-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f2f4f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-value {
  margin: 0;
  color: #101828;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stats-label {
  margin: 8px 0 0;
  color: #344054;
  font-weight: 600;
}

.occupied-label {
  margin: 4px 0 0;
  color: #667085;
  font-size: 0.88rem;
}

.availability-info {
  margin-top: 16px;
}

.availability-bar {
  height: 8px;
  background: #eaecf0;
  border-radius: 999px;
  overflow: hidden;
}

.availability-progress {
  height: 100%;
  background: #047857;
}
</style>
