<template>
  <v-col cols="12" md="6" class="constatistic">
    <v-card class="summary-card">
      <v-card-title class="summary-title">Overall Statistics</v-card-title>
      <v-card-text>
        <div class="stats-grid">
          <div class="main-stats">
            <div class="stat-box total-occupancy">
              <div class="stat-icon">
                <v-icon size="32" color="primary">mdi-account-group</v-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  Total Occupancy
                  <v-tooltip bottom>
                    <template #activator="{ props }">
                      <v-icon v-bind="props" small @click.stop>
                        mdi-information
                      </v-icon>
                    </template>
                    <span>Total number of occupied spaces.</span>
                  </v-tooltip>
                </div>
                <div class="stat-value">{{ getTotalOccupancy() }}</div>
                <div class="stat-change" :class="getChangeClass(5)">
                  <v-icon small>{{ getChangeIcon(5) }}</v-icon>
                  <span>5% from last month</span>
                </div>
              </div>
            </div>

            <div class="stat-box available-spaces">
              <div class="stat-icon">
                <v-icon size="32" color="success">mdi-view-grid-plus</v-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  Available Spaces
                  <v-tooltip bottom>
                    <template #activator="{ props }">
                      <v-icon v-bind="props" small @click.stop>
                        mdi-information
                      </v-icon>
                    </template>
                    <span>Total number of spaces currently available.</span>
                  </v-tooltip>
                </div>
                <div class="stat-value">{{ getTotalAvailable() }}</div>
                <div class="stat-change" :class="getChangeClass(-2)">
                  <v-icon small>{{ getChangeIcon(-2) }}</v-icon>
                  <span>2% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div class="additional-stats">
            <div class="stat-row">
              <div class="stat-item occupancy-rate">
                <div class="stat-mini-label">Occupancy Rate</div>
                <div class="stat-mini-value">{{ calculateOccupancyRate() }}%</div>
              </div>
            </div>

            <div class="capacity-utilization">
              <div class="util-label">Capacity Utilization</div>
              <div class="util-bar-container">
                <div class="util-bar-progress" :style="{ width: `${calculateUtilization()}%` }"></div>
              </div>
              <div class="util-value">{{ calculateUtilization() }}%</div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-col>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const apartmentStoresEndpoint = `${apiUrl}/items/apartment_stores`;
const graveyardsEndpoint = `${apiUrl}/items/graveyards`;
const boneVaultStoresEndpoint = `${apiUrl}/items/bone_vault_stores`;
const apartmentBabyStoresEndpoint = `${apiUrl}/items/apartment_baby_stores`;
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;

const totalApartmentTombOccupied = ref(0);
const totalApartmentTombAvailable = ref(0);
const totalLotOccupied = ref(0);
const totalLotAvailable = ref(0);
const totalBoneVaultOccupied = ref(0);
const totalBoneVaultAvailable = ref(0);
const totalApartmentBabyTombOccupied = ref(0);
const totalApartmentBabyTombAvailable = ref(0);
const totalVacatedLastMonth = ref(0); // New ref for vacated count

const fetchData = async () => {
  try {
    const authToken = localStorage.getItem('auth-token');
    const responses = await Promise.all([
      axios.get(apartmentStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(graveyardsEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(boneVaultStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(apartmentBabyStoresEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(burialRecordsEndpoint, { headers: { Authorization: `Bearer ${authToken}` } }),
    ]);

    const apartmentData = responses[0].data.data;
    totalApartmentTombOccupied.value = apartmentData.filter(item => item.status !== null && item.status !== 'available').length;
    totalApartmentTombAvailable.value = apartmentData.filter(item => item.status === null || item.status === 'available').length;

    const graveyardData = responses[1].data.data;
    totalLotOccupied.value = graveyardData.filter(item => item.status !== null && item.status !== 'available').length;
    totalLotAvailable.value = graveyardData.filter(item => item.status === null || item.status === 'available').length;

    const boneVaultData = responses[2].data.data;
    totalBoneVaultOccupied.value = boneVaultData.filter(item => item.status !== null && item.status !== 'available').length;
    totalBoneVaultAvailable.value = boneVaultData.filter(item => item.status === null || item.status === 'available').length;

    const apartmentBabyData = responses[3].data.data;
    totalApartmentBabyTombOccupied.value = apartmentBabyData.filter(item => item.status !== null && item.status !== 'available').length;
    totalApartmentBabyTombAvailable.value = apartmentBabyData.filter(item => item.status === null || item.status === 'available').length;

    const burialRecordsData = responses[4].data.data;
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    totalVacatedLastMonth.value = burialRecordsData.filter(record => new Date(record.date_of_death) >= lastMonthDate).length;

  } catch (error) {
    console.error(error);
  }
};

onMounted(fetchData);

const getTotalOccupancy = () => {
  return totalApartmentTombOccupied.value + 
         totalLotOccupied.value + 
         totalBoneVaultOccupied.value + 
         totalApartmentBabyTombOccupied.value;
};

const getTotalAvailable = () => {
  return totalApartmentTombAvailable.value + 
         totalLotAvailable.value + 
         totalBoneVaultAvailable.value + 
         totalApartmentBabyTombAvailable.value;
};

const getChangeClass = (change) => {
  return change > 0 ? 'positive-change' : 'negative-change';
};

const getChangeIcon = (change) => {
  return change > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down';
};

const calculateOccupancyRate = () => {
  const total = getTotalOccupancy() + getTotalAvailable();
  return total > 0 ? Math.round((getTotalOccupancy() / total) * 100) : 0;
};

const calculateTurnoverRate = () => {
  const totalOccupiedLastMonth = totalApartmentTombOccupied.value + totalLotOccupied.value + totalBoneVaultOccupied.value + totalApartmentBabyTombOccupied.value;
  const turnover = totalVacatedLastMonth.value / totalOccupiedLastMonth * 100;
  return totalOccupiedLastMonth > 0 ? Math.round(turnover) : 0;
};

const calculateUtilization = () => {
  const total = getTotalOccupancy() + getTotalAvailable();
  return total > 0 ? Math.round((getTotalOccupancy() / total) * 100) : 0;
};
</script>

<style scoped>
.summary-card {
  height: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: none;
}

.summary-title {
  color: #101828;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
  padding: 18px 20px 8px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-box {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.stat-box:hover {
  background: #f9fafb;
}

.stat-icon {
  padding: 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #eaecf0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 6px;
}

.stat-value {
  color: #101828;
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 0.78rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.additional-stats {
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  padding: 16px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-mini-label {
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.stat-mini-value {
  color: #101828;
  font-size: 1.2rem;
  font-weight: 700;
}

.capacity-utilization {
  margin-top: 0;
}

.util-label {
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.util-bar-container {
  height: 8px;
  background: #eaecf0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.util-bar-progress {
  height: 100%;
  background: #047857;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.util-value {
  font-size: 0.8rem;
  color: #475467;
  font-weight: 600;
  text-align: right;
}

.positive-change {
  color: #047857;
}

.negative-change {
  color: #b42318;
}

@media (max-width: 760px) {
  .main-stats {
    grid-template-columns: 1fr;
  }
}
</style>
