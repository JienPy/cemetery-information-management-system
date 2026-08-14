<template>
  <v-card class="cemetery-records-form elevation-3">
    
    <v-container fluid class="form-container">
      
      <v-card class="form-wrapper" elevation="0">
        <!-- Header Section -->
        <v-card-title class="form-header d-flex align-center pa-6 bg-primary">
          <div class="d-flex align-center">
            <v-icon size="32" class="mr-4" color="white">mdi-book-cross</v-icon>
            <h1 class="text-h5 font-weight-bold text-white">Cemetery Records Management</h1>
          </div>
          
          <!-- New icon for navigating to data list -->
          <v-tooltip text="View All Records" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn 
                icon 
                variant="text" 
                color="white"
                v-bind="props"
                @click="showDataList = true"
              >
                <v-icon size="large">mdi-table-search</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </v-card-title>

        <v-dialog v-model="showDataList" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon @click="showDataList = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Burial Records</v-toolbar-title>
        </v-toolbar>
        
        <!-- Import and render DataList component directly -->
        <DataList 
          v-if="showDataList"
          @close="showDataList = false"
        />
      </v-card>
    </v-dialog>
        <v-card-text class="pa-6">
          <v-form v-model="isValid" @submit.prevent="createItem">
            <v-row>
              <!-- Personal Information Section -->
              <v-col cols="12" md="8">
                <v-card outlined class="section-card h-100">
                  <v-card-title class="section-header bg-grey-lighten-4 pa-4">
                    <div class="d-flex align-center">
                      <v-icon left color="primary" class="mr-2">mdi-account-details</v-icon>
                      <span class="text-h6 font-weight-medium">Personal Details</span>
                    </div>
                  </v-card-title>
                  
                  <v-card-text class="pa-4" >
                    <v-row dense>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="formData.first_name"
                          label="First Name"
                          :rules="[v => !!v || 'First name is required']"
                          prepend-icon="mdi-account"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="formData.middle_name"
                          label="Middle Name"
                          prepend-icon="mdi-account"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="formData.last_name"
                          label="Last Name"
                          :rules="[v => !!v || 'Last name is required']"
                          prepend-icon="mdi-account"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="6" md="2">
                        <v-text-field
                          v-model="formData.age"
                          label="Age"
                          type="number"
                          :rules="[v => !!v || 'Age is required']"
                          prepend-icon="mdi-numeric"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      
                      <v-col cols="6" md="3">
                        <v-text-field
                          v-model="formData.date_of_birth"
                          label="Date of Birth"
                          type="date"
                          prepend-icon="mdi-calendar"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="3" class="d-flex align-center">
                        <v-radio-group
                          v-model="formData.indigent"
                          :rules="[v => !!v || 'Indigent status is required']"
                          inline
                        >
                          <div class="mr-2">Indigent:</div>
                          <v-radio label="Yes" value="yes" color="primary"/>
                          <v-radio label="No" value="no" color="primary"/>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="4" class="d-flex align-center">
                        <v-radio-group
                          v-model="formData.gender"
                          :rules="[v => !!v || 'Gender is required']"
                          inline
                        >
                        <div class="mr-2">Gender :</div>
                          <v-radio label="Male" value="male" color="primary"/>
                          <v-radio label="Female" value="female" color="primary"/>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="formData.address"
                          label="Address"
                          prepend-icon="mdi-map-marker"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                    </v-row>
                    <!-- Contact Information Section -->
              
                  </v-card-text>
                  <v-col cols="12">
                    <v-card outlined class="section-card h-100">
                      <v-card-title class="section-header bg-grey-lighten-4 pa-4">
                        <div class="d-flex align-center">
                          <v-icon left color="primary" class="mr-2">mdi-contacts</v-icon>
                          <span class="text-h6 font-weight-medium">Contact Information</span>
                        </div>
                      </v-card-title>
                      
                      <v-card-text class="pa-4">
                        <v-row dense>
                          <v-col cols="12">
                            <v-text-field
                              v-model="formData.contact_person"
                              label="Contact Person"
                              :rules="[v => !!v || 'Contact person is required']"
                              variant="outlined"
                              density="compact"
                              prepend-inner-icon="mdi-account-box"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="formData.contact_number"
                              label="Contact Number"
                              :rules="[v => !!v || 'Contact number is required']"
                              variant="outlined"
                              density="compact"
                              prepend-inner-icon="mdi-phone"
                            />
                          </v-col>
                        
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-card>
                
              </v-col>
              
              

              

              <!-- Burial Details Section -->
              <v-col cols="12" md="4">
                <v-card outlined class="section-card h-100">
                  <v-card-title class="section-header bg-grey-lighten-4 pa-4">
                    <div class="d-flex align-center">
                      <v-icon left color="primary" class="mr-2">mdi-grave-stone</v-icon>
                      <span class="text-h6 font-weight-medium">Burial Details</span>
                    </div>
                  </v-card-title>
                  
                  <v-card-text class="pa-4">
                    <v-row dense>
                      
                      <v-col cols="12">
                        <v-select
                          v-model="formData.location"
                          :items="cemeteryOptions"
                          label="Cemetery Location"
                          :rules="[v => !!v || 'Cemetery location is required']"
                          item-title="title"
                          item-value="value"
                          prepend-icon="mdi-map-marker"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col 
                      v-if="formData.location" 
                      cols="12"
                    >
                      <v-btn 
                        color="primary" 
                        variant="outlined"
                        @click="openFieldSelectionDialog"
                      >
                        <v-icon start>mdi-plus</v-icon>
                        Select Additional Fields
                      </v-btn>
                    </v-col>

                    <!-- Field Selection Dialog -->
                    <v-dialog 
                      v-model="showFieldSelectionDialog" 
                      max-width="500px"
                    >
                      <v-card>
                        <v-card-title>Select Fields to Show</v-card-title>
                        <v-card-text>
                          <v-chip-group 
                            v-model="selectedFieldOptions" 
                            multiple 
                            column
                          >
                            <v-chip 
                              v-for="option in availableFieldOptions" 
                              :key="option.id"
                              :value="option.id"
                              filter
                              outlined
                            >
                              <v-icon start>{{ option.icon }}</v-icon>
                              {{ option.title }}
                            </v-chip>
                          </v-chip-group>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn 
                            color="secondary" 
                            text 
                            @click="showFieldSelectionDialog = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn 
                            color="primary" 
                            @click="confirmFieldSelection"
                          >
                            Confirm
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <!-- Conditionally render fields -->
                    <v-col cols="12"  v-if="showFields.graveyard">
                      <v-select
                        v-model="formData.graveyard_id"
                        :items="graveyardOptions"
                        label="Graveyard Section"
                        item-title="title"
                        item-value="value"
                        prepend-icon="mdi-format-list-numbered"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>

                    <v-col cols="12"  v-if="showFields.apartment_stores">
                      <v-select
                        v-model="formData.apartment_stores"
                        :items="apartStoresTombOptions"
                        label="Apartment Store"
                        item-title="title"
                        item-value="value"
                        variant="outlined"
                        prepend-icon="mdi-home"
                        class="custom-field"
                      />
                    </v-col>

                    <v-col cols="12"  v-if="showFields.ab_stores_tomb">
                      <v-select
                        v-model="formData.ab_stores_tomb"
                        :items="abStoresTombOptions"
                        label="Apartment Baby Store"
                        item-title="title"
                        item-value="value"
                        prepend-icon="mdi-home-variant"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>

                    <v-col cols="12"  v-if="showFields.bone_vault">
                      <v-select
                        v-model="formData.bone_vault"
                        :items="boneVaultOptions"
                        label="Bone Vault"
                        item-title="title"
                        item-value="value"
                        variant="outlined"
                        prepend-icon="mdi-archive"
                        class="custom-field"
                      />
                    </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="formData.or_number"
                          label="OR Number"
                          :rules="[v => !!v || 'OR number is required']"
                          prepend-icon="mdi-receipt"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="formData.date_of_death"
                          label="Date of Death"
                          type="date"
                          prepend-icon="mdi-calendar"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="formData.year_covered"
                          label="Year Covered"
                          type="number"
                          prepend-icon="mdi-calendar"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      
                      
                      <v-col cols="6">
                        <v-text-field
                          v-model="formData.amount"
                          label="Amount"
                          type="number"
                          prepend-icon="mdi-currency-php"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="formData.date_of_renewal"
                          label="Starting Date of Interment"
                          type="date"
                          prepend-icon="mdi-calendar"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>

                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              
            </v-row>
            

            <v-divider class="my-6"/>

            <div class="form-actions d-flex justify-space-between align-center">
              <v-btn 
                color="secondary" 
                variant="outlined"
                @click="resetForm"
              >
                <v-icon start>mdi-refresh</v-icon>
                Reset Form
              </v-btn>

              <div class="d-flex ga-4">
                <v-btn
                  color="primary"
                  :disabled="!isValid || isSubmitting"
                  :loading="isSubmitting"
                  @click="createItem"
                >
                  <v-icon start>mdi-content-save</v-icon>
                  Save Record
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  :disabled="!isValid || isSubmitting"
                  @click="saveAndAddNew"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Save & Add New
                </v-btn>
              </div>
            </div>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Existing Snackbar and Dialog components remain the same -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="4000"
        location="top right"
      >
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn
            color="white"
            variant="text"
            @click="snackbar.show = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <v-dialog v-model="confirmDialog.show" max-width="500px">
        <v-card>
          <v-card-title class="headline">{{ confirmDialog.title }}</v-card-title>
          <v-card-text>{{ confirmDialog.message }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" variant="text" @click="confirmDialog.show = false">Cancel</v-btn>
            <v-btn color="primary" @click="confirmDialogAction">Continue</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed,  watch  } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import DataList from '@/components/DataindexLayout/DataList.vue';
// Constants
const API_URL = 'http://localhost:8055';
const ENDPOINTS = {
  burialRecords: `${API_URL}/items/burial_records`,
  cemeteries: `${API_URL}/items/cemeteries`,
  abStores: `${API_URL}/items/apartment_baby_stores`,
  boneVault: `${API_URL}/items/bone_vault_stores`,
  graveyard: `${API_URL}/items/graveyards`,
  apartmentStores: `${API_URL}/items/apartment_stores`
};


// Router setup
const router = useRouter();

const showDataList = ref(false);
// State management
const isValid = ref(false);
const isSubmitting = ref(false);
const activeTab = ref('personal');
const authToken = ref(localStorage.getItem('auth-token'));
const fieldErrors = ref({});

// Form data and options
const formData = ref({
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
  ab_stores_tomb: '',
  bone_vault: '',
  graveyard_id: '',
  location: '',
  contact_person: '', 
  contact_number: '',
  or_number: '',
  year_covered: '',
  amount: '',
});

// UI state management
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
});

const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: null
});

// Select options

const graveyardOptions = ref([]);
const apartStoresTombOptions = ref([]);
const abStoresTombOptions = ref([]);
const boneVaultOptions = ref([]);

const fetchAndFilterGraveyards = async () => {
  try {
    // Fetch all used graveyards from burial records
    const usedGraveyardsResponse = await axios.get(`${ENDPOINTS.burialRecords}?fields=graveyard_id`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract used graveyard IDs
    const usedGraveyardIds = new Set(
      usedGraveyardsResponse.data.data
        .map(record => record.graveyard_id)
        .filter(id => id !== null)
    );

    // Filter out used graveyards from options
    graveyardOptions.value = graveyardOptions.value.filter(
      graveyard => !usedGraveyardIds.has(graveyard.value)
    );

  } catch (error) {
    console.error('Error fetching used graveyards:', error);
    showError('Failed to filter graveyard options');
  }
};

const fetchAndFilterApartmentStores = async () => {
  try {
    // Fetch all used apartment stores from burial records
    const usedApartmentStoresResponse = await axios.get(`${ENDPOINTS.burialRecords}?fields=ab_stores_tomb`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract used apartment store IDs
    const usedApartmentStoreIds = new Set(
      usedApartmentStoresResponse.data.data
        .map(record => record.ab_stores_tomb)
        .filter(id => id !== null)
    );

    // Filter out used apartment stores from options
    apartStoresTombOptions.value = apartStoresTombOptions.value.filter(
      store => !usedApartmentStoreIds.has(store.value)
    );

  } catch (error) {
    console.error('Error fetching used apartment stores:', error);
    showError('Failed to filter apartment store options');
  }
};

const fetchAndFilterAbStores = async () => {
  try {
    // Fetch all used apartment baby stores from burial records
    const usedAbStoresResponse = await axios.get(`${ENDPOINTS.burialRecords}?fields=baby_apartment_stores`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract used apartment baby store IDs
    const usedAbStoreIds = new Set(
      usedAbStoresResponse.data.data
        .map(record => record.baby_apartment_stores)
        .filter(id => id !== null)
    );

    // Filter out used apartment baby stores from options
    abStoresTombOptions.value = abStoresTombOptions.value.filter(
      store => !usedAbStoreIds.has(store.value)
    );

  } catch (error) {
    console.error('Error fetching used apartment baby stores:', error);
    showError('Failed to filter apartment baby store options');
  }
};

const fetchAndFilterBoneVaults = async () => {
  try {
    // Fetch all used bone vaults from burial records
    const usedBoneVaultsResponse = await axios.get(`${ENDPOINTS.burialRecords}?fields=bone_vault`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract used bone vault IDs
    const usedBoneVaultIds = new Set(
      usedBoneVaultsResponse.data.data
        .map(record => record.bone_vault)
        .filter(id => id !== null)
    );

    // Filter out used bone vaults from options
    boneVaultOptions.value = boneVaultOptions.value.filter(
      vault => !usedBoneVaultIds.has(vault.value)
    );

  } catch (error) {
    console.error('Error fetching used bone vaults:', error);
    showError('Failed to filter bone vault options');
  }
};


// Fetch data on component mount
onMounted(async () => {
  if (!authToken.value) {
    
    router.push('/login');
    return;
  }
  
  const headers = {
    Authorization: `Bearer ${authToken.value}`,
    'Content-Type': 'application/json'
  };
  try {
    // Fetch all data in parallel using Promise.all
    const [
      cemeteryResponse,
      graveyardResponse,
      apartStoresResponse,
      abStoresResponse,
      boneVaultResponse
    ] = await Promise.all([
      axios.get(ENDPOINTS.cemeteries, { headers }),
      axios.get(ENDPOINTS.graveyard, { headers }),
      axios.get(ENDPOINTS.apartmentStores, { headers }),
      axios.get(ENDPOINTS.abStores, { headers }),
      axios.get(ENDPOINTS.boneVault, { headers })
    ]);

    // Map cemetery data
    cemeteryOptions.value = cemeteryResponse.data.data.map(cemetery => ({
      title: cemetery.cemetery_name || cemetery.id,
      value: cemetery.id,
      ...cemetery
    }));

    // Map graveyard data
    graveyardOptions.value = graveyardResponse.data.data.map(graveyard => ({
      title: graveyard.graveyard_name || graveyard.id,
      value: graveyard.id,
      ...graveyard
    }));

    // Map apartment stores data
    apartStoresTombOptions.value = apartStoresResponse.data.data.map(store => ({
      title: store.ab_store_name || store.id,
      value: store.id,
      ...store
    }));

    // Map apartment baby stores data
    abStoresTombOptions.value = abStoresResponse.data.data.map(store => ({
      title: store.apartment_baby_id || store.id,
      value: store.id,
      ...store
    }));

    // Map bone vault data
    boneVaultOptions.value = boneVaultResponse.data.data.map(vault => ({
      title: vault.bone_vault_id || vault.id,
      value: vault.id,
      ...vault
    }));


      // Call the new function to filter out used graveyards
      await fetchAndFilterGraveyards();
      await fetchAndFilterApartmentStores();
      await fetchAndFilterAbStores();
      await fetchAndFilterBoneVaults();

  } catch (error) {
    console.error('Error fetching options:', error);
    showError(error.response?.data?.message || 'Failed to load form options');
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
});


const showSuccess = (message) => {
  snackbar.value = {
    show: true,
    message,
    color: 'success'
  };
};

const showError = (message) => {
  snackbar.value = {
    show: true,
    message,
    color: 'error'
  };
};

const confirmAction = (title, message, action) => {
  confirmDialog.value = {
    show: true,
    title,
    message,
    action
  };
};

const confirmDialogAction = () => {
  if (confirmDialog.value.action) {
    confirmDialog.value.action();
  }
  confirmDialog.value.show = false;
};

// Form actions
const resetForm = () => {
  confirmAction(
    'Reset Form',
    'Are you sure you want to reset the form? All entered data will be lost.',
    () => {
      Object.keys(formData.value).forEach(key => {
        if (typeof formData.value[key] === 'boolean') {
          formData.value[key] = false;
        } else {
          formData.value[key] = '';
        }
      });
      activeTab.value = 'personal';
      fieldErrors.value = {};
    }
  );
};

// Update the createItem function
const createItem = async () => {
  if (!validateForm()) {
    showError('Please fill in all required fields');
    return;
  }

  isSubmitting.value = true;

  // Format dates properly for Directus
  const formattedData = {
    ...formData.value,
    date_of_birth: formData.value.date_of_birth ? new Date(formData.value.date_of_birth).toISOString().split('T')[0] : null,
    date_of_death: formData.value.date_of_death ? new Date(formData.value.date_of_death).toISOString().split('T')[0] : null,
    date_of_renewal: formData.value.date_of_renewal ? new Date(formData.value.date_of_renewal).toISOString().split('T')[0] : null,
    year_covered: formData.value.year_covered ? Number(formData.value.year_covered) : null,
  };

  // Convert empty strings to null
  Object.keys(formattedData).forEach(key => {
    if (formattedData[key] === '') {
      formattedData[key] = null;
    }
  });

  // Convert numeric strings to numbers
  const numericFields = ['age', 'amount',  'number_of_renew'];
  numericFields.forEach(field => {
    if (formattedData[field]) {
      formattedData[field] = Number(formattedData[field]);
    }
  });

  try {
    const response = await axios.post(
      ENDPOINTS.burialRecords,
      formattedData,
      {
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        }
      }
    );

    showSuccess('Record created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating record:', error);
    
    if (error.response?.data?.errors) {
      // Clear previous errors
      fieldErrors.value = {};
      
      // Map API validation errors to fields
      error.response.data.errors.forEach(err => {
        fieldErrors.value[err.field] = err.message;
      });
      
      // Show the first error message
      showError(error.response.data.errors[0]?.message || 'Validation error');
    } else {
      showError(error.response?.data?.message || 'Failed to create record');
    }
    throw error;
  } finally {
    isSubmitting.value = false;
  }
};

// Update the saveAndAddNew function
const saveAndAddNew = async () => {
  try {
    await createItem();
    // Only reset if save was successful
    Object.keys(formData.value).forEach(key => {
      if (typeof formData.value[key] === 'boolean') {
        formData.value[key] = false;
      } else {
        formData.value[key] = '';
      }
    });
    activeTab.value = 'personal';
    fieldErrors.value = {};
    showSuccess('Record created successfully. Form reset for new entry.');
  } catch (error) {
    // Error already handled in createItem
  }
};


// Add a proper validation function
const validateForm = () => {
  // Required fields
  const requiredFields = [
    'first_name',
    'last_name',
    'age',
    'gender',
    'indigent',
    'contact_person',
    'contact_number',
    'or_number'
  ];

  // Clear previous errors
  fieldErrors.value = {};

  // Check required fields
  let isValid = true;
  requiredFields.forEach(field => {
    if (!formData.value[field]) {
      fieldErrors.value[field] = `${field.replace('_', ' ').toUpperCase()} is required`;
      isValid = false;
    }
  });

  // Validate age
  if (formData.value.age && (isNaN(formData.value.age) || formData.value.age < 0)) {
    fieldErrors.value.age = 'Age must be a valid number';
    isValid = false;
  }

  // Validate dates
  const dateFields = ['date_of_birth', 'date_of_death'];
  dateFields.forEach(field => {
    if (formData.value[field] && !isValidDate(formData.value[field])) {
      fieldErrors.value[field] = 'Please enter a valid date';
      isValid = false;
    }
  });

  return isValid;
};

// Add a date validation helper
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const selectedFieldOptions = ref([]);
const showFieldSelectionDialog = ref(false);


const fieldOptionsByCemetery = {
  1: [
    { 
      id: 'graveyard', 
      title: 'Graveyard Section', 
      icon: 'mdi-format-list-numbered' 
    },
    { 
      id: 'apartment_stores', 
      title: 'Apartment Store', 
      icon: 'mdi-home' 
    },
    { 
      id: 'bone_vault', 
      title: 'Bone Vault', 
      icon: 'mdi-archive' 
    }
  ],
  2: [
  { 
      id: 'graveyard', 
      title: 'Graveyard Section', 
      icon: 'mdi-format-list-numbered' 
    },
    { 
      id: 'ab_stores_tomb', 
      title: 'Apartment Baby Store', 
      icon: 'mdi-home-variant' 
    },
    { 
      id: 'bone_vault', 
      title: 'Bone Vault', 
      icon: 'mdi-archive' 
    }
  ]
};

// Computed property to get available field options
const availableFieldOptions = computed(() => {
  return fieldOptionsByCemetery[formData.value.location] || [];
});

// Method to open field selection dialog
const openFieldSelectionDialog = () => {
  // Reset previous selections
  selectedFieldOptions.value = [];
  showFieldSelectionDialog.value = true;
};

// Method to confirm field selection
const confirmFieldSelection = () => {
  // Close the dialog
  showFieldSelectionDialog.value = false;
  
  // Reset all related fields first
  formData.value.graveyard_id = '';
  formData.value.apartment_stores = '';
  formData.value.ab_stores_tomb = '';
  formData.value.bone_vault = '';
};
const showFields = computed(() => ({
  graveyard: selectedFieldOptions.value.includes('graveyard'),
  apartment_stores: selectedFieldOptions.value.includes('apartment_stores'),
  ab_stores_tomb: selectedFieldOptions.value.includes('ab_stores_tomb'),
  bone_vault: selectedFieldOptions.value.includes('bone_vault')
}));

const cemeteryOptions = ref([
  { title: 'Roman Catholic Cemetery', value: 1 },
  { title: 'New Public Cemetery of Tayabas', value: 2 }
]);
// Add these computed properties in the script setup section
const showGraveyardField = computed(() => {
  return formData.value.location === 1|| formData.value.location === 2;
});

const showApartmentStoresField = computed(() => {
  return formData.value.location === 1;
});

const showAbStoresField = computed(() => {
  return formData.value.location === 1 || formData.value.location === 2;
});

const showBoneVaultField = computed(() => {
  return formData.value.location === 1;
});

watch(() => formData.value.location, (newLocation) => {
  // Reset selected fields and close dialog
  selectedFieldOptions.value = [];
  showFieldSelectionDialog.value = false;
});
</script>

<style scoped>
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

.form-container {
  font-family: 'Inter', 'Roboto', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
}

.form-header {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.section-header {
  font-size: 1.2rem;
  font-weight: 500;
}

.form-header {
  background-color: #1976D2 !important;
}

.section-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.section-card {
  border-radius: 12px;
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.section-card:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 15px 20px -5px rgba(0, 0, 0, 0.12), 
    0 6px 8px -3px rgba(0, 0, 0, 0.07);
}
/* Responsive adjustments */
@media (max-width: 960px) {
  .form-container {
    padding: 1rem;
  }

  .v-row > .v-col {
    margin-bottom: 1rem;
  }
}

/* Enhanced form field styling */
.v-input--outlined .v-input__control {
  border-radius: 10px;
  background-color: white;
  transition: all 0.2s ease;
}

.v-input--outlined .v-input__control:focus-within {
  box-shadow: 0 0 0 2px var(--primary-color);
  border-color: var(--primary-color);
}
</style>