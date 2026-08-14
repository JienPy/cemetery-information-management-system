<template>
    <v-dialog v-model="boneVaultDialog" max-width="600px">
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white">
        Select Bone Vault Slot
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item 
            v-for="slot in availableBoneVaultSlots" 
            :key="slot.id"
            @click="selectedBoneVaultSlot = slot"
            :class="{ 'selected-slot': selectedBoneVaultSlot?.id === slot.id }"
          >
            <v-list-item-title>
              Bone Vault Number: {{ slot.bone_vault_number }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Status: {{ slot.status }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn 
          color="primary" 
          variant="text" 
          @click="confirmMoveToVault"
          :disabled="!selectedBoneVaultSlot"
        >
          Confirm Move
        </v-btn>
        <v-btn 
          color="grey" 
          variant="text" 
          @click="boneVaultDialog = false"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </template>
  
  <script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { format, differenceInMinutes, differenceInHours, differenceInYears } from 'date-fns';
const apiUrl = 'http://localhost:8055';
const search = ref('');
const selectedCollection = ref('graveyards');
const isLoading = ref(true);
const dialog = ref(false);
const editDialog = ref(false);  
const selectedMapCollection = ref('');
const tombs = ref([]);

const collections = [
  { label: 'Graveyards', value: 'graveyards' },
  { label: 'Apartment Stores', value: 'apartment_stores' },
  { label: 'Bone Vault Stores', value: 'bone_vault_stores' },
  { label: 'Apartment Baby Stores', value: 'apartment_baby_stores' },
];

const editedItem = ref({});
const defaultItem = ref({
  tomb_number: '',
  status: 'available',
  graveyard_name: '',
  apartment_block_type: '',
  bone_vault_number: '',
  apartment_baby_number: '',
  notes: ''
});
// Add these to the existing ref declarations at the top of the script setup
const boneVaultDialog = ref(false);
const availableBoneVaultSlots = ref([]);
const selectedBoneVaultSlot = ref(null);

// New method to fetch available bone vault slots
const fetchAvailableBoneVaultSlots = async () => {
  try {
    const response = await axios.get(`${apiUrl}/items/bone_vault_stores`, {
      params: {
        filter: {
          status: 'available'
        }
      }
    });
    availableBoneVaultSlots.value = response.data.data;
    return response.data.data;
  } catch (error) {
    console.error('Error fetching available bone vault slots:', error);
    return [];
  }
};


// Modify the moveToVault method
const moveToVault = async (tomb) => {
  try {
    // First, fetch available bone vault slots
    const availableSlots = await fetchAvailableBoneVaultSlots();

    if (availableSlots.length === 0) {
      // Show an error if no slots are available
      // You might want to replace this with a proper UI notification
      alert('No available bone vault slots. Please clear some slots first.');
      return;
    }

    // Open bone vault selection dialog
    boneVaultDialog.value = true;
    selectedBoneVaultSlot.value = null;
  } catch (error) {
    console.error('Error preparing move to vault:', error);
  }
};

// New method to confirm move to a specific bone vault slot
const confirmMoveToVault = async () => {
  if (!selectedBoneVaultSlot.value) {
    alert('Please select a bone vault slot');
    return;
  }

  try {
    const tomb = selectedTomb.value;

    await createHistoryOldUserRecord(tomb);

    // 1. Update the selected bone vault slot
    await axios.patch(`${apiUrl}/items/bone_vault_stores/${selectedBoneVaultSlot.value.id}`, {
      status: 'active',
      notes: `Occupied from ${selectedCollection.value} - ${getTombIdentifier(tomb)}`
    });

    // 2. Create a tomb history record before clearing
    await createTombHistoryRecord(tomb);

    // 3. Determine the correct field to clear based on collection
    const matchFields = {
      graveyards: { 
        endpoint: 'burial_records', 
        field: 'graveyard_id',
        clearFields: { 
          graveyard_id: null,
          bone_vault: selectedBoneVaultSlot.value.id
        }
      },
      apartment_stores: { 
        endpoint: 'burial_records', 
        field: 'ab_stores_tomb',
        clearFields: { 
          ab_stores_tomb: null,
          bone_vault: selectedBoneVaultSlot.value.id
        }
      },
      apartment_baby_stores: { 
        endpoint: 'burial_records', 
        field: 'baby_apartment_stores',
        clearFields: { 
          baby_apartment_stores: null,
          bone_vault: selectedBoneVaultSlot.value.id
        }
      }
    };

    const collectionMatch = matchFields[selectedCollection.value];

    if (collectionMatch) {
      // Find burial records associated with this tomb
      const burialRecordsResponse = await axios.get(`${apiUrl}/items/${collectionMatch.endpoint}`, {
        params: {
          filter: {
            [collectionMatch.field]: { _eq: tomb.id }
          }
        }
      });

      // Update burial records to clear the original field and set bone vault
      for (const record of burialRecordsResponse.data.data) {
        await axios.patch(`${apiUrl}/items/${collectionMatch.endpoint}/${record.id}`, 
          collectionMatch.clearFields
        );
      }
    }

    // 4. Update original tomb to reset its status
    await axios.patch(`${apiUrl}/items/${selectedCollection.value}/${tomb.id}`, {
      status: 'available',
      notes: `Transferred to Bone Vault - ${selectedBoneVaultSlot.value.bone_vault_number}`
    });

    // 5. Refresh the current collection data
    await fetchData(selectedCollection.value);

    // 6. Close all dialogs
    boneVaultDialog.value = false;
    detailsDialog.value = false;

    console.log(`Tomb ${getTombIdentifier(tomb)} successfully moved to Bone Vault Slot ${selectedBoneVaultSlot.value.bone_vault_number}`);

  } catch (error) {
    console.error('Error moving tomb to bone vault:', error);
  }
};

// New method to create history record for old users
const createHistoryOldUserRecord = async (tomb) => {
  try {
    // Determine the original tomb details based on the collection
    let tombName = '';
    let tombId = null;

    switch (selectedCollection.value) {
      case 'graveyards':
        tombName = tomb.tomb_number ? `Graveyard Tomb ${tomb.tomb_number}` : '';
        tombId = tomb.id;
        break;
      case 'apartment_stores':
        tombName = tomb.ab_store_name ? `Apartment Store ${tomb.ab_store_name}` : '';
        tombId = tomb.id;
        break;
      case 'apartment_baby_stores':
        tombName = tomb.apartment_baby_number ? `Apartment Baby Store ${tomb.apartment_baby_number}` : '';
        tombId = tomb.id;
        break;
      case 'bone_vault_stores':
        tombName = tomb.bone_vault_number ? `Bone Vault ${tomb.bone_vault_number}` : '';
        tombId = tomb.id;
        break;
    }

    // Only create a history record if there's a burial record with a name
    if (tomb.burialRecord) {
      const fullName = [
        tomb.burialRecord.first_name,
        tomb.burialRecord.middle_name,
        tomb.burialRecord.last_name
      ].filter(Boolean).join(' ');

      await axios.post(`${apiUrl}/items/history_old_user`, {
        full_name: fullName,
        status: tomb.status,
        date: tomb.burialRecord.date_of_death || new Date().toISOString(),
        tomb_name: tombName,
        tomb_id: tombId,
        original_collection: selectedCollection.value
      });
    }
  } catch (error) {
    console.error('Error creating history old user record:', error);
  }
};

// Updated fetchBurialRecordsForTomb to include full history fetching
const fetchTombHistory = async (tomb) => {
  try {
    // Determine the unique identifiers for this tomb across different collections
    const tombIdentifiers = [
      tomb.id,  // Primary ID
      tomb.tomb_number,  // For graveyards
      tomb.ab_store_name,  // For apartment stores
      tomb.bone_vault_number,  // For bone vault stores
      tomb.apartment_baby_number  // For apartment baby stores
    ].filter(Boolean);  // Remove any null or undefined values

    // Fetch history from the history_old_user endpoint
    const historyResponse = await axios.get(`${apiUrl}/items/history_old_user`, {
      params: {
        filter: {
          _or: [
            { tomb_id: { _in: tombIdentifiers } },
            { tomb_name: { _in: tombIdentifiers.map(id => id.toString()) } }
          ]
        },
        sort: '-date' // Sort by most recent first
      }
    });

    // Format the history
    const formattedHistory = historyResponse.data.data.map(historyItem => ({
      name: historyItem.full_name,
      startDate: historyItem.date,
      endDate: historyItem.date,
      status: historyItem.status,
      tombName: historyItem.tomb_name
    }));

    // If current tomb has a burial record, add it to the history
    if (tomb.burialRecord) {
      const currentOccupantName = [
        tomb.burialRecord.first_name,
        tomb.burialRecord.middle_name,
        tomb.burialRecord.last_name
      ].filter(Boolean).join(' ');

      formattedHistory.unshift({
        name: currentOccupantName,
        startDate: tomb.burialRecord.date_of_death,
        endDate: new Date().toISOString(),
        status: tomb.status,
        tombName: getTombIdentifier(tomb)
      });
    }

    return formattedHistory;
  } catch (error) {
    console.error('Error fetching tomb history:', error);
    return [];
  }
};
const tombHistory = computed(() => {
  // This now relies on the fetchTombHistory method
  return selectedTomb.value ? fetchTombHistory(selectedTomb.value) : [];
});

// Modify the createTombHistoryRecord method to complement the new approach
const createTombHistoryRecord = async (tomb) => {
  try {
    // Create a record in the main tomb history endpoint
    await axios.post(`${apiUrl}/items/tomb_history`, {
      tomb_id: tomb.id,
      collection: selectedCollection.value,
      name: getTombTooltipContent(tomb),
      start_date: tomb.burialRecord?.date_of_death,
      end_date: new Date().toISOString(),
      years_occupied: tomb.burialRecord?.year_covered || 0
    });

    // Also create a record in the history_old_user endpoint
    await createHistoryOldUserRecord(tomb);
  } catch (error) {
    console.error('Error creating tomb history record:', error);
  }
};

const selectedCollectionTitle = computed(() => {
  return collections.find(c => c.value === selectedCollection.value).label;
});
// Add new methods for tomb labels
const getTombShortId = (tomb) => {
  if (tomb.tomb_number) return `G${tomb.tomb_number}`;
  if (tomb.ab_store_name) return `A${tomb.id}`;
  if (tomb.bone_vault_number) return `V${tomb.bone_vault_number}`;
  if (tomb.apartment_baby_number) return `B${tomb.apartment_baby_number}`;
  return tomb.id;
};

const getTombTypeIcon = (tomb) => {
  if (tomb.graveyard_name) return '⚰️';
  if (tomb.ab_store_name) return '🏢';
  if (tomb.bone_vault_number) return '📦';
  if (tomb.apartment_baby_number) return '👶';
  return '📍';
};

const getHeaders = computed(() => {
  return headers[selectedCollection.value];
});

const headers = {
  graveyards: [
    { title: 'Graveyard Name', key: 'graveyard_name', sortable: true },
    { title: 'Tomb Number', key: 'tomb_number', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Actions', key: 'action', sortable: false },
  ],
  apartment_stores: [
    { title: 'Apartment Store Name', key: 'ab_store_name', sortable: true },
    { title: 'Apartment Block Type', key: 'apartment_block_type', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Actions', key: 'action', sortable: false },
  ],
  bone_vault_stores: [
    { title: 'Bone Vault ID', key: 'bone_vault_id', sortable: true },
    { title: 'Bone Vault Number', key: 'bone_vault_number', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Actions', key: 'action', sortable: false },
  ],
  apartment_baby_stores: [
    { title: 'Apartment Baby ID', key: 'apartment_baby_id', sortable: true },
    { title: 'Apartment Baby Number', key: 'apartment_baby_number', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Actions', key: 'action', sortable: false },
  ],
};

const rules = {
  required: value => !!value || 'Required.',
};

// Status options for the select field
const statusOptionsFormatted = computed(() => [
  { value: 'available', text: 'Available', group: 'Primary' },
  { value: 'active', text: 'Active', group: 'Primary' },
  { value: 'inactive', text: 'Inactive', group: 'Primary' },
  { value: 'recently_occupied', text: 'Recently Occupied', group: 'Occupancy' },
  { value: 'long_term_occupied', text: 'Long Term Occupied', group: 'Occupancy' },
  { value: 'expired', text: 'Expired', group: 'Attention Required' },
  { value: 'pending_renewal', text: 'Pending Renewal', group: 'Attention Required' },
]);

// Add these computed properties
const formTitle = computed(() => {
  return editedItem.value.id ? 'Edit Item' : 'New Item';
});

const editedFields = computed(() => {
  // Return relevant fields based on the selected collection
  const commonFields = ['status', 'notes'];
  const collectionFields = {
    graveyards: ['tomb_number', 'graveyard_name'],
    apartment_stores: ['apartment_block_type'],
    bone_vault_stores: ['bone_vault_number'],
    apartment_baby_stores: ['apartment_baby_number']
  };
  
  return [...commonFields, ...(collectionFields[selectedCollection.value] || [])];
});



const getStatusColor = (status) => {
  const statusColors = {
    active: '#008000',
    inactive : '#D3D3D3',
    available: '#00BFFF',
    recently_occupied: '#BA55D3',
    long_term_occupied: '#4169E1',
    expired: '#DC143C',
    pending_renewal: '#FFD700',
  };
  return statusColors[status] || '#ffffff';
};

const statusLegend = [
  { label: 'Active', color: '#008000' },
  { label: 'Inactive', color: '#D3D3D3' },
  { label: 'Available', color: '#00BFFF' },
  { label: 'Recently Occupied', color: '#BA55D3' },
  { label: 'Long-Term Occupied', color: '#4169E1' },
  { label: 'Expired', color: '#DC143C' },
  { label: 'Pending Renewal', color: '#FFD700' },
];
const fetchBurialRecordsForTomb = async (tomb) => {
  try {
    let burialEndpoint = '';
    let matchField = '';

    // Determine the correct endpoint and matching field based on collection
    switch (selectedCollection.value) {
      case 'graveyards':
        burialEndpoint = 'burial_records';
        matchField = 'graveyard_id';
        break;
      case 'bone_vault_stores':
        burialEndpoint = 'burial_records';
        matchField = 'bone_vault';
        break;
      case 'apartment_stores':
        burialEndpoint = 'burial_records';
        matchField = 'ab_stores_tomb';
        break;
      case 'apartment_baby_stores':
        burialEndpoint = 'burial_records';
        matchField = 'baby_apartment_stores';
        break;
      default:
        return null;
    }

    // Construct query parameters
    const params = {
      filter: {
        [matchField]: {
          _eq: tomb.id
        }
      },
      fields: ['first_name', 'middle_name', 'last_name', 'date_of_death']
    };

    const response = await axios.get(`${apiUrl}/items/${burialEndpoint}`, { params });
    
    return response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (error) {
    console.error('Error fetching burial records:', error);
    return null;
  }
};

// Modify existing updateTombStatusBasedOnOccupancy to handle expiration
const updateTombStatusBasedOnOccupancy = async (tomb) => {
  if (!tomb.burialRecord || !tomb.burialRecord.date_of_death) {
    return tomb;
  }

  const burialRecord = tomb.burialRecord;
  const { daysPassed, daysLeft, yearCovered } = calculateYearCoveredAndDays(
    burialRecord.date_of_death, 
    7, 
    burialRecord.number_of_renew || 0
  );

  // Update burial record with calculated values
  tomb.burialRecord.days_passed = daysPassed;
  tomb.burialRecord.days_left = daysLeft;
  tomb.burialRecord.year_covered = yearCovered;

  // Status change logic with expiration handling
  let newStatus = tomb.status;

  // Existing status change logic remains the same
  if (daysLeft <= 0) {
    // Tomb has expired
    newStatus = 'expired';
  }

  // Update status if it has changed
  if (newStatus !== tomb.status) {
    try {
      await axios.patch(`${apiUrl}/items/${selectedCollection.value}/${tomb.id}`, {
        status: newStatus
      });
      
      tomb.status = newStatus;
    } catch (error) {
      console.error(`Error updating tomb ${tomb.id} status:`, error);
    }
  }

  return tomb;
};

// Reuse the existing calculateYearCoveredAndDays function from your previous code
function calculateYearCoveredAndDays(dateOfDeath, yearCovered, numberOfRenewals) {
  console.log('Input values:', { dateOfDeath, yearCovered, numberOfRenewals });
  
  if (!dateOfDeath) return { daysPassed: 0, daysLeft: 0, yearCovered: 0 };
  
  const baseYearCovered = 7; 
  const renewalYears = numberOfRenewals ? parseInt(numberOfRenewals, 10) || 0 : 0;
  
  const totalYearsCovered = baseYearCovered + (renewalYears * 7);
  
  const deathDate = new Date(dateOfDeath);
  const today = new Date();
  
  const expirationDate = new Date(deathDate);
  expirationDate.setFullYear(deathDate.getFullYear() + totalYearsCovered);
  
  const daysPassed = Math.max(0, Math.floor((today - expirationDate) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24)));
  
  return { daysPassed, daysLeft, yearCovered: totalYearsCovered };
}
// Modify the tombs ref to include burial record information
const tombsWithBurialInfo = ref([]);


// Update fetchData to include burial record fetching
const fetchData = async (newCollection) => {
  isLoading.value = true;

  const collectionData = collections.find(c => c.value === newCollection);
  if (!collectionData) {
    console.error(`No data found for collection: ${newCollection}`);
    isLoading.value = false;
    return;
  }

  const response = await axios.get(`${apiUrl}/items/${newCollection}`);
  const baseTombs = response.data.data;

  // Fetch burial records and update status for each tomb
  const tombsWithBurial = await Promise.all(
    baseTombs.map(async (tomb) => {
      const burialRecord = await fetchBurialRecordsForTomb(tomb);
      
      const tombWithBurial = {
        ...tomb,
        burialRecord: burialRecord
      };

      // Update status based on occupancy
      await updateTombStatusBasedOnOccupancy(tombWithBurial);

      return tombWithBurial;
    })
  );

  tombsWithBurialInfo.value = tombsWithBurial;
  tombs.value = tombsWithBurial;

  isLoading.value = false;
};
// Add a periodic check to update statuses (every 15 minutes)
const startPeriodicStatusUpdate = () => {
  setInterval(async () => {
    await fetchData(selectedCollection.value);
  }, 15 * 60 * 1000); // 15 minutes
};

// Modified tooltip generation to include burial record name
const getTombTooltipContent = (tomb) => {
  // Function to properly capitalize a name
  const capitalizeName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Generate name from burial record if available
  let nameContent = 'Unoccupied';
  if (tomb.burialRecord) {
    const { first_name, middle_name, last_name } = tomb.burialRecord;
    
    // Capitalize and handle null/undefined values
    const formattedFirstName = capitalizeName(first_name);
    const formattedMiddleName = middle_name ? ` ${capitalizeName(middle_name)}` : '';
    const formattedLastName = last_name ? ` ${capitalizeName(last_name)}` : '';
    
    const fullName = `${formattedFirstName}${formattedMiddleName}${formattedLastName}`.trim();
    
    nameContent = fullName || 'Unoccupied';
  }

  return nameContent;
};
// Updated function to work with any collection
const updateInactiveTombs = async (collection) => {
  try {
    const response = await axios.get(`${apiUrl}/items/${collection}`);
    const allItems = response.data.data;

    // Filter items that are currently marked as 'inactive'
    const itemsToUpdate = allItems.filter(item => item.status === 'inactive');

    // Update each item to set status to 'available'
    for (const item of itemsToUpdate) {
      await axios.patch(`${apiUrl}/items/${collection}/${item.id}`, {
        status: 'available'
      });
    }

    // Fetch updated data after patching
    await fetchData(collection);
  } catch (error) {
    console.error(`Error updating inactive items in ${collection}:`, error);
  }
};
onMounted(async () => {
  await fetchData(selectedCollection.value);
  startPeriodicStatusUpdate();
  await updateInactiveTombs(selectedCollection.value); // Call the function to update tomb statuses
  watch(selectedCollection, async (newCollection) => {
    await fetchData(newCollection);
    await updateInactiveTombs(newCollection); // Update inactive items when collection changes
  });
});

const openMap = async (collection) => {
  await selectCollection(collection);
  selectedMapCollection.value = collection;
  dialog.value = true;
};


const selectCollection = async (collection) => {
  selectedCollection.value = collection;
  await fetchData(collection);
};

// Add these methods
// Update the editItem method to handle the new status format
const editItem = (item) => {
  const itemCopy = { ...item };
  // Convert status to formatted object if it's a string
  if (typeof itemCopy.status === 'string') {
    itemCopy.status = statusOptionsFormatted.value.find(
      option => option.value === itemCopy.status
    ) || statusOptionsFormatted.value[0];
  }
  editedItem.value = itemCopy;
  editDialog.value = true;
  if (detailsDialog.value) detailsDialog.value = false;
};

// New reactive references
const detailsDialog = ref(false);
const deleteDialog = ref(false);
const selectedTomb = ref(null);
const itemToDelete = ref(null);

// Collection icons mapping
const collectionIcons = {
  graveyards: 'mdi-grave-stone',
  apartment_stores: 'mdi-office-building',
  bone_vault_stores: 'mdi-archive',
  apartment_baby_stores: 'mdi-baby-carriage'
};

// Enhanced status color getters
const getStatusChipColor = (status) => {
  const statusColors = {
    active: 'success',
    inactive: 'grey',
    available: 'info',
    recently_occupied: 'purple',
    long_term_occupied: 'blue',
    expired: 'error',
    pending_renewal: 'warning',
    abandoned: 'brown',
    in_dispute: 'amber',
    well_maintained: 'green',
    needs_maintenance: 'orange',
    requires_major_repairs: 'deep-orange'
  };
  return statusColors[status] || 'grey';
};

// Utility functions
const getCollectionIcon = (collection) => {
  return collectionIcons[collection] || 'mdi-folder';
};

const getFieldIcon = (field) => {
  const fieldIcons = {
    status: 'mdi-information',
    tomb_number: 'mdi-pound',
    graveyard_name: 'mdi-grave-stone',
    apartment_block_type: 'mdi-office-building',
    bone_vault_number: 'mdi-archive',
    apartment_baby_number: 'mdi-baby-carriage'
  };
  return fieldIcons[field] || 'mdi-text';
};

const formatFieldName = (field) => {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getTombIdentifier = (tomb) => {
  if (tomb.graveyard_name) return `${tomb.graveyard_name} - ${tomb.tomb_number}`;
  if (tomb.ab_store_name) return tomb.ab_store_name;
  if (tomb.bone_vault_id) return `Vault ${tomb.bone_vault_id}`;
  if (tomb.apartment_baby_id) return `Unit ${tomb.apartment_baby_id}`;
  return 'Unknown';
};

const getTombDetails = (tomb) => {
  const excludeFields = ['id', 'created_at', 'updated_at', 'burialRecord'];
  return Object.fromEntries(
    Object.entries(tomb).filter(([key]) => !excludeFields.includes(key))
  );
};

const getStatusCount = (status) => {
  return tombs.value.filter(tomb => tomb.status === status).length;
};

const getNeedsAttentionCount = () => {
  const attentionStatuses = ['needs_maintenance', 'requires_major_repairs', 'expired', 'in_dispute'];
  return tombs.value.filter(tomb => attentionStatuses.includes(tomb.status)).length;
};

// Enhanced event handlers
const showTombDetails = (tomb) => {
  selectedTomb.value = tomb;
  detailsDialog.value = true;
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;
  
  try {
    await axios.delete(`${apiUrl}/items/${selectedCollection.value}/${itemToDelete.value.id}`);
    await fetchData(selectedCollection.value);
    deleteDialog.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};

const refreshMapData = async () => {
  await fetchData(selectedCollection.value);
};

const closeEdit = () => {
  editDialog.value = false;
  editedItem.value = Object.assign({}, defaultItem.value);
};

const saveItem = async () => {
  try {
    const saveData = { ...editedItem.value };
    // Convert status back to string value before saving
    if (saveData.status && typeof saveData.status === 'object') {
      saveData.status = saveData.status.value;
    }

    if (editedItem.value.id) {
      await axios.patch(
        `${apiUrl}/items/${selectedCollection.value}/${editedItem.value.id}`,
        saveData
      );
    } else {
      await axios.post(
        `${apiUrl}/items/${selectedCollection.value}`,
        saveData
      );
    }
    
    await fetchData(selectedCollection.value);
    closeEdit();
  } catch (error) {
    console.error('Error saving item:', error);
  }
};


// Add validation
const validateForm = computed(() => {
  const requiredFields = editedFields.value.filter(field => 
    !['notes'].includes(field)  // exclude optional fields
  );
  
  return requiredFields.every(field => 
    editedItem.value[field] && editedItem.value[field].toString().trim() !== ''
  );
});
const currentTombs = computed(() => tombs.value);

onMounted(async () => {
  await fetchData(selectedCollection.value);
  watch(selectedCollection, fetchData);
});  


// Computed property to separate items into available and inactive/other statuses
const availableItems = computed(() => {
  const primaryStatuses = ['available'];
  return tombs.value.filter(tomb => primaryStatuses.includes(tomb.status));
});

const inactiveItems = computed(() => {
  const nonPrimaryStatuses = ['active', 'inactive', 'recently_occupied', 'long_term_occupied', 'expired', 'pending_renewal'];
  return tombs.value.filter(tomb => nonPrimaryStatuses.includes(tomb.status));
});


</script>
  
<style scoped>
.data-table-container {
  margin-bottom: 16px;
}

.selected-slot {
  background-color: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.5);
}

.tomb-history-item {
  border-bottom: 1px solid #e0e0e0;
}

.data-table-container .v-card-title {
  font-weight: bold;
  font-size: 1rem;
}

.tomb-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 4px;
}

.tomb-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  text-align: center;
  color: rgba(0, 0, 0, 0.87);
  font-size: 0.875rem;
  line-height: 1.2;
  z-index: 1;
}

.tomb-id {
  font-weight: bold;
  font-size: 0.75rem;
  margin-bottom: 2px;
  color: rgba(0, 0, 0, 0.87);
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.5);
}

.tomb-type-icon {
  font-size: 1.2rem;
}

/* Adjust for dark backgrounds */
.tomb-cell[style*="background-color: rgb(139, 0, 0)"] .tomb-label,
.tomb-cell[style*="background-color: rgb(0, 128, 0)"] .tomb-label,
.tomb-cell[style*="background-color: rgb(65, 105, 225)"] .tomb-label {
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .tomb-id {
    font-size: 0.7rem;
  }
  
  .tomb-type-icon {
    font-size: 1rem;
  }
}
.tomb-tooltip {
  padding: 8px;
  text-align: left;
  max-width: 250px;
}

.tomb-identifier {
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: #333;
}

.tomb-status {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
}

.tomb-name {
  font-size: 0.9rem;
  color: #444;
  font-style: italic;
}
/* Add new styles for the status select */
:deep(.v-select) {
  .v-chip {
    margin-right: 8px;
  }
  
  .v-list-item {
    padding: 8px 16px;
  }
  
  .v-list-item__prepend {
    margin-right: 12px;
  }
}
.tomb-management {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header-section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.collection-navigation {
  margin-bottom: 24px;
}

.collection-btn {
  min-width: 150px;
  transition: all 0.3s ease;
}

.data-table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  background-color: #f5f5f5;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.stats-card, .legend-card {
  background-color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stats-card:hover, .legend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.87);
}

.map-view-card {
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 16px;
}

.tomb-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.tomb-cell:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tomb-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent);
  border-radius: inherit;
}

.search-field {
  background-color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-field:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Status indicators */
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
}

/* Dialog enhancements */
.v-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(45deg, var(--v-primary-base), var(--v-primary-darken1));
  color: white;
  padding: 16px 24px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .map-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
  }

  .collection-btn {
    min-width: 120px;
    font-size: 0.875rem;
  }

  .header-section {
    padding: 16px;
  }

  .legend-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Animation classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* Print styles */
@media print {
  .tomb-management {
    background-color: white;
  }

  .collection-navigation,
  .search-field,
  .v-btn:not(.print-btn) {
    display: none;
  }

  .map-grid {
    page-break-inside: avoid;
  }

  .tomb-cell {
    border: 1px solid #ddd;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>