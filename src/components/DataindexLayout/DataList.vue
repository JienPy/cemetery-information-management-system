<template>
  <section class="records-workspace">
    <div class="records-summary">
      <div class="summary-item">
        <span class="summary-icon summary-icon--navy">
          <v-icon icon="mdi-file-document-multiple-outline" size="20" />
        </span>
        <div>
          <strong>{{ dataFlow.length }}</strong>
          <span>Total records</span>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon summary-icon--blue">
          <v-icon icon="mdi-map-marker-check-outline" size="20" />
        </span>
        <div>
          <strong>{{ occupiedPlotCount }}</strong>
          <span>Occupied plots</span>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon summary-icon--green">
          <v-icon icon="mdi-map-marker-plus-outline" size="20" />
        </span>
        <div>
          <strong>{{ availablePlotCount }}</strong>
          <span>Available plots</span>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon summary-icon--amber">
          <v-icon icon="mdi-calendar-alert-outline" size="20" />
        </span>
        <div>
          <strong>{{ renewalDueCount }}</strong>
          <span>Renewals within 90 days</span>
        </div>
      </div>
    </div>

    <div class="records-panel">
      <header class="records-panel__header">
        <div>
          <p class="section-kicker">Records registry</p>
          <h2>Burial and interment records</h2>
          <p>{{ filteredData.length }} of {{ dataFlow.length }} records displayed</p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          class="new-record-btn"
          @click="newItem"
        >
          New interment
        </v-btn>
      </header>

      <div class="records-toolbar">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search records"
          placeholder="Name, case number, plot, or contact"
          hide-details
          class="records-search"
        />

        <v-menu v-model="filterMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              prepend-icon="mdi-filter-variant"
              variant="outlined"
              color="primary"
              height="48"
            >
              Filters
              <span v-if="activeFilters" class="filter-count">{{ activeFilters }}</span>
            </v-btn>
          </template>
          <v-card class="filter-menu" width="330">
            <div class="filter-menu__header">
              <strong>Filter records</strong>
              <v-btn variant="text" size="small" color="info" @click="clearFilters">
                Clear
              </v-btn>
            </div>
            <v-divider />
            <div class="filter-menu__body">
              <v-select
                v-model="filters.plotType"
                :items="plotTypeOptions"
                item-title="title"
                item-value="value"
                label="Plot type"
                clearable
              />
              <v-select
                v-model="filters.gender"
                :items="genderOptions"
                item-title="title"
                item-value="value"
                label="Gender"
                clearable
              />
              <v-select
                v-model="filters.renewal"
                :items="renewalFilterOptions"
                item-title="title"
                item-value="value"
                label="Renewal status"
                clearable
                hide-details
              />
            </div>
          </v-card>
        </v-menu>

        <v-spacer />

        <v-btn
          prepend-icon="mdi-download-outline"
          variant="tonal"
          color="secondary"
          height="48"
          @click="exportToCSV"
        >
          Export CSV
        </v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredData"
        :loading="isLoading"
        :items-per-page="10"
        item-value="id"
        loading-text="Loading interment records..."
        class="records-table"
        hover
      >
        <template #item.caseNumber="{ item }">
          <span class="case-number">{{ item.caseNumber }}</span>
        </template>

        <template #item.deceased="{ item }">
          <div class="person-cell">
            <span class="person-avatar">{{ getInitials(item) }}</span>
            <div>
              <strong>{{ getFullName(item) }}</strong>
              <span>{{ formatDemographic(item) }}</span>
            </div>
          </div>
        </template>

        <template #item.plot="{ item }">
          <div v-if="item.plot" class="plot-cell">
            <strong>{{ item.plot.code }}</strong>
            <span>{{ getPlotTypeLabel(item.plot.type) }}</span>
          </div>
          <v-chip v-else size="small" color="warning" variant="tonal">Unassigned</v-chip>
        </template>

        <template #item.dateOfDeath="{ item }">
          <span class="date-cell">{{ formatDate(item.dateOfDeath) }}</span>
        </template>

        <template #item.contact="{ item }">
          <div class="contact-cell">
            <strong>{{ item.contactPerson || 'No contact person' }}</strong>
            <span>{{ item.contactNumber || 'No number provided' }}</span>
          </div>
        </template>

        <template #item.renewal="{ item }">
          <div class="renewal-cell">
            <v-chip
              size="small"
              :color="getRenewalColor(getDaysLeft(item))"
              variant="tonal"
            >
              {{ getRenewalLabel(item) }}
            </v-chip>
            <span>{{ formatRenewalDate(item) }}</span>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" color="success" variant="tonal" class="text-capitalize">
            {{ item.status || 'active' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="table-actions">
            <v-tooltip text="Edit record" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil-outline"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="editItem(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Delete record" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  size="small"
                  @click="deleteItem(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="empty-state">
            <span class="empty-state__icon">
              <v-icon icon="mdi-clipboard-text-outline" size="32" />
            </span>
            <h3>No interment records yet</h3>
            <p>Create the first record to begin the cemetery registry.</p>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="newItem">
              New interment
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </div>

    <v-dialog v-model="dialog" max-width="1080" persistent scrollable>
      <v-card class="entry-dialog">
        <header class="entry-dialog__header">
          <div class="entry-dialog__title">
            <span class="entry-dialog__icon">
              <v-icon :icon="editedIndex > -1 ? 'mdi-file-edit-outline' : 'mdi-file-plus-outline'" />
            </span>
            <div>
              <p>{{ editedIndex > -1 ? editedItem.caseNumber : 'New cemetery record' }}</p>
              <h2>{{ formTitle }}</h2>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            aria-label="Close interment form"
            @click="close"
          />
        </header>

        <nav class="form-steps" aria-label="Interment form progress">
          <button
            v-for="step in formSteps"
            :key="step.number"
            type="button"
            class="form-step"
            :class="{
              'form-step--active': currentStep === step.number,
              'form-step--complete': currentStep > step.number,
            }"
            @click="goToStep(step.number)"
          >
            <span class="form-step__number">
              <v-icon v-if="currentStep > step.number" icon="mdi-check" size="16" />
              <template v-else>{{ step.number }}</template>
            </span>
            <span>
              <strong>{{ step.title }}</strong>
              <small>{{ step.caption }}</small>
            </span>
          </button>
        </nav>

        <v-card-text class="entry-dialog__body">
          <v-form ref="form" v-model="valid">
            <div class="form-layout">
              <main class="form-main">
                <section v-if="currentStep === 1" class="form-section">
                  <div class="form-section__heading">
                    <span><v-icon icon="mdi-account-outline" /></span>
                    <div>
                      <h3>Deceased information</h3>
                      <p>Enter the identity and primary civil details for this record.</p>
                    </div>
                  </div>

                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editedItem.firstName"
                        label="First name"
                        :rules="requiredRules('First name')"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field v-model="editedItem.middleName" label="Middle name" />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editedItem.lastName"
                        label="Last name"
                        :rules="requiredRules('Last name')"
                        required
                      />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                      <v-text-field
                        v-model="editedItem.age"
                        label="Age"
                        type="number"
                        min="0"
                        :rules="ageRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                      <v-select
                        v-model="editedItem.gender"
                        :items="genderOptions"
                        item-title="title"
                        item-value="value"
                        label="Gender"
                      />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                      <v-select
                        v-model="editedItem.indigent"
                        :items="indigentOptions"
                        item-title="title"
                        item-value="value"
                        label="Indigent status"
                      />
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                      <v-text-field v-model="editedItem.dateOfBirth" label="Date of birth" type="date" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="editedItem.dateOfDeath"
                        label="Date of death"
                        type="date"
                        :rules="requiredRules('Date of death')"
                        required
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="editedItem.intermentDate"
                        label="Interment date"
                        type="date"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="editedItem.address"
                        label="Last known address"
                        rows="2"
                        auto-grow
                      />
                    </v-col>
                  </v-row>
                </section>

                <section v-else-if="currentStep === 2" class="form-section">
                  <div class="form-section__heading">
                    <span><v-icon icon="mdi-map-marker-outline" /></span>
                    <div>
                      <h3>Plot and representative</h3>
                      <p>Assign an available space and record the responsible contact person.</p>
                    </div>
                  </div>

                  <v-row>
                    <v-col cols="12" md="5">
                      <v-select
                        v-model="editedItem.plotType"
                        :items="plotTypeOptions"
                        item-title="title"
                        item-value="value"
                        label="Plot type"
                        :rules="requiredRules('Plot type')"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="7">
                      <v-select
                        v-model="editedItem.plotId"
                        :items="availablePlotOptions"
                        item-title="title"
                        item-value="value"
                        label="Available plot or space"
                        :disabled="!editedItem.plotType"
                        :loading="plotLoading"
                        :rules="requiredRules('Plot assignment')"
                        no-data-text="No available spaces for this plot type"
                        required
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.contactPerson"
                        label="Contact person / representative"
                        prepend-inner-icon="mdi-account-box-outline"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.contactNumber"
                        label="Contact number"
                        prepend-inner-icon="mdi-phone-outline"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="editedItem.remarks"
                        label="Record remarks"
                        placeholder="Special instructions, supporting document notes, or plot remarks"
                        rows="3"
                        auto-grow
                      />
                    </v-col>
                  </v-row>
                </section>

                <section v-else class="form-section">
                  <div class="form-section__heading">
                    <span><v-icon icon="mdi-receipt-text-outline" /></span>
                    <div>
                      <h3>Payment and coverage</h3>
                      <p>Complete the official receipt and renewal coverage details.</p>
                    </div>
                  </div>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.amount"
                        label="Amount paid"
                        type="number"
                        min="0"
                        prefix="PHP"
                        :rules="amountRules"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.orNumber"
                        label="Official receipt number"
                        prepend-inner-icon="mdi-receipt-outline"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editedItem.coverageYears"
                        :items="coverageOptions"
                        item-title="title"
                        item-value="value"
                        label="Coverage period"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="coverageExpiry"
                        label="Coverage expiration"
                        prepend-inner-icon="mdi-calendar-clock-outline"
                        readonly
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.newUserOfBurial"
                        label="New burial user (if transferred)"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editedItem.transferNotes"
                        label="Transfer reference / notes"
                      />
                    </v-col>
                  </v-row>
                </section>
              </main>

              <aside class="record-preview">
                <p class="record-preview__kicker">Record preview</p>
                <div class="record-preview__person">
                  <span>{{ previewInitials }}</span>
                  <div>
                    <strong>{{ previewName }}</strong>
                    <small>{{ editedItem.dateOfDeath ? `Died ${formatDate(editedItem.dateOfDeath)}` : 'Date of death pending' }}</small>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Assigned plot</dt>
                    <dd>{{ selectedPlotLabel }}</dd>
                  </div>
                  <div>
                    <dt>Contact person</dt>
                    <dd>{{ editedItem.contactPerson || 'Not provided' }}</dd>
                  </div>
                  <div>
                    <dt>Coverage</dt>
                    <dd>{{ editedItem.coverageYears }} years</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{{ formatCurrency(editedItem.amount) }}</dd>
                  </div>
                </dl>
                <div class="record-preview__notice">
                  <v-icon icon="mdi-shield-check-outline" size="18" />
                  <span>The assigned plot will be marked occupied after saving.</span>
                </div>
              </aside>
            </div>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="entry-dialog__actions">
          <v-btn variant="text" color="secondary" @click="close">Cancel</v-btn>
          <v-spacer />
          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            color="primary"
            prepend-icon="mdi-arrow-left"
            @click="currentStep -= 1"
          >
            Back
          </v-btn>
          <v-btn
            v-if="currentStep < formSteps.length"
            color="primary"
            append-icon="mdi-arrow-right"
            @click="continueForm"
          >
            Continue
          </v-btn>
          <v-btn
            v-else
            color="primary"
            prepend-icon="mdi-content-save-outline"
            :loading="saving"
            @click="save"
          >
            {{ editedIndex > -1 ? 'Update record' : 'Save interment' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="460">
      <v-card class="confirm-dialog">
        <div class="confirm-dialog__icon"><v-icon icon="mdi-delete-alert-outline" size="28" /></div>
        <v-card-title>Delete interment record?</v-card-title>
        <v-card-text>
          {{ editedItem.caseNumber || 'This record' }} will be permanently removed and its plot will become available again.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteItemConfirm">Delete record</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3500" location="top right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false" />
      </template>
    </v-snackbar>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const apiUrl = 'http://localhost:8055/api';
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
const dataFlow = ref([]);
const plotInventory = ref([]);
const search = ref('');
const isLoading = ref(true);
const plotLoading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const dialog = ref(false);
const dialogDelete = ref(false);
const filterMenu = ref(false);
const editedIndex = ref(-1);
const currentStep = ref(1);
const valid = ref(true);
const form = ref(null);
const formTitle = ref('New Interment Record');
const snackbar = ref({ show: false, text: '', color: 'success' });

const formSteps = [
  { number: 1, title: 'Deceased', caption: 'Identity and dates' },
  { number: 2, title: 'Assignment', caption: 'Plot and contact' },
  { number: 3, title: 'Payment', caption: 'Fees and coverage' },
];

const plotTypeOptions = [
  { title: 'Lot Yard', value: 'lot' },
  { title: 'Apartment Tomb', value: 'apartment' },
  { title: 'Baby Apartment Tomb', value: 'baby_apartment' },
  { title: 'Bone Vault', value: 'bone_vault' },
];

const genderOptions = [
  { title: 'Male', value: 'male' },
  { title: 'Female', value: 'female' },
];

const indigentOptions = [
  { title: 'No', value: 'no' },
  { title: 'Yes', value: 'yes' },
];

const coverageOptions = [
  { title: '7 years - standard coverage', value: 7 },
  { title: '14 years - one renewal', value: 14 },
  { title: '21 years - two renewals', value: 21 },
  { title: '28 years - three renewals', value: 28 },
];

const renewalFilterOptions = [
  { title: 'Due within 90 days', value: 'due' },
  { title: 'Expired', value: 'expired' },
  { title: 'Active coverage', value: 'active' },
];

const headers = [
  { title: 'Case no.', key: 'caseNumber', width: 150 },
  { title: 'Deceased', key: 'deceased', minWidth: 220, sortable: false },
  { title: 'Assigned plot', key: 'plot', minWidth: 155, sortable: false },
  { title: 'Date of death', key: 'dateOfDeath', width: 145 },
  { title: 'Representative', key: 'contact', minWidth: 190, sortable: false },
  { title: 'Renewal', key: 'renewal', minWidth: 180, sortable: false },
  { title: 'Status', key: 'status', width: 105 },
  { title: '', key: 'actions', width: 92, sortable: false, align: 'center' },
];

const filters = ref({ plotType: null, gender: null, renewal: null });

const createDefaultItem = () => ({
  id: null,
  caseNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  age: '',
  gender: null,
  indigent: 'no',
  address: '',
  dateOfBirth: '',
  dateOfDeath: '',
  intermentDate: new Date().toISOString().slice(0, 10),
  plotType: null,
  plotId: null,
  contactPerson: '',
  contactNumber: '',
  remarks: '',
  amount: '',
  orNumber: '',
  coverageYears: 7,
  newUserOfBurial: '',
  transferNotes: '',
});

const editedItem = ref(createDefaultItem());

const requiredRules = label => [value => !!value || `${label} is required`];
const ageRules = [value => value === '' || value === null || Number(value) >= 0 || 'Age cannot be negative'];
const amountRules = [value => value === '' || value === null || Number(value) >= 0 || 'Amount cannot be negative'];

const occupiedPlotCount = computed(() => plotInventory.value.filter(plot => plot.status === 'occupied').length);
const availablePlotCount = computed(() => plotInventory.value.filter(plot => plot.status === 'available').length);
const renewalDueCount = computed(() => dataFlow.value.filter(item => {
  const days = getDaysLeft(item);
  return days >= 0 && days <= 90;
}).length);

const activeFilters = computed(() => Object.values(filters.value).filter(Boolean).length);

const filteredData = computed(() => {
  const term = search.value.trim().toLowerCase();
  return dataFlow.value.filter(item => {
    const searchable = [
      item.caseNumber,
      getFullName(item),
      item.plot?.code,
      item.contactPerson,
      item.contactNumber,
    ].filter(Boolean).join(' ').toLowerCase();
    const daysLeft = getDaysLeft(item);
    const matchesRenewal = !filters.value.renewal
      || (filters.value.renewal === 'expired' && daysLeft < 0)
      || (filters.value.renewal === 'due' && daysLeft >= 0 && daysLeft <= 90)
      || (filters.value.renewal === 'active' && daysLeft > 90);

    return (!term || searchable.includes(term))
      && (!filters.value.plotType || item.plot?.type === filters.value.plotType)
      && (!filters.value.gender || item.gender === filters.value.gender)
      && matchesRenewal;
  });
});

const availablePlotOptions = computed(() => {
  if (!editedItem.value.plotType) return [];
  const currentPlotId = Number(editedItem.value.plotId);
  return plotInventory.value
    .filter(plot => plot.type === editedItem.value.plotType)
    .filter(plot => plot.status === 'available' || plot.id === currentPlotId)
    .map(plot => ({
      title: [plot.code, plot.section, plot.block].filter(Boolean).join(' - '),
      value: plot.id,
    }));
});

const selectedPlotLabel = computed(() => {
  const selected = plotInventory.value.find(plot => plot.id === Number(editedItem.value.plotId));
  return selected ? [selected.code, selected.section, selected.block].filter(Boolean).join(' - ') : 'Not assigned';
});

const previewName = computed(() => {
  const name = [editedItem.value.firstName, editedItem.value.middleName, editedItem.value.lastName]
    .filter(Boolean)
    .join(' ');
  return name || 'Unnamed record';
});

const previewInitials = computed(() => {
  const first = editedItem.value.firstName?.charAt(0) || '';
  const last = editedItem.value.lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '--';
});

const coverageExpiry = computed(() => {
  if (!editedItem.value.dateOfDeath) return 'Select a date of death first';
  const date = new Date(`${editedItem.value.dateOfDeath}T00:00:00`);
  date.setFullYear(date.getFullYear() + Number(editedItem.value.coverageYears || 7));
  return formatDate(date);
});

watch(() => editedItem.value.plotType, (nextType, previousType) => {
  if (previousType && nextType !== previousType) editedItem.value.plotId = null;
});

onMounted(async () => {
  if (!authToken.value) {
    await router.push('/login');
    return;
  }

  axios.defaults.headers.common.Authorization = `Bearer ${authToken.value}`;
  await loadWorkspace();
});

async function loadWorkspace() {
  isLoading.value = true;
  plotLoading.value = true;
  try {
    const [recordsResponse, plotsResponse] = await Promise.all([
      axios.get(`${apiUrl}/interments`),
      axios.get(`${apiUrl}/plots`),
    ]);
    dataFlow.value = recordsResponse.data.data;
    plotInventory.value = plotsResponse.data.data;
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to load interment records.'), 'error');
  } finally {
    isLoading.value = false;
    plotLoading.value = false;
  }
}

function newItem() {
  editedIndex.value = -1;
  editedItem.value = createDefaultItem();
  formTitle.value = 'New Interment Record';
  currentStep.value = 1;
  dialog.value = true;
}

function editItem(item) {
  editedIndex.value = dataFlow.value.findIndex(record => record.id === item.id);
  const payment = item.payments?.[0];
  const renewal = item.renewals?.[0];
  editedItem.value = {
    id: item.id,
    caseNumber: item.caseNumber,
    firstName: item.firstName || '',
    middleName: item.middleName || '',
    lastName: item.lastName || '',
    age: item.age ?? '',
    gender: item.gender || null,
    indigent: item.indigent || 'no',
    address: item.address || '',
    dateOfBirth: toDateInput(item.dateOfBirth),
    dateOfDeath: toDateInput(item.dateOfDeath),
    intermentDate: toDateInput(item.intermentDate),
    plotType: item.plot?.type || null,
    plotId: item.plotId || null,
    contactPerson: item.contactPerson || '',
    contactNumber: item.contactNumber || '',
    remarks: item.remarks || '',
    amount: payment ? Number(payment.amount) : '',
    orNumber: payment?.orNumber || '',
    coverageYears: renewal?.coverageYears || 7,
    newUserOfBurial: item.newUserOfBurial || '',
    transferNotes: item.transferNotes || '',
  };
  formTitle.value = 'Edit Interment Record';
  currentStep.value = 1;
  dialog.value = true;
}

function deleteItem(item) {
  editedItem.value = { ...createDefaultItem(), ...item };
  dialogDelete.value = true;
}

function goToStep(step) {
  if (step < currentStep.value || editedIndex.value > -1) currentStep.value = step;
}

function continueForm() {
  if (currentStep.value === 1 && (!editedItem.value.firstName || !editedItem.value.lastName || !editedItem.value.dateOfDeath)) {
    showSnackbar('Complete the required deceased information before continuing.', 'warning');
    return;
  }
  if (currentStep.value === 2 && (!editedItem.value.plotType || !editedItem.value.plotId)) {
    showSnackbar('Select an available plot before continuing.', 'warning');
    return;
  }
  currentStep.value += 1;
}

async function save() {
  const result = await form.value?.validate();
  if (result && !result.valid) {
    showSnackbar('Review the required fields before saving.', 'warning');
    return;
  }

  saving.value = true;
  try {
    const payload = buildPayload();
    if (editedIndex.value > -1) {
      const response = await axios.patch(`${apiUrl}/interments/${editedItem.value.id}`, payload);
      dataFlow.value.splice(editedIndex.value, 1, response.data.data);
      showSnackbar('Interment record updated.', 'success');
    } else {
      const response = await axios.post(`${apiUrl}/interments`, payload);
      dataFlow.value.unshift(response.data.data);
      showSnackbar('Interment record created.', 'success');
    }
    await refreshPlots();
    close();
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to save the interment record.'), 'error');
  } finally {
    saving.value = false;
  }
}

async function deleteItemConfirm() {
  deleting.value = true;
  try {
    await axios.delete(`${apiUrl}/interments/${editedItem.value.id}`);
    dataFlow.value = dataFlow.value.filter(record => record.id !== editedItem.value.id);
    await refreshPlots();
    showSnackbar('Interment record deleted and plot released.', 'success');
    closeDelete();
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to delete the interment record.'), 'error');
  } finally {
    deleting.value = false;
  }
}

async function refreshPlots() {
  const response = await axios.get(`${apiUrl}/plots`);
  plotInventory.value = response.data.data;
}

function buildPayload() {
  return {
    plotId: editedItem.value.plotId,
    firstName: editedItem.value.firstName.trim(),
    middleName: editedItem.value.middleName?.trim() || null,
    lastName: editedItem.value.lastName.trim(),
    age: editedItem.value.age === '' ? null : Number(editedItem.value.age),
    gender: editedItem.value.gender,
    indigent: editedItem.value.indigent,
    address: editedItem.value.address?.trim() || null,
    dateOfBirth: editedItem.value.dateOfBirth || null,
    dateOfDeath: editedItem.value.dateOfDeath,
    intermentDate: editedItem.value.intermentDate || null,
    contactPerson: editedItem.value.contactPerson?.trim() || null,
    contactNumber: editedItem.value.contactNumber?.trim() || null,
    remarks: editedItem.value.remarks?.trim() || null,
    amount: editedItem.value.amount === '' ? 0 : Number(editedItem.value.amount),
    orNumber: editedItem.value.orNumber?.trim() || null,
    coverageYears: Number(editedItem.value.coverageYears || 7),
    newUserOfBurial: editedItem.value.newUserOfBurial?.trim() || null,
    transferNotes: editedItem.value.transferNotes?.trim() || null,
  };
}

function close() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = createDefaultItem();
    editedIndex.value = -1;
    currentStep.value = 1;
    form.value?.resetValidation();
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = createDefaultItem();
  });
}

function clearFilters() {
  filters.value = { plotType: null, gender: null, renewal: null };
}

function getFullName(item) {
  return [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ');
}

function getInitials(item) {
  return `${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`.toUpperCase() || '--';
}

function formatDemographic(item) {
  return [item.age !== null ? `${item.age} years old` : null, item.gender]
    .filter(Boolean)
    .join(' / ') || 'No demographic details';
}

function getPlotTypeLabel(value) {
  return plotTypeOptions.find(option => option.value === value)?.title || value || 'Unknown type';
}

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function getDaysLeft(item) {
  const expiry = item.renewals?.[0]?.expiresAt;
  if (!expiry) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
}

function getRenewalLabel(item) {
  const days = getDaysLeft(item);
  if (!Number.isFinite(days)) return 'No coverage';
  if (days < 0) return 'Expired';
  if (days <= 90) return `${days} days left`;
  return 'Active';
}

function getRenewalColor(days) {
  if (!Number.isFinite(days)) return 'secondary';
  if (days < 0) return 'error';
  if (days <= 90) return 'warning';
  return 'success';
}

function formatRenewalDate(item) {
  const expiry = item.renewals?.[0]?.expiresAt;
  return expiry ? `Until ${formatDate(expiry)}` : 'No renewal schedule';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function exportToCSV() {
  const fields = [
    ['Case Number', record => record.caseNumber],
    ['Deceased', getFullName],
    ['Plot', record => record.plot?.code || 'Unassigned'],
    ['Date of Death', record => toDateInput(record.dateOfDeath)],
    ['Contact Person', record => record.contactPerson || ''],
    ['Contact Number', record => record.contactNumber || ''],
    ['Status', record => record.status || 'active'],
  ];
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = [
    fields.map(([title]) => escape(title)).join(','),
    ...filteredData.value.map(record => fields.map(([, getter]) => escape(getter(record))).join(',')),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'interment-records.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color };
}

function getApiError(error, fallback) {
  return error.response?.data?.error || error.response?.data?.message || fallback;
}
</script>

<style scoped>
.records-workspace {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.records-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: #f8fafc;
  border: 1px solid #cad5e2;
  border-radius: 8px;
  overflow: hidden;
}

.summary-item {
  align-items: center;
  display: flex;
  gap: 12px;
  min-width: 0;
  padding: 16px 18px;
}

.summary-item + .summary-item {
  border-left: 1px solid #d9e2ec;
}

.summary-item > div {
  display: grid;
  min-width: 0;
}

.summary-item strong {
  color: #102a43;
  font-size: 1.35rem;
  line-height: 1.1;
}

.summary-item span:last-child {
  color: #5c6f82;
  font-size: 0.78rem;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-icon {
  align-items: center;
  border-radius: 7px;
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
}

.summary-icon--navy { background: #dce6f1; color: #102a43; }
.summary-icon--blue { background: #dbeafe; color: #1d4ed8; }
.summary-icon--green { background: #d1fae5; color: #047857; }
.summary-icon--amber { background: #fef3c7; color: #a16207; }

.records-panel {
  background: #ffffff;
  border: 1px solid #cad5e2;
  border-radius: 8px;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.records-panel__header {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #d9e2ec;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  padding: 20px 22px;
}

.section-kicker {
  color: #2f628e !important;
  font-size: 0.72rem !important;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin: 0 0 4px !important;
  text-transform: uppercase;
}

.records-panel__header h2 {
  color: #102a43;
  font-size: 1.08rem;
  line-height: 1.25;
  margin: 0;
}

.records-panel__header p {
  color: #62758a;
  font-size: 0.82rem;
  margin: 4px 0 0;
}

.new-record-btn {
  flex: 0 0 auto;
}

.records-toolbar {
  align-items: center;
  background: #ffffff;
  display: flex;
  gap: 12px;
  padding: 16px 18px;
}

.records-search {
  flex: 0 1 420px;
}

.filter-count {
  align-items: center;
  background: #102a43;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  font-size: 0.7rem;
  height: 20px;
  justify-content: center;
  margin-left: 8px;
  width: 20px;
}

.filter-menu {
  border-color: #b8c7d9;
}

.filter-menu__header {
  align-items: center;
  color: #102a43;
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
}

.filter-menu__body {
  display: grid;
  gap: 4px;
  padding: 18px 16px;
}

.records-table {
  border: 0;
  border-radius: 0;
  max-width: 100%;
  min-width: 0;
}

:deep(.records-table .v-table__wrapper) {
  max-width: 100%;
  overflow-x: auto;
}

:deep(.records-table thead th) {
  background: #e9eff6 !important;
  color: #334e68 !important;
  font-size: 0.72rem;
  height: 46px !important;
  text-transform: uppercase;
}

:deep(.records-table tbody td) {
  border-color: #e4eaf0 !important;
  color: #243b53;
  font-size: 0.84rem;
  height: 68px !important;
}

:deep(.records-table tbody tr:nth-child(even)) {
  background: #fbfcfe;
}

.case-number {
  color: #1d4f7a;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  font-weight: 700;
}

.person-cell,
.record-preview__person {
  align-items: center;
  display: flex;
  gap: 10px;
}

.person-avatar,
.record-preview__person > span {
  align-items: center;
  background: #dce6f1;
  border-radius: 50%;
  color: #102a43;
  display: flex;
  flex: 0 0 36px;
  font-size: 0.74rem;
  font-weight: 750;
  height: 36px;
  justify-content: center;
}

.person-cell > div,
.plot-cell,
.contact-cell,
.renewal-cell {
  display: grid;
  gap: 2px;
}

.person-cell strong,
.plot-cell strong,
.contact-cell strong {
  color: #102a43;
  font-size: 0.84rem;
}

.person-cell span:last-child,
.plot-cell span,
.contact-cell span,
.renewal-cell span,
.date-cell {
  color: #6b7f93;
  font-size: 0.76rem;
}

.table-actions {
  display: flex;
  justify-content: center;
}

.empty-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 52px 20px;
  text-align: center;
}

.empty-state__icon {
  align-items: center;
  background: #dce6f1;
  border-radius: 50%;
  color: #1d4f7a;
  display: flex;
  height: 64px;
  justify-content: center;
  margin-bottom: 16px;
  width: 64px;
}

.empty-state h3 {
  color: #102a43;
  font-size: 1rem;
  margin: 0 0 6px;
}

.empty-state p {
  color: #6b7f93;
  font-size: 0.85rem;
  margin: 0 0 18px;
}

.entry-dialog {
  border: 0;
  border-radius: 8px;
  max-height: 92vh !important;
  overflow: hidden !important;
}

.entry-dialog__header {
  align-items: center;
  background: #102a43;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  min-height: 78px;
  padding: 14px 18px 14px 22px;
}

.entry-dialog__title {
  align-items: center;
  display: flex;
  gap: 12px;
}

.entry-dialog__icon {
  align-items: center;
  background: #1e4f7a;
  border-radius: 7px;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.entry-dialog__title p {
  color: #b9c9da;
  font-size: 0.72rem;
  margin: 0 0 2px;
  text-transform: uppercase;
}

.entry-dialog__title h2 {
  font-size: 1.2rem;
  line-height: 1.2;
  margin: 0;
}

.form-steps {
  background: #e9eff6;
  border-bottom: 1px solid #c9d5e2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 22px;
}

.form-step {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  color: #62758a;
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 72px;
  padding: 10px 12px;
  text-align: left;
}

.form-step--active {
  border-bottom-color: #1d4f7a;
  color: #102a43;
}

.form-step__number {
  align-items: center;
  border: 1px solid #9fb3c8;
  border-radius: 50%;
  display: flex;
  flex: 0 0 30px;
  font-size: 0.78rem;
  font-weight: 750;
  height: 30px;
  justify-content: center;
}

.form-step--active .form-step__number,
.form-step--complete .form-step__number {
  background: #1d4f7a;
  border-color: #1d4f7a;
  color: #ffffff;
}

.form-step > span:last-child {
  display: grid;
}

.form-step strong {
  font-size: 0.82rem;
}

.form-step small {
  color: #77899c;
  font-size: 0.7rem;
  margin-top: 2px;
}

.entry-dialog__body {
  background: #f3f6fa;
  padding: 0 !important;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: 460px;
}

.form-main {
  background: #ffffff;
  padding: 26px 28px 14px;
}

.form-section__heading {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}

.form-section__heading > span {
  align-items: center;
  background: #dce6f1;
  border-radius: 6px;
  color: #1d4f7a;
  display: flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.form-section__heading h3 {
  color: #102a43;
  font-size: 1rem;
  line-height: 1.25;
  margin: 0;
}

.form-section__heading p {
  color: #6b7f93;
  font-size: 0.78rem;
  margin: 4px 0 0;
}

.record-preview {
  background: #e9eff6;
  border-left: 1px solid #c9d5e2;
  padding: 26px 22px;
}

.record-preview__kicker {
  color: #4e657c;
  font-size: 0.7rem;
  font-weight: 750;
  margin: 0 0 18px;
  text-transform: uppercase;
}

.record-preview__person {
  border-bottom: 1px solid #c9d5e2;
  padding-bottom: 18px;
}

.record-preview__person > div {
  display: grid;
  min-width: 0;
}

.record-preview__person strong {
  color: #102a43;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-preview__person small {
  color: #6b7f93;
  margin-top: 3px;
}

.record-preview dl {
  display: grid;
  gap: 14px;
  margin: 20px 0;
}

.record-preview dl > div {
  display: grid;
  gap: 3px;
}

.record-preview dt {
  color: #6b7f93;
  font-size: 0.7rem;
}

.record-preview dd {
  color: #243b53;
  font-size: 0.82rem;
  font-weight: 650;
  margin: 0;
}

.record-preview__notice {
  align-items: flex-start;
  background: #dce6f1;
  border-left: 3px solid #1d4f7a;
  color: #334e68;
  display: flex;
  font-size: 0.74rem;
  gap: 8px;
  line-height: 1.45;
  padding: 12px;
}

.entry-dialog__actions {
  background: #f8fafc;
  bottom: 0;
  flex: 0 0 auto;
  gap: 8px;
  min-height: 68px;
  padding: 10px 18px !important;
  position: sticky;
  z-index: 3;
}

.confirm-dialog {
  padding: 22px;
  text-align: center;
}

.confirm-dialog__icon {
  align-items: center;
  background: #fee2e2;
  border-radius: 50%;
  color: #b42318;
  display: flex;
  height: 56px;
  justify-content: center;
  margin: 0 auto 10px;
  width: 56px;
}

.confirm-dialog :deep(.v-card-title) {
  color: #102a43;
  font-size: 1.1rem;
  padding: 8px;
}

.confirm-dialog :deep(.v-card-text) {
  color: #62758a;
  font-size: 0.86rem;
  padding: 8px 8px 20px;
}

@media (max-width: 1100px) {
  .records-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid #d9e2ec;
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid #d9e2ec;
  }
}

@media (max-width: 760px) {
  .records-panel__header,
  .records-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .records-search {
    flex-basis: auto;
  }

  .new-record-btn {
    width: 100%;
  }

  .form-layout {
    grid-template-columns: 1fr;
  }

  .record-preview {
    border-left: 0;
    border-top: 1px solid #c9d5e2;
  }

  .form-main {
    padding: 22px 18px 10px;
  }

  .form-step {
    justify-content: center;
  }

  .form-step > span:last-child {
    display: none;
  }
}

@media (max-width: 520px) {
  .records-summary {
    grid-template-columns: 1fr;
  }

  .summary-item + .summary-item {
    border-left: 0;
    border-top: 1px solid #d9e2ec;
  }

  .form-steps {
    padding: 0 10px;
  }

  .entry-dialog__actions {
    flex-wrap: wrap;
  }
}
</style>
