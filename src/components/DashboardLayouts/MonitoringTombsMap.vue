<template>
    <v-sheet class="analytics-dashboard pa-4">
    <v-container fluid class="pa-0">
        <v-card class="modern-dashboard-card">
            <!-- Header Section -->
            <v-card-item class="dashboard-header pb-0">
                <template v-slot:prepend>
                    <v-icon size="30" color="primary" class="me-3">mdi-map-marker-multiple</v-icon>
                </template>
                <v-card-title class="text-h5 ">
                    Monitoring Tombs Map
                    <v-chip
                        class="ml-4"
                        color="primary"
                        size="small"
                        variant="flat"
                    >
                        {{ tombs.length }} Records
                    </v-chip>
                    <v-spacer></v-spacer>
                    <router-link to="/manage-plot" class="text-decoration-none">
                        <v-btn
                            prepend-icon="mdi-land-plots-marker"
                            variant="tonal"
                            color="primary"
                            size="small"
                        >
                            Manage Plots
                        </v-btn>
                    </router-link>
                </v-card-title>
            </v-card-item>

            <!-- Info Cards Section -->
            <v-card-item class="py-2">
                <v-row>
                    <v-col cols="12" sm="6" md="7">
                        <v-card variant="outlined" class="info-card">
                            <v-card-item>
                                <template v-slot:prepend>
                                    <v-icon color="primary" size="25">mdi-format-title</v-icon>
                                </template>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Collection Title</div>
                                    <div class="text-subtitle-1 font-weight-bold"  size="10">{{ selectedCollectionTitle }}</div>
                                </div>
                            </v-card-item>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="5">
                        <v-card variant="outlined" class="info-card">
                            <v-card-item>
                                <template v-slot:prepend>
                                    <v-icon color="primary" size="25">mdi-format-list-numbered</v-icon>
                                </template>
                                <div>
                                    <div class="text-caption text-medium-emphasis">Total Records</div>
                                    <div class="text-subtitle-1 font-weight-bold">{{ tombs.length }}</div>
                                </div>
                            </v-card-item>
                        </v-card>
                    </v-col>
                    
                </v-row>
            </v-card-item>

            <!-- Search and Controls -->
            <v-card-item class="py-2">
                <v-row align="center">
                    <v-col cols="12" sm="6" md="4">
                        <v-text-field
                            v-model="search"
                            density="comfortable"
                            variant="outlined"
                            label="Search Records"
                            prepend-inner-icon="mdi-magnify"
                            hide-details
                            class="search-field"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="3" md="8" class="d-flex justify-end">
                        <v-btn-group variant="outlined">
                            <v-btn
                                @click="prevCollection"
                                :disabled="currentCollectionIndex === 0"
                                prepend-icon="mdi-chevron-left"
                            >
                                Previous
                            </v-btn>
                            <v-btn
                                @click="nextCollection"
                                :disabled="currentCollectionIndex === collections.length - 1"
                                append-icon="mdi-chevron-right"
                            >
                                Next
                            </v-btn>
                        </v-btn-group>
                    </v-col>
                </v-row>
            </v-card-item>

            <!-- Data Table -->
            <v-card-item class="pt-2">
                <v-data-table
                    :headers="getHeaders"
                    :items="tombs"
                    :search="search"
                    :loading="isLoading"
                    :items-per-page="10"
                    :hover="true"
                    class="records-table"
                >
                    <template v-slot:loading>
                        <v-skeleton-loader
                            type="table-row-divider@6"
                            class="pa-4"
                        ></v-skeleton-loader>
                    </template>
                    <template v-slot:no-data>
                        <v-alert
                            type="info"
                            variant="tonal"
                            class="ma-2"
                        >
                            No records found
                        </v-alert>
                    </template>
                    <template v-slot:[`item.status`]="{ item }">
                        <v-chip
                            :color="getStatusColor(item.status)"
                            size="small"
                            variant="flat"
                        >
                            {{ item.status }}
                        </v-chip>
                    </template>
                </v-data-table>
            </v-card-item>
        </v-card>
    </v-container>
</v-sheet>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const collections = ['graveyards', 'apartment_stores', 'bone_vault_stores', 'apartment_baby_stores'];
const currentCollectionIndex = ref(0);

const selectedCollection = ref(collections[currentCollectionIndex.value]);
const selectedCollectionTitle = computed(() => selectedCollection.value.replace(/_/g, ' ').toUpperCase());
const search = ref('');
const isLoading = ref(true);
const tombs = ref([]);
const isLoggedIn = ref(false);
const authToken = ref('');


const getStatusColor = (status) => {
    const statusColors = {
        'available': 'success',
        'occupied': 'error',
        'reserved': 'warning',
        'maintenance': 'info'
    };
    return statusColors[status.toLowerCase()] || 'grey';
};

const headers = {
    graveyards: [
        { title: 'Graveyard Name', key: 'graveyard_name', align: 'start' },
        { title: 'Tomb Number', key: 'tomb_number', align: 'start' },
        { title: 'Status', key: 'status', align: 'center' },
    ],
    apartment_stores: [
        { title: 'Store Name', key: 'ab_store_name', align: 'start' },
        { title: 'Tomb ID', key: 'ab_tomb_id', align: 'start' },
        { title: 'Status', key: 'status', align: 'center' },
    ],
    bone_vault_stores: [
        { title: 'Vault ID', key: 'bone_vault_id', align: 'start' },
        { title: 'Vault Number', key: 'bone_vault_number', align: 'start' },
        { title: 'Status', key: 'status', align: 'center' },
    ],
    apartment_baby_stores: [
        { title: 'Baby Store ID', key: 'apartment_baby_id', align: 'start' },
        { title: 'Store Number', key: 'apartment_baby_number', align: 'start' },
        { title: 'Status', key: 'status', align: 'center' },
    ],
};

const getHeaders = computed(() => headers[selectedCollection.value]);

const fetchData = async (collection) => {
    isLoading.value = true;
    try {
        const response = await axios.get(`${apiUrl}/items/${collection}`);
        tombs.value = response.data.data.map((item) => {
            switch (collection) {
                case 'graveyards':
                    return {
                        graveyard_name: item.graveyard_name,
                        tomb_number: item.tomb_number,
                        status: item.status ,
                        gravesite_name: item.gravesite_name,
                    };
                case 'apartment_stores':
                    return {
                        ab_store_name: item.ab_store_name,
                        ab_tomb_id: item.ab_tomb_id,
                        status: item.status,
                        apartment_block_type: item.apartment_block_type,
                    };
                case 'bone_vault_stores':
                    return {
                        bone_vault_id: item.bone_vault_id,
                        bone_vault_number: item.bone_vault_number,
                        status: item.status,
                        bone_vault_type: item.bone_vault_type,
                    };
                case 'apartment_baby_stores':
                    return {
                        apartment_baby_id: item.apartment_baby_id,
                        apartment_baby_number: item.apartment_baby_number,
                        status: item.status,
                        location: item.apartment_baby_type,
                    };
                default:
                    return {};
            }
        });
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchData(selectedCollection.value);
});

watch(selectedCollection, (newCollection) => {
    fetchData(newCollection);
});

watch(isLoggedIn, async (newVal) => {
    if (newVal) {
        await fetchData(selectedCollection.value); // Refresh data when user logs in
    }
});

const nextCollection = () => {
    currentCollectionIndex.value = (currentCollectionIndex.value + 1) % collections.length;
    selectedCollection.value = collections[currentCollectionIndex.value];
};

const prevCollection = () => {
    currentCollectionIndex.value = (currentCollectionIndex.value - 1 + collections.length) % collections.length;
    selectedCollection.value = collections[currentCollectionIndex.value];
};

// Simulate a login function for demonstration purposes
const loginUser = async () => {
    // Simulate a successful login
    isLoggedIn.value = true; // Set login status to true
    // You can also handle actual login logic here
};

// Uncomment this line to simulate a login after 2 seconds
setTimeout(loginUser, 2000);
</script>

<style scoped>
.modern-dashboard-card {
    border: 0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: none;
}

.analytics-dashboard {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.dashboard-header {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
}

.info-card {
    border-color: #eaecf0;
}

.info-card:hover {
    background: #f9fafb;
    box-shadow: none;
}

.search-field :deep(.v-field__input) {
    padding-top: 8px;
    padding-bottom: 8px;
}

:deep(.v-data-table) {
    border: 1px solid #eaecf0;
    border-radius: 8px;
    box-shadow: none !important;
}

:deep(.v-data-table-header) {
    background-color: #f9fafb;
}

:deep(.v-data-table-header th) {
    font-weight: 600 !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.025em;
}

:deep(.v-data-table__tr:hover:not(.v-data-table__expanded__content)) {
    background: rgba(var(--v-theme-primary), 0.05) !important;
}
</style>
