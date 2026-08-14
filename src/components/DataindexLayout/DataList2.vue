<template>
  <v-card class="records-dashboard">

    <div class="px-6 pb-6">
      <!-- Enhanced Control Panel -->
      <v-card class="control-panel mb-6" elevation="1">
        <div class="d-flex flex-wrap gap-4 align-center pa-4">
          <!-- Improved Search Section -->
          <div class="search-wrapper">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search Records"
              placeholder="Search by name, location, or ID..."
              single-line
              hide-details
              variant="outlined"
              density="comfortable"
              class="search-field"
            />
          </div>

          <!-- Enhanced Filter Button -->
          <v-menu v-model="filterMenu" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                prepend-icon="mdi-filter-variant"
                color="primary"
                variant="outlined"
                class="filter-btn"
              >
                Filters
                <v-chip
                  v-if="activeFilters > 0"
                  class="ml-2"
                  size="small"
                  color="primary"
                >
                  {{ activeFilters }}
                </v-chip>
              </v-btn>
            </template>

            <v-card min-width="300" class="filter-menu">
              <v-card-title class="d-flex justify-space-between align-center pa-4">
                <span class="text-h6">Filter Records</span>
                <v-btn
                  variant="text"
                  density="comfortable"
                  color="primary"
                  @click="clearFilters"
                >
                  Clear All
                </v-btn>
              </v-card-title>
              
              <v-divider></v-divider>

              <v-card-text class="pa-4">
                <v-select
                  v-model="filters.gender"
                  label="Gender"
                  :items="['male', 'female']"
                  clearable
                  class="mb-4"
                  variant="outlined"
                />
                
                <v-select
                  v-model="filters.indigent"
                  label="Indigent Status"
                  :items="['yes', 'no']"
                  clearable
                  class="mb-4"
                  variant="outlined"
                />

                <v-text-field
                  v-model="filters.location"
                  label="Location"
                  clearable
                  class="mb-4"
                  variant="outlined"
                />

                <v-range-slider
                  v-model="filters.ageRange"
                  label="Age Range"
                  min="0"
                  max="120"
                  strict
                  class="mt-6"
                  thumb-label
                  color="primary"
                />
              </v-card-text>
            </v-card>
          </v-menu>

          <v-spacer />

          <!-- Export Button -->
          <v-btn
            prepend-icon="mdi-download"
            color="success"
            variant="tonal"
            @click="exportToCSV"
            class="export-btn"
          >
            Export Data
          </v-btn>
        </div>
      </v-card>

      <!-- Enhanced Data Table -->
      <v-data-table
        :headers="headers"
        :items="filteredData"
        :sort-by="[{ key: 'first_name', order: 'asc' }]"
        :custom-sort="customSort"
        :loading="isLoading"
        loading-text="Loading records..."
        hover
        class="records-table"
      >
        <!-- Custom header styling -->
        <template v-slot:header="{ props }">
          <tr>
            <th
              v-for="header in props.headers"
              :key="header.key"
              class="text-primary font-weight-bold"
            >
              {{ header.title }}
            </th>
          </tr>
        </template>

        <!-- Enhanced Status column -->
        <template v-slot:item.days_left="{ item }">
          <v-chip
            :color="getDaysLeftColor(item.days_left)"
            size="small"
            class="font-weight-medium status-chip"
          >
            {{ item.days_left }} days
          </v-chip>
        </template>

        <!-- Enhanced Actions column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2 justify-center">
            <v-tooltip text="Edit Record" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="editItem(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Delete Record" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="deleteItem(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Enhanced Edit Dialog with Mode Support -->
    <v-dialog v-model="dialog" max-width="1600px" persistent class="form-container">
      <v-card class="form-wrapper elevation-4">
      <!-- Professional Header -->
      <v-toolbar 
        color="primary" 
        class="form-header px-4 py-2 text-white"
      >
        <v-toolbar-title class="text-h5">
          {{ 
            mode === 'view' ? 'View Record Details' : 
            mode === 'edit' ? 'Edit Burial Record' : 
            'Create New Burial Record' 
          }}
        </v-toolbar-title>
        <v-spacer />
          
          <!-- Mode Toggle for Edit/View -->
        <v-btn-toggle 
          v-if="mode !== 'new'"
          v-model="mode" 
          mandatory 
          color="white"
          class="elevation-2"
        >
          <v-btn value="view" variant="outlined" class="text-white">
            <v-icon left>mdi-eye</v-icon>View
          </v-btn>
          <v-btn value="edit" variant="outlined" class="text-white">
            <v-icon left>mdi-pencil</v-icon>Edit
          </v-btn>
        </v-btn-toggle>
          
        <v-btn 
          icon 
          variant="text" 
          @click="close" 
          class="text-white ml-2"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

        <!-- Form Content -->
      <v-card-text class="pa-6">
        <v-form 
          ref="form" 
          v-model="valid" 
          lazy-validation 
          :disabled="mode === 'view'"
        >
        <!-- Sections with Enhanced Styling -->
        <v-card 
            v-for="(section, index) in formSections" 
            :key="index"
            class="section-card mb-6 pa-4"
          >
            <div class="section-header mb-4 pb-2">
              <h3 class="text-h6">{{ section.title }}</h3>
            </div>
            
            <v-row>
              <v-col 
                v-for="field in section.fields" 
                :key="field.key" 
                cols="12" 
                md="4"
              >
                <v-text-field
                  v-model="editedItem[field.key]"
                  :label="field.label"
                  :type="field.type || 'text'"
                  variant="outlined"
                  density="comfortable"
                  :rules="field.rules || []"
                  :readonly="mode === 'view'"
                  :hint="field.hint"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-card>
            
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="grey"
            @click="close"
          >
            Cancel
          </v-btn>
          <v-btn
            v-if="mode === 'edit' || mode === 'new'"
            color="primary"
            class="ml-4"
            @click="save"
            :disabled="!valid"
            :loading="saving"
          >
            {{ mode === 'new' ? 'Create Record' : 'Save Changes' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card class="confirm-dialog">
        <v-card-title class="text-h5 pa-6">Delete Confirmation</v-card-title>
        <v-card-text class="pa-6">
          Are you sure you want to delete this record? This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="grey"
            @click="closeDelete"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            class="ml-4"
            @click="deleteItemConfirm"
            :loading="deleting"
          >
            Confirm Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const apiUrl = 'http://localhost:8055';
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
// Add mode ref to the existing script
const mode = ref('view'); // Can be 'view', 'edit', or 'new'

const search = ref(''); // Search field
const options = ref({}); // For managing table sorting
const isLoading = ref(true);
const headers = ref([
  { title: 'First Name', key: 'first_name', minWidth: '130px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Middle Name', key: 'middle_name', minWidth: '140px', resizable: true, align: 'center'  },
  { title: 'Last Name', key: 'last_name', minWidth: '130px', resizable: true, sortable: true, align: 'center'  },
  { title: 'Age', key: 'age', width: '100px', resizable: true, sortable: true , align: 'center'  },
  { title: 'Gender', key: 'gender', width: '100px', resizable: true, align: 'center'  },
  { title: 'Indigent', key: 'indigent', width: '100px', resizable: true, align: 'center'  },
  { title: 'Address', key: 'address', minWidth: '200px', resizable: true, align: 'center'  },
  { title: 'Date of Birth', key: 'date_of_birth', minWidth: '140px', resizable: true, align: 'center'  },
  { title: 'Date of Death', key: 'date_of_death', minWidth: '140px', resizable: true, align: 'center'  },
  { title: 'Date of Renewal', key: 'date_of_renewal', minWidth: '160px', resizable: true, align: 'center'  },
  { title: 'Transfer', key: 'transfer', width: '150px', resizable: true, align: 'center'  },
  { title: 'New User of Burial', key: 'new_user_of_burial', minWidth: '170px', resizable: true, align: 'center'  },
  { title: 'Location', key: 'location', width: '150px', resizable: true, align: 'center'  },
  { title: 'Contact Person', key: 'contact_person', minWidth: '150px', resizable: true, align: 'center'  },
  { title: 'Amount', key: 'amount', width: '100px', resizable: true, sortable: true, align: 'center'  },
  { title: 'AB Stores Tomb', key: 'ab_stores_tomb', minwidth: '300px', resizable: true, align: 'center'  },
  { title: 'Bone Vault', key: 'bone_vault', width: '150px', resizable: true, align: 'center'  },
  { title: 'Graveyard ID', key: 'graveyard_id', width: '150px', resizable: true, align: 'center'  },
  { title: 'OR Number', key: 'or_number', width: '100px', resizable: true, align: 'center'  },
  { title: 'Renew', key: 'renew', width: '100px', resizable: true, align: 'center'  },
  { title: 'Number of Renewals', key: 'number_of_renew', width: '150px', resizable: true, align: 'center' },
  { title: 'Year Covered', key: 'year_covered', width: '100px', resizable: true, align: 'center'  },
  { title: 'Days Passed', key: 'days_passed', minWidth: '100px', resizable: true, align: 'center' },
  { title: 'Days Left', key: 'days_left', minWidth: '100px', resizable: true, align: 'center' },
  { title: 'Actions', key: 'actions', minWidth: '100px', resizable: true, align: 'center'  },
]);

const dataFlow = ref([]);
const formTitle = ref('');


// Add new refs for loading states and snackbar
const saving = ref(false);
const deleting = ref(false);
const valid = ref(true);
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});


const dialog = ref(false);
const dialogDelete = ref(false);
const editedIndex = ref(-1);
const editedItem = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  age: '',
  gender: '',
  indigent: '',
  address: '',
  date_of_birth: '',
  date_of_death: '',
  date_of_renewal: '',
  transfer: '',
  new_user_of_burial: '',
  location: '',
  contact_person: '',
  amount: '',
  ab_stores_tomb: '',
  bone_vault: '',
  graveyard_id: '',
  or_number: '',
  renew: '',
  year_covered: '',
  days_passed: 0,
  days_left: 0,
});

const defaultItem = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  age: '',
  gender: '',
  indigent: '',
  address: '',
  date_of_birth: '',
  date_of_death: '',
  date_of_renewal: '',
  transfer: '',
  new_user_of_burial: '',
  location: '',
  contact_person: '',
  amount: '',
  ab_stores_tomb: '',
  bone_vault: '',
  graveyard_id: '',
  or_number: '',
  number_of_renew: '',
  renew: '',
  year_covered: '',
});

// New refs for filters
const filterMenu = ref(false);
const filters = ref({
  gender: null,
  indigent: null,
  location: '',
  ageRange: [0, 120]
});

const formSections = [
  {
    title: 'Personal Information',
    fields: [
      { 
        key: 'first_name', 
        label: 'First Name', 
        rules: [(v) => !!v || 'First name is required'], 
        required: true 
      },
      { 
        key: 'middle_name', 
        label: 'Middle Name' 
      },
      { 
        key: 'last_name', 
        label: 'Last Name', 
        rules: [(v) => !!v || 'Last name is required'], 
        required: true 
      }
    ]
  },
  {
    title: 'Demographics',
    fields: [
      { 
        key: 'age', 
        label: 'Age', 
        type: 'number',
        rules: [
          (v) => !!v || 'Age is required',
          (v) => v > 0 || 'Age must be greater than 0'
        ],
        required: true
      },
      { 
        key: 'gender', 
        label: 'Gender', 
        rules: [(v) => !!v || 'Gender is required'], 
        required: true 
      },
      { 
        key: 'indigent', 
        label: 'Indigent Status' 
      },
      { 
        key: 'address', 
        label: 'Address' 
      }
    ]
  },
  {
    title: 'Important Dates',
    fields: [
      { 
        key: 'date_of_birth', 
        label: 'Date of Birth', 
        type: 'date' 
      },
      { 
        key: 'date_of_death', 
        label: 'Date of Death', 
        type: 'date', 
        rules: [(v) => !!v || 'Date of death is required'], 
        required: true 
      },
      { 
        key: 'date_of_renewal', 
        label: 'Date of Renewal', 
        type: 'date' 
      }
    ]
  },
  {
    title: 'Location & Contact Information',
    fields: [
      { 
        key: 'location', 
        label: 'Location', 
        rules: [(v) => !!v || 'Location is required'], 
        required: true 
      },
      { 
        key: 'contact_person', 
        label: 'Contact Person', 
        rules: [(v) => !!v || 'Contact person is required'], 
        required: true 
      },
      { 
        key: 'graveyard_id', 
        label: 'Graveyard ID' 
      }
    ]
  },
  {
    title: 'Payment & Transfer Details',
    fields: [
      { 
        key: 'amount', 
        label: 'Amount', 
        type: 'number', 
        rules: [(v) => v >= 0 || 'Amount must be non-negative'] 
      },
      { 
        key: 'or_number', 
        label: 'OR Number' 
      },
      { 
        key: 'transfer', 
        label: 'Transfer' 
      },
      { 
        key: 'new_user_of_burial', 
        label: 'New User of Burial' 
      }
    ]
  },
  {
    title: 'Additional Details',
    fields: [
      { 
        key: 'ab_stores_tomb', 
        label: 'AB Stores Tomb' 
      },
      { 
        key: 'bone_vault', 
        label: 'Bone Vault' 
      },
      { 
        key: 'year_covered', 
        label: 'Year Covered', 
        type: 'number', 
        min: 0, 
        hint: 'Number of years the burial plot is covered', 
        persistentHint: true 
      },
      { 
        key: 'days_passed', 
        label: 'Days Passed', 
        readonly: true 
      },
      { 
        key: 'days_left', 
        label: 'Days Left', 
        readonly: true 
      }
    ]
  },
  {
    title: 'Renewal Status',
    fields: [
      { 
        key: 'renew', 
        label: 'Renewal Status' 
      },
      { 
        key: 'number_of_renew', 
        label: 'Number of Renewals', 
        type: 'number', 
        min: 0, 
        hint: 'Number of 7-year renewal periods', 
        persistentHint: true 
      },
      { 
        key: 'days_left', 
        label: 'Days Left', 
        type: 'number', 
        readonly: true 
      }
    ]
  }
]; 
// Computed property for active filters count
const activeFilters = computed(() => {
  return Object.values(filters.value).filter(val => {
    if (Array.isArray(val)) {
      return val[0] !== 0 || val[1] !== 120;
    }
    return val !== null && val !== '';
  }).length;
});

// Update the filteredData computed property with proper type checking
const filteredData = computed(() => {
  return dataFlow.value.filter(item => {
    // First apply search filter
    const searchTerm = search.value.toLowerCase();
    
    // Helper function to safely convert any value to string
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      return String(value).toLowerCase();
    };

    // Check if any of the fields match the search term
    const matchesSearch = searchTerm === '' || [
      safeString(item.first_name),
      safeString(item.middle_name),
      safeString(item.last_name),
      safeString(item.address),
      safeString(item.location),
      safeString(item.contact_person),
      safeString(item.graveyard_id),
      safeString(item.or_number),
      safeString(item.ab_stores_tomb),
      // Add more fields as needed
    ].some(field => field.includes(searchTerm));

    // Then apply other filters
    const matchesGender = !filters.value.gender || item.gender === filters.value.gender;
    const matchesIndigent = !filters.value.indigent || item.indigent === filters.value.indigent;
    const matchesLocation = !filters.value.location || 
      safeString(item.location).includes(filters.value.location.toLowerCase());
    const matchesAge = item.age >= filters.value.ageRange[0] && 
      item.age <= filters.value.ageRange[1];

    return matchesSearch && matchesGender && matchesIndigent && matchesLocation && matchesAge;
  });
});

// Add debouncing for search input
let searchTimeout;
watch(search, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // The filteredData computed property will automatically update
    // when search.value changes
  }, 300); // 300ms delay for better performance
});

// Function to clear filters
const clearFilters = () => {
  filters.value = {
    gender: null,
    indigent: null,
    location: '',
    ageRange: [0, 120]
  };
};

// Function to get color for days left chip
const getDaysLeftColor = (days) => {
  if (days <= 30) return 'error';
  if (days <= 90) return 'warning';
  return 'success';
};


function editItem(item) {
  editedIndex.value = dataFlow.value.indexOf(item);
  editedItem.value = Object.assign({}, item);
  mode.value = 'view'; // Default to view mode when opening
  dialog.value = true;
}
const addNewRecordButton = () => {
  createNewItem();
};

function createNewItem() {
  editedItem.value = Object.assign({}, defaultItem.value);
  mode.value = 'new';
  dialog.value = true;
}

function deleteItem(item) {
  editedIndex.value = dataFlow.value.indexOf(item);
  editedItem.value = Object.assign({}, item);
  dialogDelete.value = true;
}

// Update delete confirmation to include loading state
async function deleteItemConfirm() {
  deleting.value = true;
  try {
    await axios.delete(`${burialRecordsEndpoint}/${editedItem.value.id}`);
    dataFlow.value.splice(editedIndex.value, 1);
    showSnackbar('Record deleted successfully', 'success');
    closeDelete();
  } catch (error) {
    console.error(error);
    showSnackbar(
      error.response?.data?.message || 'An error occurred while deleting',
      'error'
    );
  } finally {
    deleting.value = false;
  }
}

function close() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem.value);
    editedIndex.value = -1;
    mode.value = 'view';
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem.value);
    editedIndex.value = -1;
  });
}


async function save() {
  // Existing save logic, but now handling both edit and new modes
  if (!valid.value) return;

  saving.value = true;
  try {
    if (mode.value === 'edit') {
      // Existing edit logic
      const response = await axios.patch(
        `${burialRecordsEndpoint}/${editedItem.value.id}`,
        editedItem.value
      );
      // Update logic remains the same
    } else if (mode.value === 'new') {
      // New record creation logic
      const response = await axios.post(burialRecordsEndpoint, editedItem.value);
      dataFlow.value.push(response.data.data);
      showSnackbar('New record created successfully', 'success');
    }
    
    close();
  } catch (error) {
    console.error(error);
    showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
  } finally {
    saving.value = false;
  }
}


 function calculateYearCoveredAndDays(dateOfDeath, yearCovered, numberOfRenewals) {
    
    
    if (!dateOfDeath) return { daysPassed: 0, daysLeft: 0, yearCovered: 0 };

    // Ensure values are properly parsed and defaulted
    const baseYearCovered = 7; // Always start with 7 years as base
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

    return { daysPassed, daysLeft, yearCovered: totalYearsCovered };
}

// Modify the watch to ensure correct calculation
watch(() => [
  editedItem.value.date_of_death, 
  editedItem.value.number_of_renew
], ([newDeathDate, newNumberOfRenewals]) => {
  if (newDeathDate) {
    const { daysPassed, daysLeft, yearCovered } = calculateYearCoveredAndDays(
      newDeathDate, 
      7,  // Always use 7 as the base year covered
      newNumberOfRenewals || 0  // Default to 0 if undefined
    );

    editedItem.value.days_passed = daysPassed;
    editedItem.value.days_left = daysLeft;
    editedItem.value.year_covered = yearCovered;
    editedItem.value.year_covered = yearCovered;  // Ensure year_covered is set
  }
}, { immediate: true });
// Update onMounted logic for fetching burial records
onMounted(async () => {
  if (!authToken.value) {
    console.log('No authentication token found. Redirecting to login page...');
    router.push('/login');
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken.value}`;
    try {
      const response = await axios.get(burialRecordsEndpoint);
      const data = response.data.data;

      dataFlow.value = data.map((item) => {
        const { daysPassed, daysLeft, yearCovered } = calculateYearCoveredAndDays(
          item.date_of_death, 
          item.year_covered,
          item.number_of_renew
        );

        return {
          ...item,
          days_passed: daysPassed,
          days_left: daysLeft,
          year_covered: yearCovered
        };
      });
      isLoading.value = false;
    } catch (error) {
      console.error(error);
    }
  }
});
// Custom sorting logic
const customSort = (items, sortBy, sortDesc) => {
  if (sortBy.length === 0) return items;

  const sorted = items.slice().sort((a, b) => {
    const sortKey = sortBy[0];
    const isDesc = sortDesc[0];
    if (a[sortKey] < b[sortKey]) return isDesc ? 1 : -1;
    if (a[sortKey] > b[sortKey]) return isDesc ? -1 : 1;
    return 0;
  });

  return sorted;
};

// Export data to CSV
const exportToCSV = () => {
  const csvContent = [
    headers.value.map(header => header.title).join(','),
    ...dataFlow.value.map(item => 
      headers.value.map(header => item[header.key]).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
  a.href = url;
  a.download = 'deceased_records.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// Helper function to show snackbar
function showSnackbar(text, color = 'success') {
  snackbar.value = {
    show: true,
    text,
    color
  };
}
</script>


<style scoped>
.form-container {
  font-family: 'Inter', 'Roboto', sans-serif;
}

.v-card.form-wrapper {
  border-radius: 12px;
  overflow: hidden;
}

.form-header {
  background: linear-gradient(45deg, #1976D2, #42A5F5);
}

.v-card.outlined {
  border: 1px solid rgba(0,0,0,0.12);
  transition: all 0.3s ease;
}

.v-card.outlined:hover {
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
  transform: translateY(-5px);
}
</style>