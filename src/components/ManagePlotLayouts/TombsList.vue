<template>
  <section class="plot-workspace">
    <div class="inventory-overview">
      <div class="utilization-summary">
        <div class="utilization-summary__heading">
          <div>
            <p>Inventory utilization</p>
            <strong>{{ utilizationRate }}%</strong>
          </div>
          <span>{{ occupiedCount }} of {{ plots.length }} occupied</span>
        </div>
        <v-progress-linear
          :model-value="utilizationRate"
          color="info"
          bg-color="#c9d5e2"
          height="8"
          rounded
        />
      </div>

      <div class="inventory-metric">
        <span class="metric-icon metric-icon--green">
          <v-icon icon="mdi-map-marker-plus-outline" size="20" />
        </span>
        <div>
          <strong>{{ availableCount }}</strong>
          <span>Available</span>
        </div>
      </div>
      <div class="inventory-metric">
        <span class="metric-icon metric-icon--blue">
          <v-icon icon="mdi-map-marker-check-outline" size="20" />
        </span>
        <div>
          <strong>{{ occupiedCount }}</strong>
          <span>Occupied</span>
        </div>
      </div>
      <div class="inventory-metric">
        <span class="metric-icon metric-icon--amber">
          <v-icon icon="mdi-tools" size="20" />
        </span>
        <div>
          <strong>{{ attentionCount }}</strong>
          <span>Needs attention</span>
        </div>
      </div>
    </div>

    <div class="inventory-panel">
      <header class="inventory-panel__header">
        <div>
          <p class="section-kicker">Space inventory</p>
          <h2>Cemetery plots and facilities</h2>
          <p>{{ filteredPlots.length }} of {{ plots.length }} spaces displayed</p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          class="add-plot-btn"
          @click="openCreate"
        >
          Add plot
        </v-btn>
      </header>

      <div class="type-tabs-wrap">
        <v-tabs v-model="selectedType" color="info" class="type-tabs" show-arrows>
          <v-tab v-for="type in typeTabs" :key="type.value" :value="type.value">
            <v-icon :icon="type.icon" size="18" class="mr-2" />
            {{ type.title }}
            <span class="tab-count">{{ type.count }}</span>
          </v-tab>
        </v-tabs>
      </div>

      <div class="inventory-toolbar">
        <v-text-field
          v-model="search"
          label="Search plots"
          placeholder="Code, section, block, number, or occupant"
          prepend-inner-icon="mdi-magnify"
          hide-details
          class="plot-search"
        />
        <v-select
          v-model="selectedStatus"
          :items="statusFilterOptions"
          item-title="title"
          item-value="value"
          label="Status"
          clearable
          hide-details
          class="status-filter"
        />
        <v-spacer />
        <v-tooltip text="Refresh inventory" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-refresh"
              variant="outlined"
              color="primary"
              height="48"
              width="48"
              :loading="isLoading"
              aria-label="Refresh plot inventory"
              @click="loadPlots"
            />
          </template>
        </v-tooltip>
        <v-btn-toggle v-model="viewMode" mandatory color="primary" class="view-toggle">
          <v-tooltip text="List view" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" value="list" icon="mdi-format-list-bulleted" aria-label="List view" />
            </template>
          </v-tooltip>
          <v-tooltip text="Grid view" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" value="grid" icon="mdi-view-grid-outline" aria-label="Grid view" />
            </template>
          </v-tooltip>
        </v-btn-toggle>
      </div>

      <v-data-table
        v-if="viewMode === 'list'"
        :headers="headers"
        :items="filteredPlots"
        :loading="isLoading"
        :items-per-page="15"
        item-value="id"
        loading-text="Loading plot inventory..."
        class="plot-table"
        hover
      >
        <template #item.code="{ item }">
          <button type="button" class="plot-code-button" @click="openDetails(item)">
            <span :class="['type-icon', `type-icon--${item.type}`]">
              <v-icon :icon="getTypeIcon(item.type)" size="18" />
            </span>
            <span>
              <strong>{{ item.code }}</strong>
              <small>#{{ item.id }}</small>
            </span>
          </button>
        </template>

        <template #item.type="{ item }">
          <span class="type-label">{{ getTypeLabel(item.type) }}</span>
        </template>

        <template #item.location="{ item }">
          <div class="location-cell">
            <strong>{{ getPrimaryLocation(item) }}</strong>
            <span>{{ getSecondaryLocation(item) }}</span>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            <span class="status-dot" />
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.occupant="{ item }">
          <div v-if="getOccupant(item)" class="occupant-cell">
            <strong>{{ getOccupantName(item) }}</strong>
            <span>{{ getOccupant(item).caseNumber }}</span>
          </div>
          <span v-else class="muted-value">No active interment</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="date-value">{{ formatDate(item.updatedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-tooltip text="View plot" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-outline"
                  variant="text"
                  color="secondary"
                  size="small"
                  @click="openDetails(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Edit plot" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil-outline"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="openEdit(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <InventoryEmptyState @add="openCreate" />
        </template>
      </v-data-table>

      <div v-else-if="isLoading" class="grid-loading">
        <v-progress-circular indeterminate color="info" />
        <span>Loading plot inventory...</span>
      </div>

      <div v-else-if="filteredPlots.length" class="plot-grid">
        <button
          v-for="plot in filteredPlots"
          :key="plot.id"
          type="button"
          class="plot-tile"
          @click="openDetails(plot)"
        >
          <span :class="['plot-tile__status', `plot-tile__status--${plot.status}`]" />
          <span class="plot-tile__top">
            <span :class="['type-icon', `type-icon--${plot.type}`]">
              <v-icon :icon="getTypeIcon(plot.type)" size="20" />
            </span>
            <v-chip :color="getStatusColor(plot.status)" size="x-small" variant="tonal">
              {{ getStatusLabel(plot.status) }}
            </v-chip>
          </span>
          <strong class="plot-tile__code">{{ plot.code }}</strong>
          <span class="plot-tile__type">{{ getTypeLabel(plot.type) }}</span>
          <span class="plot-tile__location">
            <v-icon icon="mdi-map-marker-outline" size="15" />
            {{ formatLocation(plot) }}
          </span>
          <span class="plot-tile__occupant">
            <v-icon :icon="getOccupant(plot) ? 'mdi-account-outline' : 'mdi-account-off-outline'" size="15" />
            {{ getOccupant(plot) ? getOccupantName(plot) : 'No active interment' }}
          </span>
        </button>
      </div>

      <InventoryEmptyState v-else @add="openCreate" />
    </div>

    <v-dialog v-model="detailsDialog" max-width="760" scrollable>
      <v-card v-if="selectedPlot" class="details-dialog">
        <header class="dialog-header">
          <div class="dialog-title">
            <span :class="['dialog-title__icon', `type-icon--${selectedPlot.type}`]">
              <v-icon :icon="getTypeIcon(selectedPlot.type)" />
            </span>
            <div>
              <p>{{ getTypeLabel(selectedPlot.type) }}</p>
              <h2>{{ selectedPlot.code }}</h2>
            </div>
          </div>
          <div class="dialog-header__actions">
            <v-chip :color="getStatusColor(selectedPlot.status)" size="small" variant="flat">
              {{ getStatusLabel(selectedPlot.status) }}
            </v-chip>
            <v-btn icon="mdi-close" variant="text" color="white" aria-label="Close plot details" @click="detailsDialog = false" />
          </div>
        </header>

        <v-card-text class="details-dialog__body">
          <section class="plot-detail-section">
            <div class="section-heading">
              <span><v-icon icon="mdi-map-marker-outline" size="19" /></span>
              <div>
                <h3>Plot information</h3>
                <p>Permanent identification and physical location.</p>
              </div>
            </div>
            <dl class="details-grid">
              <div><dt>Plot code</dt><dd>{{ selectedPlot.code }}</dd></div>
              <div><dt>Type</dt><dd>{{ getTypeLabel(selectedPlot.type) }}</dd></div>
              <div><dt>Section</dt><dd>{{ selectedPlot.section || 'Not specified' }}</dd></div>
              <div><dt>Block</dt><dd>{{ selectedPlot.block || 'Not specified' }}</dd></div>
              <div><dt>Number</dt><dd>{{ selectedPlot.number || 'Not specified' }}</dd></div>
              <div><dt>Cemetery</dt><dd>{{ selectedPlot.cemetery?.name || 'OPCO Cemetery' }}</dd></div>
            </dl>
          </section>

          <section class="plot-detail-section occupant-section">
            <div class="section-heading">
              <span><v-icon icon="mdi-account-box-outline" size="19" /></span>
              <div>
                <h3>Current interment</h3>
                <p>Active occupant and renewal coverage assigned to this plot.</p>
              </div>
            </div>

            <div v-if="getOccupant(selectedPlot)" class="occupant-profile">
              <span class="occupant-avatar">{{ getOccupantInitials(selectedPlot) }}</span>
              <div class="occupant-profile__name">
                <strong>{{ getOccupantName(selectedPlot) }}</strong>
                <span>{{ getOccupant(selectedPlot).caseNumber }}</span>
              </div>
              <dl>
                <div>
                  <dt>Date of death</dt>
                  <dd>{{ formatDate(getOccupant(selectedPlot).dateOfDeath) }}</dd>
                </div>
                <div>
                  <dt>Coverage expiration</dt>
                  <dd>{{ formatRenewalDate(selectedPlot) }}</dd>
                </div>
                <div>
                  <dt>Representative</dt>
                  <dd>{{ getOccupant(selectedPlot).contactPerson || 'Not provided' }}</dd>
                </div>
              </dl>
            </div>
            <div v-else class="available-notice">
              <v-icon icon="mdi-check-circle-outline" size="22" />
              <div>
                <strong>No active interment assigned</strong>
                <span>This space can be selected from the New Interment workflow when its status is available.</span>
              </div>
            </div>
          </section>

          <section v-if="selectedPlot.notes" class="plot-notes">
            <strong>Office notes</strong>
            <p>{{ selectedPlot.notes }}</p>
          </section>
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <span class="last-updated">Last updated {{ formatDateTime(selectedPlot.updatedAt) }}</span>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="detailsDialog = false">Close</v-btn>
          <v-btn color="primary" prepend-icon="mdi-pencil-outline" @click="openEdit(selectedPlot)">Edit plot</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editorDialog" max-width="850" persistent scrollable>
      <v-card class="editor-dialog">
        <header class="dialog-header">
          <div class="dialog-title">
            <span class="dialog-title__icon dialog-title__icon--neutral">
              <v-icon :icon="editorMode === 'create' ? 'mdi-map-marker-plus-outline' : 'mdi-pencil-outline'" />
            </span>
            <div>
              <p>{{ editorMode === 'create' ? 'New inventory record' : editor.code }}</p>
              <h2>{{ editorMode === 'create' ? 'Add Cemetery Plot' : 'Edit Cemetery Plot' }}</h2>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" aria-label="Close plot form" @click="closeEditor" />
        </header>

        <v-card-text class="editor-dialog__body">
          <v-form ref="plotForm">
            <div class="form-intro">
              <span><v-icon icon="mdi-information-outline" size="19" /></span>
              <p>Use a permanent code and physical location that cemetery officers can identify on site.</p>
            </div>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editor.cemeteryId"
                  :items="cemeteries"
                  item-title="name"
                  item-value="id"
                  label="Cemetery"
                  prepend-inner-icon="mdi-map-marker-radius-outline"
                  :disabled="isOccupiedEditor"
                  :rules="requiredRules('Cemetery')"
                  class="cemetery-editor-select"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editor.type"
                  :items="typeOptions"
                  item-title="title"
                  item-value="value"
                  label="Plot type"
                  :disabled="isOccupiedEditor"
                  :rules="requiredRules('Plot type')"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editor.code"
                  label="Plot code"
                  placeholder="Example: LOT-041"
                  :rules="requiredRules('Plot code')"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="editor.section" label="Section / area" placeholder="Example: Lot Yard" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="editor.block" label="Block" placeholder="Example: Block A" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="editor.number" label="Unit number" placeholder="Example: 041" />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editor.status"
                  :items="editorStatusOptions"
                  item-title="title"
                  item-value="value"
                  label="Operational status"
                  :disabled="isOccupiedEditor"
                  :rules="requiredRules('Status')"
                  required
                />
                <div v-if="isOccupiedEditor" class="occupied-lock-notice">
                  <v-icon icon="mdi-lock-outline" size="17" />
                  Cemetery, status, and plot type are locked by the active interment record.
                </div>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editor.notes"
                  label="Office notes"
                  placeholder="Maintenance instructions, access concerns, or other plot details"
                  rows="3"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeEditor">Cancel</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save-outline"
            :loading="saving"
            @click="savePlot"
          >
            {{ editorMode === 'create' ? 'Add plot' : 'Save changes' }}
          </v-btn>
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
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const apiUrl = 'http://localhost:8055/api';
const route = useRoute();
const plots = ref([]);
const cemeteries = ref([]);
const isLoading = ref(true);
const saving = ref(false);
const search = ref('');
const selectedType = ref('all');
const selectedStatus = ref(null);
const viewMode = ref('list');
const detailsDialog = ref(false);
const editorDialog = ref(false);
const selectedPlot = ref(null);
const editorMode = ref('create');
const plotForm = ref(null);
const snackbar = ref({ show: false, text: '', color: 'success' });

const typeOptions = [
  { title: 'Lot Yard', value: 'lot', icon: 'mdi-map-marker-outline', prefix: 'LOT' },
  { title: 'Apartment Tomb', value: 'apartment', icon: 'mdi-office-building-outline', prefix: 'APT' },
  { title: 'Baby Apartment Tomb', tabTitle: 'Baby Tomb', value: 'baby_apartment', icon: 'mdi-baby-face-outline', prefix: 'BABY' },
  { title: 'Bone Vault', value: 'bone_vault', icon: 'mdi-archive-outline', prefix: 'BV' },
];

const typeOrder = typeOptions.map(option => option.value);

const statusOptions = [
  { title: 'Available', value: 'available' },
  { title: 'Reserved', value: 'reserved' },
  { title: 'Under maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
];

const statusFilterOptions = [
  { title: 'Available', value: 'available' },
  { title: 'Occupied', value: 'occupied' },
  { title: 'Reserved', value: 'reserved' },
  { title: 'Under maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
];

const headers = [
  { title: 'Plot code', key: 'code', minWidth: 160 },
  { title: 'Type', key: 'type', minWidth: 155 },
  { title: 'Location', key: 'location', minWidth: 190, sortable: false },
  { title: 'Status', key: 'status', width: 150 },
  { title: 'Current interment', key: 'occupant', minWidth: 220, sortable: false },
  { title: 'Updated', key: 'updatedAt', width: 135 },
  { title: '', key: 'actions', width: 90, sortable: false, align: 'center' },
];

const createEditor = (type, cemeteryId = cemeteries.value[0]?.id || null) => ({
  id: null,
  cemeteryId,
  type,
  code: suggestCode(type, cemeteryId),
  section: getDefaultSection(type),
  block: getDefaultBlock(type),
  number: suggestNumber(type, cemeteryId),
  status: 'available',
  notes: '',
});

const editor = ref({
  id: null,
  cemeteryId: null,
  type: 'lot',
  code: '',
  section: '',
  block: '',
  number: '',
  status: 'available',
  notes: '',
});

const requiredRules = label => [value => !!String(value || '').trim() || `${label} is required`];

const availableCount = computed(() => plots.value.filter(plot => plot.status === 'available').length);
const occupiedCount = computed(() => plots.value.filter(plot => plot.status === 'occupied').length);
const attentionCount = computed(() => plots.value.filter(plot => ['maintenance', 'unavailable'].includes(plot.status)).length);
const utilizationRate = computed(() => plots.value.length ? Math.round((occupiedCount.value / plots.value.length) * 100) : 0);

const typeTabs = computed(() => [
  { title: 'All spaces', value: 'all', icon: 'mdi-view-grid-outline', count: plots.value.length },
  ...typeOptions.map(type => ({
    ...type,
    title: type.tabTitle || type.title,
    count: plots.value.filter(plot => plot.type === type.value).length,
  })),
]);

const filteredPlots = computed(() => {
  const term = search.value.trim().toLowerCase();
  return plots.value.filter(plot => {
    const searchable = [
      plot.code,
      plot.section,
      plot.block,
      plot.number,
      plot.cemetery?.name,
      getOccupantName(plot),
      getOccupant(plot)?.caseNumber,
    ].filter(Boolean).join(' ').toLowerCase();

    return (selectedType.value === 'all' || plot.type === selectedType.value)
      && (!selectedStatus.value || plot.status === selectedStatus.value)
      && (!term || searchable.includes(term));
  });
});

const isOccupiedEditor = computed(() => {
  const source = plots.value.find(plot => plot.id === editor.value.id);
  return Boolean(source && getOccupant(source));
});

const editorStatusOptions = computed(() => {
  if (isOccupiedEditor.value) return [{ title: 'Occupied', value: 'occupied' }];
  return statusOptions;
});

const InventoryEmptyState = defineComponent({
  emits: ['add'],
  setup(_, { emit }) {
    return () => h('div', { class: 'inventory-empty' }, [
      h('span', { class: 'inventory-empty__icon' }, [h('i', { class: 'mdi mdi-map-marker-off-outline' })]),
      h('h3', 'No plots match this view'),
      h('p', 'Adjust the filters or add a new cemetery plot.'),
      h('button', { class: 'empty-add-button', type: 'button', onClick: () => emit('add') }, [
        h('i', { class: 'mdi mdi-plus' }),
        'Add plot',
      ]),
    ]);
  },
});

watch([() => editor.value.type, () => editor.value.cemeteryId], ([type, cemeteryId], [previousType, previousCemeteryId]) => {
  if (editorMode.value !== 'create' || !editorDialog.value) return;
  if (type === previousType && cemeteryId === previousCemeteryId) return;
  editor.value.code = suggestCode(type, cemeteryId);
  editor.value.number = suggestNumber(type, cemeteryId);
  editor.value.section = getDefaultSection(type);
  editor.value.block = getDefaultBlock(type);
});

onMounted(async () => {
  await loadWorkspace();
  applyRouteContext();
});

async function loadWorkspace() {
  try {
    const response = await axios.get(`${apiUrl}/cemeteries`);
    cemeteries.value = response.data.data;
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to load cemetery locations.'), 'error');
  }
  await loadPlots();
}

async function loadPlots() {
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiUrl}/plots`);
    plots.value = [...response.data.data].sort((first, second) => {
      const typeDifference = typeOrder.indexOf(first.type) - typeOrder.indexOf(second.type);
      return typeDifference || first.code.localeCompare(second.code, undefined, { numeric: true });
    });
    if (selectedPlot.value) {
      selectedPlot.value = plots.value.find(plot => plot.id === selectedPlot.value.id) || null;
    }
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to load the plot inventory.'), 'error');
  } finally {
    isLoading.value = false;
  }
}

function applyRouteContext() {
  const requestedType = String(route.query.type || '');
  if (typeOptions.some(option => option.value === requestedType)) {
    selectedType.value = requestedType;
  }

  const requestedCode = String(route.query.plot || '').trim().toUpperCase();
  if (!requestedCode) return;
  search.value = requestedCode;

  const requestedPlot = plots.value.find(plot => plot.code === requestedCode);
  if (requestedPlot && route.query.action === 'edit') openEdit(requestedPlot);
}

function openDetails(plot) {
  selectedPlot.value = plot;
  detailsDialog.value = true;
}

function openCreate() {
  const preferredType = selectedType.value === 'all' ? 'lot' : selectedType.value;
  editorMode.value = 'create';
  editor.value = createEditor(preferredType, cemeteries.value[0]?.id || null);
  editorDialog.value = true;
}

function openEdit(plot) {
  detailsDialog.value = false;
  editorMode.value = 'edit';
  editor.value = {
    id: plot.id,
    cemeteryId: plot.cemeteryId,
    type: plot.type,
    code: plot.code,
    section: plot.section || '',
    block: plot.block || '',
    number: plot.number || '',
    status: plot.status,
    notes: plot.notes || '',
  };
  editorDialog.value = true;
}

function closeEditor() {
  editorDialog.value = false;
  plotForm.value?.resetValidation();
}

async function savePlot() {
  const result = await plotForm.value?.validate();
  if (result && !result.valid) {
    showSnackbar('Review the required plot fields before saving.', 'warning');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      cemeteryId: editor.value.cemeteryId,
      type: editor.value.type,
      code: editor.value.code.trim().toUpperCase(),
      section: editor.value.section?.trim() || null,
      block: editor.value.block?.trim() || null,
      number: editor.value.number?.trim() || null,
      status: editor.value.status,
      notes: editor.value.notes?.trim() || null,
    };

    const response = editorMode.value === 'create'
      ? await axios.post(`${apiUrl}/plots`, payload)
      : await axios.patch(`${apiUrl}/plots/${editor.value.id}`, payload);
    const saved = response.data.data;

    if (editorMode.value === 'create') {
      plots.value.push(saved);
      plots.value.sort((a, b) => a.type.localeCompare(b.type) || a.code.localeCompare(b.code));
      showSnackbar(`${saved.code} added to the inventory.`, 'success');
    } else {
      const index = plots.value.findIndex(plot => plot.id === saved.id);
      if (index !== -1) plots.value.splice(index, 1, saved);
      if (selectedPlot.value?.id === saved.id) selectedPlot.value = saved;
      showSnackbar(`${saved.code} updated.`, 'success');
    }
    closeEditor();
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to save the plot record.'), 'error');
  } finally {
    saving.value = false;
  }
}

function suggestCode(type, cemeteryId = editor.value.cemeteryId) {
  const option = typeOptions.find(item => item.value === type);
  const next = getNextSequence(type, cemeteryId);
  return `${option?.prefix || 'PLOT'}-${String(next).padStart(3, '0')}`;
}

function suggestNumber(type, cemeteryId = editor.value.cemeteryId) {
  return String(getNextSequence(type, cemeteryId)).padStart(3, '0');
}

function getNextSequence(type, cemeteryId) {
  const numbers = plots.value
    .filter(plot => plot.type === type && (!cemeteryId || plot.cemeteryId === cemeteryId))
    .map(plot => Number(String(plot.code).match(/(\d+)$/)?.[1] || 0));
  return Math.max(0, ...numbers) + 1;
}

function getDefaultSection(type) {
  return {
    lot: 'Lot Yard',
    apartment: 'Apartment Tombs',
    baby_apartment: 'Baby Apartment Tombs',
    bone_vault: 'Bone Vault',
  }[type] || '';
}

function getDefaultBlock(type) {
  return {
    apartment: 'Apartment A',
    baby_apartment: 'Baby Vault A',
    bone_vault: 'Bone Vault A',
  }[type] || '';
}

function getTypeLabel(type) {
  return typeOptions.find(option => option.value === type)?.title || type;
}

function getTypeIcon(type) {
  return typeOptions.find(option => option.value === type)?.icon || 'mdi-map-marker-outline';
}

function getStatusLabel(status) {
  return {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    maintenance: 'Maintenance',
    unavailable: 'Unavailable',
  }[status] || status;
}

function getStatusColor(status) {
  return {
    available: 'success',
    occupied: 'info',
    reserved: 'warning',
    maintenance: 'warning',
    unavailable: 'error',
  }[status] || 'secondary';
}

function getOccupant(plot) {
  return plot.interments?.[0] || null;
}

function getOccupantName(plot) {
  const occupant = getOccupant(plot);
  return occupant ? [occupant.firstName, occupant.middleName, occupant.lastName].filter(Boolean).join(' ') : '';
}

function getOccupantInitials(plot) {
  const occupant = getOccupant(plot);
  return occupant ? `${occupant.firstName?.charAt(0) || ''}${occupant.lastName?.charAt(0) || ''}`.toUpperCase() : '--';
}

function getPrimaryLocation(plot) {
  return plot.section || 'No section assigned';
}

function getSecondaryLocation(plot) {
  return [plot.block, plot.number ? `Unit ${plot.number}` : null].filter(Boolean).join(' / ') || 'No block or unit';
}

function formatLocation(plot) {
  return [plot.section, plot.block, plot.number].filter(Boolean).join(' / ') || 'Location not specified';
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'not recorded';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRenewalDate(plot) {
  const renewal = getOccupant(plot)?.renewals?.[0];
  return renewal?.expiresAt ? formatDate(renewal.expiresAt) : 'No renewal schedule';
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color };
}

function getApiError(error, fallback) {
  return error.response?.data?.error || error.response?.data?.message || fallback;
}
</script>

<style scoped>
.plot-workspace {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.inventory-overview {
  background: #f8fafc;
  border: 1px solid #cad5e2;
  border-radius: 8px;
  display: grid;
  grid-template-columns: minmax(310px, 1.4fr) repeat(3, minmax(150px, 0.65fr));
  overflow: hidden;
}

.utilization-summary,
.inventory-metric {
  padding: 17px 20px;
}

.utilization-summary {
  display: grid;
  gap: 12px;
}

.utilization-summary__heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
}

.utilization-summary__heading > div {
  align-items: baseline;
  display: flex;
  gap: 10px;
}

.utilization-summary p {
  color: #5c6f82;
  font-size: 0.78rem;
  margin: 0;
}

.utilization-summary strong {
  color: #102a43;
  font-size: 1.3rem;
}

.utilization-summary__heading > span {
  color: #6b7f93;
  font-size: 0.72rem;
}

.inventory-metric {
  align-items: center;
  border-left: 1px solid #d9e2ec;
  display: flex;
  gap: 12px;
}

.inventory-metric > div {
  display: grid;
}

.inventory-metric strong {
  color: #102a43;
  font-size: 1.35rem;
  line-height: 1.1;
}

.inventory-metric span:last-child {
  color: #5c6f82;
  font-size: 0.76rem;
  margin-top: 3px;
}

.metric-icon,
.type-icon {
  align-items: center;
  border-radius: 7px;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
}

.metric-icon {
  height: 38px;
  width: 38px;
}

.metric-icon--green { background: #d1fae5; color: #047857; }
.metric-icon--blue { background: #dbeafe; color: #1d4ed8; }
.metric-icon--amber { background: #fef3c7; color: #a16207; }

.inventory-panel {
  background: #ffffff;
  border: 1px solid #cad5e2;
  border-radius: 8px;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.inventory-panel__header {
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

.inventory-panel__header h2 {
  color: #102a43;
  font-size: 1.08rem;
  line-height: 1.25;
  margin: 0;
}

.inventory-panel__header p {
  color: #62758a;
  font-size: 0.82rem;
  margin: 4px 0 0;
}

.add-plot-btn {
  flex: 0 0 auto;
}

.type-tabs-wrap {
  background: #e9eff6;
  border-bottom: 1px solid #c9d5e2;
  padding: 0 14px;
}

.type-tabs {
  min-height: 54px;
}

:deep(.type-tabs .v-tab) {
  color: #52677c;
  font-size: 0.78rem;
  font-weight: 650;
  min-height: 54px;
  text-transform: none;
}

:deep(.type-tabs .v-tab--selected) {
  color: #102a43;
}

.tab-count {
  align-items: center;
  background: #d3dee9;
  border-radius: 10px;
  color: #334e68;
  display: inline-flex;
  font-size: 0.66rem;
  height: 20px;
  justify-content: center;
  margin-left: 8px;
  min-width: 24px;
  padding: 0 7px;
}

.inventory-toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
  padding: 16px 18px;
}

.plot-search {
  flex: 0 1 420px;
}

.status-filter {
  flex: 0 1 220px;
}

.view-toggle {
  border: 1px solid #9fb3c8;
  height: 48px;
}

.plot-table {
  border: 0;
  border-radius: 0;
  max-width: 100%;
  min-width: 0;
}

:deep(.plot-table .v-table__wrapper) {
  max-width: 100%;
  overflow-x: auto;
}

:deep(.plot-table thead th) {
  background: #e9eff6 !important;
  color: #334e68 !important;
  font-size: 0.7rem;
  height: 46px !important;
  text-transform: uppercase;
}

:deep(.plot-table tbody td) {
  border-color: #e4eaf0 !important;
  color: #243b53;
  font-size: 0.82rem;
  height: 68px !important;
}

:deep(.plot-table tbody tr:nth-child(even)) {
  background: #fbfcfe;
}

.plot-code-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 0;
  text-align: left;
}

.plot-code-button:hover strong {
  color: #1d4f7a;
  text-decoration: underline;
}

.type-icon {
  height: 36px;
  width: 36px;
}

.type-icon--lot { background: #d1fae5; color: #047857; }
.type-icon--apartment { background: #dbeafe; color: #1d4ed8; }
.type-icon--baby_apartment { background: #fce7f3; color: #be185d; }
.type-icon--bone_vault { background: #e2e8f0; color: #475569; }

.plot-code-button > span:last-child,
.location-cell,
.occupant-cell {
  display: grid;
  gap: 2px;
}

.plot-code-button strong,
.location-cell strong,
.occupant-cell strong {
  color: #102a43;
  font-size: 0.82rem;
}

.plot-code-button small,
.location-cell span,
.occupant-cell span,
.date-value,
.muted-value {
  color: #6b7f93;
  font-size: 0.74rem;
}

.type-label {
  color: #334e68;
  font-weight: 600;
}

.status-dot {
  background: currentColor;
  border-radius: 50%;
  display: inline-block;
  height: 6px;
  margin-right: 6px;
  width: 6px;
}

.row-actions {
  display: flex;
  justify-content: center;
}

.plot-grid {
  background: #f3f6fa;
  border-top: 1px solid #d9e2ec;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  padding: 18px;
}

.plot-tile {
  background: #ffffff;
  border: 1px solid #c9d5e2;
  border-radius: 7px;
  color: #243b53;
  cursor: pointer;
  display: grid;
  min-height: 190px;
  overflow: hidden;
  padding: 17px;
  position: relative;
  text-align: left;
}

.plot-tile:hover {
  border-color: #6f91b3;
  box-shadow: 0 3px 10px rgba(16, 42, 67, 0.1);
}

.plot-tile__status {
  background: #94a3b8;
  height: 4px;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.plot-tile__status--available { background: #047857; }
.plot-tile__status--occupied { background: #1d4ed8; }
.plot-tile__status--reserved { background: #a16207; }
.plot-tile__status--maintenance { background: #b45309; }
.plot-tile__status--unavailable { background: #b42318; }

.plot-tile__top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.plot-tile__code {
  color: #102a43;
  font-size: 1.02rem;
}

.plot-tile__type {
  color: #52677c;
  font-size: 0.75rem;
  margin: 3px 0 14px;
}

.plot-tile__location,
.plot-tile__occupant {
  align-items: center;
  color: #62758a;
  display: flex;
  font-size: 0.72rem;
  gap: 6px;
  margin-top: 7px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-loading,
.inventory-empty {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 330px;
  padding: 48px 20px;
  text-align: center;
}

.grid-loading {
  color: #62758a;
  gap: 12px;
  font-size: 0.82rem;
}

.inventory-empty__icon {
  align-items: center;
  background: #dce6f1;
  border-radius: 50%;
  color: #1d4f7a;
  display: flex;
  font-size: 28px;
  height: 64px;
  justify-content: center;
  margin-bottom: 14px;
  width: 64px;
}

.inventory-empty h3 {
  color: #102a43;
  font-size: 1rem;
  margin: 0 0 5px;
}

.inventory-empty p {
  color: #6b7f93;
  font-size: 0.82rem;
  margin: 0 0 16px;
}

.empty-add-button {
  align-items: center;
  background: #102a43;
  border: 0;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.78rem;
  gap: 7px;
  min-height: 38px;
  padding: 0 16px;
}

.details-dialog,
.editor-dialog {
  border: 0;
  border-radius: 8px;
  max-height: 92vh !important;
  overflow: hidden !important;
}

.dialog-header {
  align-items: center;
  background: #102a43;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  min-height: 78px;
  padding: 14px 16px 14px 22px;
}

.dialog-title,
.dialog-header__actions {
  align-items: center;
  display: flex;
  gap: 12px;
}

.dialog-title__icon {
  align-items: center;
  border-radius: 7px;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.dialog-title__icon--neutral {
  background: #1e4f7a;
  color: #ffffff;
}

.dialog-title p {
  color: #b9c9da;
  font-size: 0.7rem;
  margin: 0 0 2px;
  text-transform: uppercase;
}

.dialog-title h2 {
  color: #ffffff;
  font-size: 1.18rem;
  line-height: 1.2;
  margin: 0;
}

.details-dialog__body,
.editor-dialog__body {
  background: #f3f6fa;
  padding: 22px !important;
}

.plot-detail-section {
  background: #ffffff;
  border: 1px solid #c9d5e2;
  padding: 20px;
}

.plot-detail-section + .plot-detail-section {
  border-top: 0;
}

.section-heading {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.section-heading > span {
  align-items: center;
  background: #dce6f1;
  border-radius: 6px;
  color: #1d4f7a;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.section-heading h3 {
  color: #102a43;
  font-size: 0.92rem;
  margin: 0;
}

.section-heading p {
  color: #6b7f93;
  font-size: 0.72rem;
  margin: 3px 0 0;
}

.details-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.details-grid > div,
.occupant-profile dl > div {
  display: grid;
  gap: 3px;
}

.details-grid dt,
.occupant-profile dt {
  color: #6b7f93;
  font-size: 0.68rem;
}

.details-grid dd,
.occupant-profile dd {
  color: #243b53;
  font-size: 0.8rem;
  font-weight: 650;
  margin: 0;
}

.occupant-profile {
  align-items: center;
  display: grid;
  gap: 14px;
  grid-template-columns: auto minmax(130px, 1fr) 2fr;
}

.occupant-avatar {
  align-items: center;
  background: #dbeafe;
  border-radius: 50%;
  color: #1d4ed8;
  display: flex;
  font-size: 0.78rem;
  font-weight: 750;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.occupant-profile__name {
  display: grid;
}

.occupant-profile__name strong {
  color: #102a43;
  font-size: 0.84rem;
}

.occupant-profile__name span {
  color: #6b7f93;
  font-size: 0.7rem;
  margin-top: 2px;
}

.occupant-profile dl {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.available-notice,
.form-intro,
.occupied-lock-notice {
  align-items: flex-start;
  display: flex;
  gap: 9px;
}

.available-notice {
  background: #ecfdf5;
  border-left: 3px solid #047857;
  color: #047857;
  padding: 13px 14px;
}

.available-notice > div {
  display: grid;
}

.available-notice strong {
  color: #065f46;
  font-size: 0.8rem;
}

.available-notice span {
  color: #477263;
  font-size: 0.72rem;
  line-height: 1.45;
  margin-top: 2px;
}

.plot-notes {
  background: #fffbea;
  border: 1px solid #f3d899;
  margin-top: 14px;
  padding: 13px 15px;
}

.plot-notes strong {
  color: #7c5b16;
  font-size: 0.74rem;
}

.plot-notes p {
  color: #6f5b2b;
  font-size: 0.76rem;
  line-height: 1.5;
  margin: 5px 0 0;
}

.dialog-actions {
  background: #f8fafc;
  flex: 0 0 auto;
  min-height: 66px;
  padding: 10px 18px !important;
}

.last-updated {
  color: #6b7f93;
  font-size: 0.68rem;
}

.form-intro {
  background: #dce6f1;
  border-left: 3px solid #1d4f7a;
  color: #334e68;
  margin-bottom: 22px;
  padding: 12px 14px;
}

.form-intro p {
  font-size: 0.76rem;
  line-height: 1.45;
  margin: 0;
}

.occupied-lock-notice {
  color: #6b7f93;
  font-size: 0.72rem;
  margin: -12px 0 4px;
}

@media (max-width: 1100px) {
  .inventory-overview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .utilization-summary {
    border-bottom: 1px solid #d9e2ec;
    grid-column: 1 / -1;
  }

  .inventory-metric:first-of-type {
    border-left: 0;
  }
}

@media (max-width: 780px) {
  .inventory-panel__header,
  .inventory-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .add-plot-btn,
  .plot-search,
  .status-filter {
    flex-basis: auto;
    width: 100%;
  }

  .view-toggle {
    align-self: flex-end;
  }

  .details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .occupant-profile {
    grid-template-columns: auto 1fr;
  }

  .occupant-profile dl {
    grid-column: 1 / -1;
  }

  .last-updated {
    display: none;
  }
}

@media (max-width: 520px) {
  .inventory-overview {
    grid-template-columns: 1fr;
  }

  .utilization-summary {
    grid-column: auto;
  }

  .inventory-metric,
  .inventory-metric:first-of-type {
    border-left: 0;
    border-top: 1px solid #d9e2ec;
  }

  .utilization-summary__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .plot-grid {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .details-grid,
  .occupant-profile dl {
    grid-template-columns: 1fr;
  }

  .dialog-header {
    padding-left: 14px;
  }

  .dialog-header__actions .v-chip {
    display: none;
  }

  .details-dialog__body,
  .editor-dialog__body {
    padding: 14px !important;
  }
}
</style>
