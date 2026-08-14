<template>
  <v-card class="card">
    <div class="container">
      <v-form class="form">
        <v-data-table
          :headers="headers"
          :items="dataFlow"
          :sort-by="[{ key: 'first_name', order: 'asc' }]"
          :loading="isLoading"
          loading-text="Loading... Please wait" 
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>Real Time Data Flow</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn color="primary" dark @click="refreshData">Refresh</v-btn>
              <v-btn icon :to="{ name: 'data-index' }">
                <Icon size="small" name="database-search-icon" />
              </v-btn>
            </v-toolbar>
          </template>
        
        </v-data-table>

        
      </v-form>
    </div>
  </v-card>
</template>

<script setup>
import Icon from '@/components/icons/icons.vue';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const apiUrl = 'http://localhost:8055';
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
const isLoading = ref(true);
const dataFlow = ref([]);

onMounted(async () => {
  if (!authToken.value) {
    console.log('No authentication token found. Redirecting to login page...');
    router.push('/login');
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken.value}`;
    try {
      const response = await axios.get(burialRecordsEndpoint);
      const data = response.data.data;
      const formattedData = data.map((item) => {
      const dateOfDeath = new Date(item.date_of_death);
      const yearCovered = new Date(item.year_covered);
      const today = new Date();

      // Calculate days passed since year covered
      const daysPassed = yearCovered > today ? 0 : Math.floor((today - yearCovered) / (1000 * 60 * 60 * 24));
      
      // Calculate days left until expiration
      const daysLeft = Math.max(Math.floor((yearCovered - today) / (1000 * 60 * 60 * 24)), 0);

      return {
        first_name: item.first_name,
        middle_name: item.middle_name,
        last_name: item.last_name,
        date_of_death: item.date_of_death,
        year_covered: item.year_covered,
        days_left: daysLeft,
        days_passed: daysPassed,
      };
    });
      isLoading.value = false;
      dataFlow.value = formattedData;
    } catch (error) {
      console.error(error);
    }
  }
});

const headers = ref([
  { title: 'First Name', key: 'first_name', minWidth: '130px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Middle Name', key: 'middle_name', minWidth: '150px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Last Name', key: 'last_name', minWidth: '130px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Date of Death', key: 'date_of_death', minWidth: '150px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Year Covered', key: 'year_covered', minWidth: '150px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Days Left', key: 'days_left', minWidth: '130px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Days Passed', key: 'days_passed', minWidth: '150px', resizable: true, sortable: true, align: 'center'  },
]);

function refreshData() {
  // Call your API or data source to refresh the data
  // Update the dataFlow array with the new data
}
</script>

<style scoped>
/* Add any custom styles here */
.container {
  max-width: 900px;
  margin: 20px auto;
  padding: 30px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Card Styles */
.card {
  background-color: #ffffff;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* Form Styles */
.form {
  padding: 0;
}

/* Form Group Styles */
.form-group {
  margin-bottom: 30px;
}
</style>
