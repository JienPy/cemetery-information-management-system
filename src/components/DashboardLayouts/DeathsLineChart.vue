<template>
  <v-sheet class="analytics-dashboard pa-6" elevation="3" rounded="lg">
    <v-card class="dashboard-card" rounded="lg">
      <!-- Header Section -->
      <v-card-title class="header-section pa-6">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div class="d-flex align-center">
            <v-icon color="primary" size="32" class="mr-3">mdi-chart-box</v-icon>
            <div>
              <h2 class="text-h4 font-weight-bold mb-1">Annual Interment Analytics</h2>
              <span class="text-subtitle-1 text-grey">Statistics from {{ minYear }} to {{ maxYear }}</span>
            </div>
          </div>
          <v-chip
            color="primary"
            outlined
            class="mt-2 mt-sm-0"
          >
            Total Records: {{ totalDeaths }}
          </v-chip>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Controls Section -->
      <v-card-text class="pa-6">
        <v-row class="controls-section mb-6">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="startYear"
              label="Start Year"
              type="number"
              :min="minYear"
              :max="maxYear"
              variant="outlined"
              density="comfortable"
              hide-details
              class="year-input"
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="endYear"
              label="End Year"
              type="number"
              :min="minYear"
              :max="maxYear"
              variant="outlined"
              density="comfortable"
              hide-details
              class="year-input"
              prepend-inner-icon="mdi-calendar-end"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn-group class="ml-auto">
              <v-btn
                color="primary"
                prepend-icon="mdi-filter"
                @click="applyYearFilter"
                class="control-btn"
              >
                Apply Filter
              </v-btn>
              <v-btn
                color="secondary"
                prepend-icon="mdi-refresh"
                @click="refreshData"
                class="control-btn"
              >
                Refresh
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-row>

        <!-- Analytics Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="stats-card">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon color="primary" size="36" class="mr-3">mdi-account-group</v-icon>
                  <div>
                    <div class="text-overline">Total Deaths</div>
                    <div class="text-h5 font-weight-bold">{{ totalDeaths }}</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="stats-card">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon color="info" size="36" class="mr-3">mdi-chart-line</v-icon>
                  <div>
                    <div class="text-overline">Average Per Year</div>
                    <div class="text-h5 font-weight-bold">
                      {{ (totalDeaths / (endYear - startYear + 1)).toFixed(1) }}
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="stats-card">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon color="success" size="36" class="mr-3">mdi-calendar-range</v-icon>
                  <div>
                    <div class="text-overline">Time Span</div>
                    <div class="text-h5 font-weight-bold">{{ endYear - startYear  }} Years</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1" class="stats-card" @click="openReportDialog">
              <v-card-text>
                <div class="d-flex align-center cursor-pointer">
                  <v-icon color="warning" size="36" class="mr-3">mdi-file-document</v-icon>
                  <div>
                    <div class="text-overline">Generate Report</div>
                    <div class="text-subtitle-2">Click to view details</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Chart Section -->
        <v-card elevation="1" class="chart-card">
          <v-card-text>
            <div class="chart-container">
              <canvas ref="chartRef"></canvas>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Report Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card class="report-dialog">
        <v-card-title class="header-section">
          <v-icon color="primary" size="24" class="mr-2">mdi-file-document</v-icon>
          Analytics Report
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert
            color="info"
            variant="tonal"
            class="mb-4"
          >
            <div v-html="reportContent"></div>
          </v-alert>
          <v-select
            v-model="selectedFormat"
            :items="formats"
            label="Export Format"
            variant="outlined"
            prepend-inner-icon="mdi-file-download"
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadReport"
          >
            Download Report
          </v-btn>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="dialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';

const apiUrl = 'http://localhost:8055';
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;
const chartRef = ref(null);
const chartInstance = ref(null);
const isLoggedIn = ref(false);

const currentYear = ref(new Date().getFullYear());
const startYear = ref(2002);
const endYear = ref(2024);
const maxYear = ref(0);
const minYear = ref(0);
const dialog = ref(false);
const reportContent = ref('');
const selectedFormat = ref('csv');
const formats = ['csv', 'doc', 'pdf'];

// Reactive state for deaths
const deathData = ref({});
const totalDeaths = computed(() => {
  return Object.entries(deathData.value)
    .filter(([year]) => {
      const yearNum = parseInt(year);
      return yearNum >= startYear.value && yearNum <= endYear.value;
    })
    .reduce((acc, [, count]) => acc + count, 0);
});

const fetchData = async () => {
  try {
    const response = await axios.get(burialRecordsEndpoint);
    const records = response.data.data;

    const deathsPerYear = {};
    records.forEach(record => {
      const dateOfDeath = new Date(record.date_of_death);
      const year = dateOfDeath.getFullYear();
      deathsPerYear[year] = (deathsPerYear[year] || 0) + 1;
    });

    // Update min and max years based on actual data
    const years = Object.keys(deathsPerYear).map(year => parseInt(year));
    minYear.value = Math.min(...years);
    maxYear.value = Math.max(...years);

    // Store the full death data
    deathData.value = deathsPerYear;

    return deathsPerYear;
  } catch (error) {
    console.error("Error fetching burial records:", error);
    return {};
  }
};

const generateChart = (deathsPerYear) => {
  // Filter deaths per year based on the current year range
  const filteredDeathsPerYear = Object.fromEntries(
    Object.entries(deathsPerYear).filter(([year]) => {
      const yearNum = parseInt(year);
      return yearNum >= startYear.value && yearNum <= endYear.value;
    })
  );

  // Get years and counts, sorting to ensure chronological order
  const years = Object.keys(filteredDeathsPerYear)
    .map(Number)
    .sort((a, b) => a - b);
  const counts = years.map(year => filteredDeathsPerYear[year] || 0);

  const data = {
    labels: years,
    datasets: [
      {
        label: 'Deaths per Year',
        data: counts,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const config = {
    type: 'bar',
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return Number.isInteger(value) ? value : '';
            }
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `Deaths per Year (${startYear.value} - ${endYear.value})`,
          font: {
            size: 18,
            weight: 'bold',
          }
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              return `Deaths: ${tooltipItem.raw}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      }
    },
  };

  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  if (chartRef.value) {
    chartInstance.value = new Chart(chartRef.value, config);
  } else {
    console.error("Chart reference is null");
  }
};

const applyYearFilter = async () => {
  // Validate year input
  if (startYear.value > endYear.value) {
    // Swap values if start year is greater than end year
    [startYear.value, endYear.value] = [endYear.value, startYear.value];
  }

  // Ensure years are within the min and max range
  startYear.value = Math.max(startYear.value, minYear.value);
  endYear.value = Math.min(endYear.value, maxYear.value);

  // Regenerate the chart with filtered data
  generateChart(deathData.value);
};

const refreshData = async () => {
  await fetchData();
  
  // Update start and end year to the last 5 years
  startYear.value = Math.max(currentYear.value - 5, minYear.value);
  endYear.value = currentYear.value;
  
  await nextTick();
  generateChart(deathData.value);
};

const openReportDialog = () => {
  const averageDeathsPerYear = (totalDeaths.value / (endYear.value - startYear.value + 1)).toFixed(2);

  reportContent.value = `Report for the period from ${startYear.value} to ${endYear.value}:<br>` +
                        `Total deaths: ${totalDeaths.value}<br>` +
                        `Average deaths per year: ${averageDeathsPerYear}`;
  dialog.value = true;
};

const downloadReport = () => {
  const averageDeathsPerYear = (totalDeaths.value / (endYear.value - startYear.value + 1)).toFixed(2);
  const reportData = `Report for the period from ${startYear.value} to ${endYear.value}\n` +
                     `Total deaths: ${totalDeaths.value}\n` +
                     `Average deaths per year: ${averageDeathsPerYear}`;

  let blob;
  if (selectedFormat.value === 'csv') {
    const csvContent = `data:text/csv;charset=utf-8,${reportData.replace(/\n/g, ',')}`;
    blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  } else if (selectedFormat.value === 'doc') {
    const docContent = `<html><body><pre>${reportData}</pre></body></html>`;
    blob = new Blob([docContent], { type: 'application/msword' });
  } else if (selectedFormat.value === 'pdf') {
    const pdfContent = reportData; // You would typically use a library to generate a PDF
    blob = new Blob([pdfContent], { type: 'application/pdf' });
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `report.${selectedFormat.value}`;
  link.click();
};

onMounted(async () => {
  await refreshData();
});

watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await refreshData();
  }
});

const loginUser = async () => {
  isLoggedIn.value = true;
};

setTimeout(loginUser, 2000);
</script>
<style scoped>
.analytics-dashboard {
  background-color: #ffffff;
}

.dashboard-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
}

.header-section {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-section h2 {
  color: #101828;
  font-size: 1.25rem !important;
  font-weight: 700;
}

.controls-section {
  background-color: #ffffff;
  border-radius: 8px;
}

.year-input {
  transition: none;
}

.stats-card {
  border: 1px solid #e5e7eb;
  cursor: pointer;
}

.stats-card:hover {
  background: #f9fafb;
}

.chart-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 450px;
  
}

.control-btn {
  transition: background 0.15s ease;
}

.report-dialog {
  border-radius: 8px;
  overflow: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 600px) {
  .chart-container {
    height: 300px;
  }
}
</style>
