<template>
  <v-sheet class="analytics-dashboard pa-4">
    <div class="container">
      <v-form class="form">
        <v-data-table
          :headers="headers"
          :items="dataFlow"
          :sort-by="[{ key: 'first_name', order: 'asc' }]"
        >
          <template v-slot:top>
            <v-toolbar flat class="records-toolbar">
              <v-toolbar-title>Renewal Workload</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="refreshData">
                Refresh
              </v-btn>
              <v-btn icon variant="text" :to="{ name: 'data-index' }">
                <v-icon>mdi-database-search</v-icon>
              </v-btn>
            </v-toolbar>
          </template>

          <!-- Custom column for Days Passed with tooltip -->
          <template v-slot:item.days_passed="{ item }">
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <span v-bind="props">{{ item.days_passed }}</span>
              </template>
              <span>{{ formatTooltipDate(item.passed_exact_date) }}</span>
            </v-tooltip>
          </template>

          <!-- Custom column for Days Left with tooltip -->
          <template v-slot:item.days_left="{ item }">
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <span v-bind="props">{{ item.days_left }}</span>
              </template>
              <span>{{ formatTooltipDate(item.left_exact_date) }}</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-form>
    </div>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const apiUrl = 'http://localhost:8055';
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
const dataFlow = ref([]);

const formatTooltipDate = (date) => {
  if (!date) return 'N/A';
  const formattedDate = new Date(date);
  return formattedDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
};

const calculateYearCoveredAndDays = (dateOfDeath, numberOfRenewals) => {
  if (!dateOfDeath) return { 
    daysPassed: 0, 
    daysLeft: 0, 
    yearCovered: 0,
    passed_exact_date: null,
    left_exact_date: null
  };

  const baseYearCovered = 7; // Always start with 7 years as base
  const renewalYears = numberOfRenewals ? parseInt(numberOfRenewals, 10) || 0 : 0;

  const totalYearsCovered = baseYearCovered + (renewalYears * 7);
  const deathDate = new Date(dateOfDeath);
  const today = new Date();

  const expirationDate = new Date(deathDate);
  expirationDate.setFullYear(deathDate.getFullYear() + totalYearsCovered);

  const daysPassed = Math.max(0, Math.floor((today - expirationDate) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24)));

  return { 
    daysPassed, 
    daysLeft, 
    yearCovered: totalYearsCovered,
    passed_exact_date: daysPassed > 0 ? today : null,
    left_exact_date: daysLeft > 0 ? expirationDate : null
  };
};

onMounted(async () => {
  if (!authToken.value) {
    console.log('No authentication token found. Redirecting to login page...');
    router.push('/login');
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken.value}`;
    await fetchBurialRecords();
  }
});

const fetchBurialRecords = async () => {
  try {
    const response = await axios.get(burialRecordsEndpoint);
    const data = response.data.data;

    // Format data for table
    const formattedData = data.map((item) => {
      const { 
        daysPassed, 
        daysLeft, 
        yearCovered,
        passed_exact_date,
        left_exact_date
      } = calculateYearCoveredAndDays(
        item.date_of_death,
        item.number_of_renew || 0 // Assuming this field exists in the API response
      );

      return {
        first_name: item.first_name,
        middle_name: item.middle_name,
        last_name: item.last_name,
        address: item.address,
        date_of_death: item.date_of_death,
        location: item.location,
        contact_person: item.contact_person,
        renewal: item.renew,
        days_passed: daysPassed,
        days_left: daysLeft,
        year_covered: yearCovered,
        passed_exact_date: passed_exact_date,
        left_exact_date: left_exact_date
      };
    });

    // Update dataFlow array
    dataFlow.value = formattedData;
  } catch (error) {
    console.error(error);
  }
};

const headers = ref([
  { title: 'Last Name', key: 'last_name', minWidth: '130px', resizable: true, sortable: true, align: 'center' },
  { title: 'First Name', key: 'first_name', minWidth: '130px', resizable: true, sortable: true, align : 'center' },
  { title: 'Middle Name', key: 'middle_name', minWidth: '100px', resizable: true, align: 'center' },
  { title: 'Address', key: 'address', minWidth: '100px', resizable: true, align: 'center' },
  { title: 'Date of Death', key: 'date_of_death', minWidth: '140px', resizable: true, sortable: true, align: 'center' },
  { title: 'Location', key: 'location', width: '50px', resizable: true, align: 'center' },
  { title: 'Contact Person', key: 'contact_person', minWidth: '140px', resizable: true, align: 'center' },
  { title: 'Renewal', key: 'renewal', width: '150px', resizable: true, align: 'center' },
  { title: 'Days Passed', key: 'days_passed', minWidth: '100px', resizable: true, align: 'center' },
  { title: 'Days Left', key: 'days_left', minWidth: '100px', resizable: true, align: 'center' },
]);

const refreshData = async () => {
  await fetchBurialRecords();
};
</script>

<style scoped>
.analytics-dashboard {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.records-toolbar {
  border-bottom: 1px solid #eaecf0;
}

:deep(.v-toolbar-title) {
  color: #101828;
  font-size: 1.05rem;
  font-weight: 700;
}

:deep(.v-data-table) {
  border: 1px solid #eaecf0;
  border-radius: 8px;
  box-shadow: none;
}

:deep(.v-data-table thead th) {
  background: #f9fafb;
  color: #475467;
  font-size: 0.76rem;
  font-weight: 700 !important;
}
</style>
