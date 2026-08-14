<template>
  <v-card class="cemetery-records-form elevation-3">
    <v-container fluid class="form-container">
      <v-card class="form-wrapper" elevation="0">
        <!-- Header Section (Same as before) -->
        <v-card-title class="form-header d-flex align-center pa-6 bg-primary">
          <v-icon left class="mr-2" color="white">mdi-grave-stone</v-icon>
          <h1 class="text-h5 font-weight-bold text-white">Expiring and Expired Burial Records</h1>
          <v-spacer></v-spacer>
          
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search Records"
            single-line
            hide-details
            clearable
            variant="solo-inverted"
            density="compact"
            class="search-input"
          ></v-text-field>
          <v-btn icon @click="refreshData">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>

        <v-data-table
          :headers="headers"
          :items="filteredRecords"
          :loading="loading"
          :search="search"
          loading-text="Loading burial records..."
          class="elevation-1"
          item-value="id"
        >
          <template v-slot:item.status="{ item }">
            <v-chip 
              :color="getStatusColor(item)"
              size="small"
              label
            >
              {{ getStatusLabel(item) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn-group variant="outlined" density="compact">
              
              <v-tooltip text="Renew Burial Plot">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props"
                    icon="mdi-calendar-refresh"
                    color="success"
                     @click="openRenewalDialog(item)"
                  >
                    <v-icon>mdi-calendar-refresh</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Generate Renewal Notice">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props" 
                    icon="mdi-file-document-edit"
                    color="primary"
                    @click="generateReport(item)"
                  >
                    <v-icon>mdi-file-document-edit</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </v-btn-group>
          </template>
        </v-data-table>

        <!-- Renewal Dialog -->
        <v-dialog v-model="renewalDialog" max-width="600px">
          <v-card v-if="selectedRecord">
            <v-card-title class="text-h5 bg-primary text-white">
              Burial Plot Renewal
              <v-spacer></v-spacer>
              <v-btn icon @click="closeRenewalDialog">
                <v-icon color="white">mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text class="pt-6">
              <v-row>
                <v-col cols="12" md="6">
                  <h3 class="text-subtitle-1 mb-3">Deceased Information</h3>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Name:</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ selectedRecord.first_name }} 
                        {{ selectedRecord.middle_name }} 
                        {{ selectedRecord.last_name }}
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Date of Death:</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ selectedRecord.date_of_death }}
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Current Status:</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip 
                          :color="getStatusColor(selectedRecord)"
                          size="small"
                          label
                        >
                          {{ getStatusLabel(selectedRecord) }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col cols="12" md="6">
                  <h3 class="text-subtitle-1 mb-3">Renewal Details</h3>
                  <v-form ref="renewalForm">
                    <v-text-field
                      v-model.number="renewalYears"
                      label="Renewal Periods (7-year blocks)"
                      type="number"
                      min="0"
                      max="5"
                      hint="Each period adds 7 years to current coverage"
                      persistent-hint
                      :rules="[v => v >= 0 || 'Must be 0 or more']"
                    ></v-text-field>

                    <v-list density="compact" class="mt-4">
                      <v-list-item>
                        <v-list-item-title>Current Coverage</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedRecord.year_covered }} years
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>New Total Coverage</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ calculateNewCoverage() }} years
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-form>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="confirmRenewal"
                :disabled="renewalYears === 0"
              >
                Confirm Renewal
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <CemeteryRenewalReport 
          v-if="reportRecord" 
          :record-data="reportRecord"
          @close="reportRecord = null"
        />
      </v-card>
    </v-container>
  </v-card>
</template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import CemeteryRenewalReport from '@/components/GenerateReportLayouts/CemeteryRenewalReport.vue'
  import axios from 'axios'
  
  const apiUrl = 'http://localhost:8055'
  const burialRecordsEndpoint = `${apiUrl}/items/burial_records`
  
  const headers = ref([
    { title: 'First Name', key: 'first_name', align: 'start' },
    { title: 'Middle Name', key: 'middle_name', align: 'start' },
    { title: 'Last Name', key: 'last_name', align: 'start' },
    { title: 'Date of Death', key: 'date_of_death', align: 'start' },
    { title: 'Days Passed', key: 'days_passed', align: 'start' },
    { title: 'Days Left', key: 'days_left', align: 'start' },
    { title: 'Renewal Status', key: 'status', align: 'start' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
  ])
  
  const expiringRecords = ref([])
  const loading = ref(true)
  const selectedRecord = ref(null)
const reportRecord = ref(null)  // Separate ref for report generation

  const search = ref('')
  
// New method for renewal dialog
const renewalDialog = ref(false)
const renewalYears = ref(0)

const openRenewalDialog = (item) => {
  console.log('Opening renewal dialog for:', item)
  selectedRecord.value = item
  renewalDialog.value = true
  renewalYears.value = 0
  reportRecord.value = null  // Ensure report is not shown
}
const closeRenewalDialog = () => {
  renewalDialog.value = false
  selectedRecord.value = null
  renewalYears.value = 0
}


const calculateNewCoverage = () => {
  const baseYearCovered = 7
  const currentCoverage = selectedRecord.value.year_covered
  const additionalRenewalYears = renewalYears.value * 7
  return currentCoverage + additionalRenewalYears
}

const confirmRenewal = async () => {
  try {
    // Prepare renewal data
    const renewalData = {
      number_of_renew: (selectedRecord.value.number_of_renew || 0) + renewalYears.value,
      id: selectedRecord.value.id
    }

    // Update the record in the database
    await axios.patch(`${apiUrl}/items/burial_records/${renewalData.id}`, renewalData)

    // Refresh data after renewal
    await refreshData()

    // Close dialog and reset
    renewalDialog.value = false
    renewalYears.value = 0
    
    // Optional: Show success message
    alert(`Successfully renewed burial plot for ${selectedRecord.value.first_name} ${selectedRecord.value.last_name}`)
  } catch (error) {
    console.error('Error during renewal:', error)
    alert('Failed to renew burial plot. Please try again.')
  }
}

  // Enhanced calculation function for year coverage and days
  function calculateYearCoveredAndDays(dateOfDeath, numberOfRenewals) {
    if (!dateOfDeath) return { daysPassed: 0, daysLeft: 0, yearCovered: 0 };
  
    // Always start with 7 years as base
    const baseYearCovered = 7;
    const renewalYears = numberOfRenewals ? parseInt(numberOfRenewals, 10) || 0 : 0;
  
    // Total years of coverage: base years + additional renewal years
    const totalYearsCovered = baseYearCovered + (renewalYears * 7);
    const deathDate = new Date(dateOfDeath);
    const today = new Date();
  
    // Create the expiration date by adding total years to the death date
    const expirationDate = new Date(deathDate);
    expirationDate.setFullYear(deathDate.getFullYear() + totalYearsCovered);
  
    // Calculate days passed from the death date
    const daysPassed = Math.max(0, Math.floor((today - expirationDate) / (1000 * 60 * 60 * 24)));
  
    // Calculate days left until expiration
    const daysLeft = Math.max(0, Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24)));
  
    return { 
      daysPassed, 
      daysLeft, 
      yearCovered: totalYearsCovered 
    };
  }
  
  // Determine record status based on days left and days passed with more nuanced logic
  const getRecordStatus = (daysLeft, daysPassed) => {
    if (daysPassed > 0) return 'expired'
    if (daysLeft <= 30) return 'critical'  // Changed from 7 to 30 for more advance warning
    if (daysLeft <= 90) return 'expiring'  // Added a new intermediate status
    return 'active'
  }
  
  const generateReport = (item) => {
  // Open report for the specific item
  reportRecord.value = item
  renewalDialog.value = false  // Ensure renewal dialog is closed
}
  
  const getStatusColor = (record) => {
    const status = getRecordStatus(record.days_left, record.days_passed)
    
    switch(status) {
      case 'expired': return 'error'
      case 'critical': return 'deep-orange'
      case 'expiring': return 'warning'
      default: return 'success'
    }
  }
  
  const getStatusLabel = (record) => {
    const status = getRecordStatus(record.days_left, record.days_passed)
    
    if (status === 'expired') {
      return `Expired (${record.days_passed} days ago)`
    }
    
    if (status === 'critical') {
      return `Critically Expiring (${record.days_left} days left)`
    }
    
    if (status === 'expiring') {
      return `Expiring Soon (${record.days_left} days left)`
    }
    
    return 'Active'
  }
  
  const filteredRecords = computed(() => {
    return expiringRecords.value.map(record => ({
      ...record,
      status: getRecordStatus(record.days_left, record.days_passed)
    }))
  })
  
  const sendReminder = (item) => {
    // Placeholder for email sending functionality
    alert(`Sending reminder to ${item.first_name} ${item.last_name}`)
  }
  
  const refreshData = async () => {
    loading.value = true
    try {
      const response = await axios.get(burialRecordsEndpoint)
      const data = response.data.data
  
      // Transform records with more precise calculation
      expiringRecords.value = data.map((item) => {
        const { daysPassed, daysLeft, yearCovered } = calculateYearCoveredAndDays(
          item.date_of_death, 
          item.number_of_renew  // Use number_of_renew instead of year_covered
        );
  
        return {
          ...item,
          days_passed: daysPassed,
          days_left: daysLeft,
          year_covered: yearCovered,
          number_of_renew: item.number_of_renew || 0
        }
      }).filter(record => {
        // Filter to show expired, critical, and expiring records
        const status = getRecordStatus(record.days_left, record.days_passed)
        return status !== 'active'
      })
  
      loading.value = false
    } catch (error) {
      console.error('Error fetching burial records:', error)
      loading.value = false
    }
  }
  
  onMounted(refreshData)
  </script>
  
  <style scoped>
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
  .renewal-highlight {
  background-color: #e6f3ff;
  border: 2px solid #1976D2;
  border-radius: 8px;
}
  </style>