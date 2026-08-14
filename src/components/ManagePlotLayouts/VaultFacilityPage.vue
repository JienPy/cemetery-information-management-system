<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />

    <v-main class="facility-page">
      <section class="facility-header-band">
        <div class="facility-header-content">
          <div>
            <p class="eyebrow">Cemetery Inventory</p>
            <h1>{{ title }}</h1>
            <p class="header-description">{{ description }}</p>
          </div>
          <div class="capacity-badge">
            <span class="capacity-badge__icon">
              <v-icon :icon="icon" size="21" />
            </span>
            <div>
              <strong>{{ columns }} columns x {{ rows }} rows</strong>
              <span>{{ capacity }} units per facility</span>
            </div>
          </div>
        </div>
      </section>

      <v-container fluid class="facility-container">
        <section class="inventory-summary" :aria-label="`${title} inventory summary`">
          <div class="summary-item summary-item--primary">
            <span><v-icon :icon="icon" size="22" /></span>
            <div><strong>{{ activePlots.length }}</strong><small>Registered units</small></div>
          </div>
          <div class="summary-item summary-item--available">
            <span><v-icon icon="mdi-door-open" size="22" /></span>
            <div><strong>{{ availableCount }}</strong><small>Available</small></div>
          </div>
          <div class="summary-item summary-item--occupied">
            <span><v-icon icon="mdi-account-lock-outline" size="22" /></span>
            <div><strong>{{ occupiedCount }}</strong><small>Occupied</small></div>
          </div>
          <div class="summary-item summary-item--attention">
            <span><v-icon icon="mdi-tools" size="22" /></span>
            <div><strong>{{ attentionCount }}</strong><small>Needs attention</small></div>
          </div>
        </section>

        <section class="facility-workspace">
          <header class="facility-toolbar">
            <div class="facility-toolbar__heading">
              <p class="section-kicker">Facility layout</p>
              <h2>{{ activeFacility?.name || defaultFacility }}</h2>
              <span>{{ activeFacility?.cemeteryName || 'Cemetery not assigned' }}</span>
            </div>

            <div class="facility-toolbar__controls">
              <v-select
                v-model="selectedFacilityKey"
                :items="facilityOptions"
                item-title="title"
                item-value="key"
                label="Facility"
                prepend-inner-icon="mdi-office-building-marker-outline"
                hide-details
                :disabled="facilityOptions.length <= 1"
                class="facility-select"
              />
              <v-text-field
                v-model="search"
                label="Search units"
                placeholder="Code, number, or occupant"
                prepend-inner-icon="mdi-magnify"
                clearable
                hide-details
                class="unit-search"
              />
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Status"
                clearable
                hide-details
                class="status-select"
              />
              <v-btn-toggle v-model="viewMode" mandatory color="primary" class="view-toggle">
                <v-tooltip text="Elevation view" location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      value="elevation"
                      icon="mdi-view-grid-outline"
                      aria-label="Elevation view"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip text="Registry list" location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      value="list"
                      icon="mdi-format-list-bulleted"
                      aria-label="Registry list"
                    />
                  </template>
                </v-tooltip>
              </v-btn-toggle>
              <v-tooltip text="Refresh inventory" location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    icon="mdi-refresh"
                    variant="outlined"
                    color="primary"
                    height="44"
                    width="44"
                    aria-label="Refresh inventory"
                    :loading="isLoading"
                    @click="loadPlots"
                  />
                </template>
              </v-tooltip>
              <v-btn
                color="primary"
                prepend-icon="mdi-database-edit-outline"
                height="44"
                @click="openRegistry"
              >
                Open registry
              </v-btn>
            </div>
          </header>

          <v-progress-linear v-if="isLoading" indeterminate color="info" height="3" />

          <div v-if="loadError" class="load-state load-state--error">
            <v-icon icon="mdi-alert-circle-outline" size="28" />
            <div>
              <strong>Unable to load this facility</strong>
              <span>{{ loadError }}</span>
            </div>
            <v-btn variant="outlined" color="primary" @click="loadPlots">Try again</v-btn>
          </div>

          <div v-else-if="!isLoading && !activePlots.length" class="load-state">
            <v-icon :icon="icon" size="30" />
            <div>
              <strong>No units registered</strong>
              <span>Add {{ unitLabel.toLowerCase() }} units from Plot Management.</span>
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openRegistry">Add units</v-btn>
          </div>

          <div v-else-if="viewMode === 'elevation'" class="elevation-layout">
            <div class="elevation-area">
              <div class="elevation-meta">
                <div>
                  <span class="status-dot status-dot--available" /> Available
                  <span class="status-dot status-dot--occupied" /> Occupied
                  <span class="status-dot status-dot--reserved" /> Reserved
                  <span class="status-dot status-dot--maintenance" /> Maintenance
                  <span class="status-dot status-dot--unavailable" /> Unavailable
                </div>
                <span>{{ matchCount }} of {{ activePlots.length }} units match</span>
              </div>

              <div class="elevation-scroll">
                <div class="building" :style="buildingStyle">
                  <div class="building-signage">
                    <span><v-icon :icon="icon" size="18" /></span>
                    <div>
                      <strong>{{ activeFacility?.name || defaultFacility }}</strong>
                      <small>{{ activeFacility?.cemeteryName }}</small>
                    </div>
                    <span class="building-signage__capacity">{{ capacity }} UNITS</span>
                  </div>

                  <div class="column-labels">
                    <span />
                    <span v-for="column in columns" :key="`column-${column}`">C{{ column }}</span>
                  </div>

                  <div class="vault-grid">
                    <template v-for="row in displayRows" :key="`row-${row}`">
                      <div class="row-label">R{{ row }}</div>
                      <button
                        v-for="column in columns"
                        :key="`cell-${row}-${column}`"
                        type="button"
                        class="vault-unit"
                        :class="unitClasses(getCell(row, column))"
                        :disabled="!getCell(row, column).plot"
                        :aria-label="unitAriaLabel(getCell(row, column))"
                        @click="selectCell(getCell(row, column))"
                      >
                        <template v-if="getCell(row, column).plot">
                          <span class="vault-unit__number">{{ unitNumber(getCell(row, column).plot) }}</span>
                          <strong>{{ getCell(row, column).plot.code }}</strong>
                          <small>{{ unitDisplayText(getCell(row, column).plot) }}</small>
                          <span class="vault-unit__status">
                            {{ statusLabel(getCell(row, column).plot.status) }}
                          </span>
                        </template>
                        <template v-else>
                          <v-icon icon="mdi-minus" size="17" />
                          <small>Unregistered</small>
                        </template>
                      </button>
                    </template>
                  </div>

                  <div class="building-base">
                    <span>FRONT ELEVATION</span>
                    <span>ACCESS AISLE</span>
                  </div>
                </div>
              </div>
            </div>

            <aside class="unit-inspector">
              <template v-if="selectedPlot">
                <div class="inspector-heading">
                  <span class="inspector-heading__icon"><v-icon :icon="icon" size="21" /></span>
                  <div>
                    <small>Selected unit</small>
                    <h3>{{ selectedPlot.code }}</h3>
                  </div>
                  <v-chip :class="`status-chip status-chip--${selectedPlot.status}`" size="small" label>
                    {{ statusLabel(selectedPlot.status) }}
                  </v-chip>
                </div>

                <dl class="unit-details">
                  <div>
                    <dt>Facility</dt>
                    <dd>{{ activeFacility?.name }}</dd>
                  </div>
                  <div>
                    <dt>Position</dt>
                    <dd>{{ selectedPosition }}</dd>
                  </div>
                  <div>
                    <dt>Cemetery</dt>
                    <dd>{{ selectedPlot.cemetery?.name || 'Not assigned' }}</dd>
                  </div>
                  <div>
                    <dt>Unit number</dt>
                    <dd>{{ selectedPlot.number || 'Not recorded' }}</dd>
                  </div>
                </dl>

                <div class="occupant-panel" :class="{ 'occupant-panel--empty': !selectedOccupant }">
                  <span class="occupant-panel__icon">
                    <v-icon :icon="selectedOccupant ? 'mdi-account-outline' : 'mdi-door-open'" size="21" />
                  </span>
                  <div v-if="selectedOccupant">
                    <small>Current interment</small>
                    <strong>{{ occupantName(selectedPlot) }}</strong>
                    <span>{{ selectedOccupant.caseNumber }}</span>
                  </div>
                  <div v-else>
                    <small>Current interment</small>
                    <strong>No active occupant</strong>
                    <span>This unit is {{ statusLabel(selectedPlot.status).toLowerCase() }}.</span>
                  </div>
                </div>

                <div v-if="selectedPlot.notes" class="unit-notes">
                  <small>Officer notes</small>
                  <p>{{ selectedPlot.notes }}</p>
                </div>

                <div class="inspector-actions">
                  <v-btn
                    v-if="selectedOccupant"
                    variant="outlined"
                    color="primary"
                    prepend-icon="mdi-clipboard-text-outline"
                    block
                    @click="openInterments"
                  >
                    View interment records
                  </v-btn>
                  <v-btn color="primary" prepend-icon="mdi-pencil-outline" block @click="editSelectedPlot">
                    Edit in plot registry
                  </v-btn>
                </div>
              </template>

              <div v-else class="inspector-empty">
                <span><v-icon icon="mdi-cursor-default-click-outline" size="27" /></span>
                <strong>Select a unit</strong>
                <p>Choose a registered unit from the elevation to view its record.</p>
              </div>
            </aside>
          </div>

          <div v-else class="registry-table-wrap">
            <v-data-table
              :headers="tableHeaders"
              :items="filteredPlots"
              :items-per-page="12"
              item-value="id"
              hover
              class="registry-table"
              @click:row="handleTableRow"
            >
              <template #item.code="{ item }">
                <div class="table-code">
                  <span><v-icon :icon="icon" size="18" /></span>
                  <div><strong>{{ item.code }}</strong><small>Unit {{ item.number || 'n/a' }}</small></div>
                </div>
              </template>
              <template #item.position="{ item }">{{ positionForPlot(item) }}</template>
              <template #item.status="{ item }">
                <v-chip :class="`status-chip status-chip--${item.status}`" size="small" label>
                  {{ statusLabel(item.status) }}
                </v-chip>
              </template>
              <template #item.occupant="{ item }">
                <span :class="{ 'muted-text': !occupantName(item) }">
                  {{ occupantName(item) || 'No active occupant' }}
                </span>
              </template>
              <template #item.updatedAt="{ item }">{{ formatDate(item.updatedAt) }}</template>
              <template #no-data>
                <div class="table-empty">No units match the current filters.</div>
              </template>
            </v-data-table>
          </div>
        </section>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AppBar from '@/components/AppBar.vue';
import NavigationDrawer from '@/components/NavigationDrawer.vue';

const props = defineProps({
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  defaultFacility: { type: String, required: true },
  unitLabel: { type: String, required: true },
  icon: { type: String, required: true },
  columns: { type: Number, required: true },
  rows: { type: Number, required: true },
});

const apiUrl = 'http://localhost:8055/api';
const router = useRouter();
const plots = ref([]);
const isLoading = ref(true);
const loadError = ref('');
const selectedFacilityKey = ref('');
const selectedPlot = ref(null);
const search = ref('');
const selectedStatus = ref(null);
const viewMode = ref('elevation');

const statusOptions = [
  { title: 'Available', value: 'available' },
  { title: 'Occupied', value: 'occupied' },
  { title: 'Reserved', value: 'reserved' },
  { title: 'Maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
];

const tableHeaders = [
  { title: 'Unit', key: 'code', minWidth: 160 },
  { title: 'Position', key: 'position', width: 130, sortable: false },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Current interment', key: 'occupant', minWidth: 210, sortable: false },
  { title: 'Updated', key: 'updatedAt', width: 140 },
];

const capacity = computed(() => props.columns * props.rows);

const facilities = computed(() => {
  const groups = new Map();
  plots.value.forEach(plot => {
    const name = plot.block?.trim() || props.defaultFacility;
    const cemeteryId = plot.cemeteryId || plot.cemetery?.id || 'unknown';
    const key = `${cemeteryId}:${name}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name,
        cemeteryId,
        cemeteryName: plot.cemetery?.name || 'Cemetery not assigned',
        plots: [],
      });
    }
    groups.get(key).plots.push(plot);
  });

  return [...groups.values()]
    .map(facility => ({
      ...facility,
      plots: [...facility.plots].sort(comparePlots),
    }))
    .sort((first, second) => first.cemeteryName.localeCompare(second.cemeteryName)
      || first.name.localeCompare(second.name, undefined, { numeric: true }));
});

const facilityOptions = computed(() => facilities.value.map(facility => ({
  key: facility.key,
  title: facilities.value.length > 1
    ? `${facility.name} · ${facility.cemeteryName}`
    : facility.name,
})));

const activeFacility = computed(() => facilities.value.find(facility => facility.key === selectedFacilityKey.value)
  || facilities.value[0]
  || null);

const activePlots = computed(() => activeFacility.value?.plots || []);
const displayRows = computed(() => Math.max(props.rows, Math.ceil(activePlots.value.length / props.columns)));
const availableCount = computed(() => activePlots.value.filter(plot => plot.status === 'available').length);
const occupiedCount = computed(() => activePlots.value.filter(plot => plot.status === 'occupied').length);
const attentionCount = computed(() => activePlots.value.filter(plot => ['maintenance', 'unavailable'].includes(plot.status)).length);
const buildingStyle = computed(() => ({ '--vault-columns': props.columns }));

const facilityCells = computed(() => {
  const totalCells = displayRows.value * props.columns;
  const cells = Array.from({ length: totalCells }, (_, index) => ({
    index,
    row: Math.floor(index / props.columns) + 1,
    column: (index % props.columns) + 1,
    plot: null,
  }));
  const unplaced = [];

  activePlots.value.forEach(plot => {
    const number = Number.parseInt(String(plot.number || '').replace(/\D/g, ''), 10);
    const index = Number.isInteger(number) && number > 0 && number <= totalCells ? number - 1 : -1;
    if (index >= 0 && !cells[index].plot) cells[index].plot = plot;
    else unplaced.push(plot);
  });

  unplaced.forEach(plot => {
    const emptyCell = cells.find(cell => !cell.plot);
    if (emptyCell) emptyCell.plot = plot;
  });
  return cells;
});

const filteredPlots = computed(() => activePlots.value.filter(matchesFilters));
const matchCount = computed(() => filteredPlots.value.length);
const selectedOccupant = computed(() => selectedPlot.value?.interments?.[0] || null);
const selectedPosition = computed(() => selectedPlot.value ? positionForPlot(selectedPlot.value) : 'Not selected');

watch(facilities, nextFacilities => {
  if (!nextFacilities.length) {
    selectedFacilityKey.value = '';
    selectedPlot.value = null;
    return;
  }
  if (!nextFacilities.some(facility => facility.key === selectedFacilityKey.value)) {
    selectedFacilityKey.value = nextFacilities[0].key;
  }
}, { immediate: true });

watch(selectedFacilityKey, () => {
  selectedPlot.value = activePlots.value[0] || null;
});

onMounted(loadPlots);

async function loadPlots() {
  isLoading.value = true;
  loadError.value = '';
  try {
    const response = await axios.get(`${apiUrl}/plots`, { params: { type: props.type } });
    plots.value = response.data.data || [];
    if (selectedPlot.value) {
      selectedPlot.value = plots.value.find(plot => plot.id === selectedPlot.value.id) || activePlots.value[0] || null;
    }
  } catch (error) {
    loadError.value = error.response?.data?.error || error.message || 'The local database did not respond.';
  } finally {
    isLoading.value = false;
  }
}

function comparePlots(first, second) {
  const firstNumber = Number.parseInt(first.number, 10);
  const secondNumber = Number.parseInt(second.number, 10);
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }
  return first.code.localeCompare(second.code, undefined, { numeric: true });
}

function getCell(row, column) {
  return facilityCells.value[((row - 1) * props.columns) + column - 1];
}

function selectCell(cell) {
  if (cell.plot) selectedPlot.value = cell.plot;
}

function matchesFilters(plot) {
  if (!plot) return false;
  if (selectedStatus.value && plot.status !== selectedStatus.value) return false;
  const term = search.value?.trim().toLowerCase();
  if (!term) return true;
  return [plot.code, plot.number, plot.block, occupantName(plot), plot.interments?.[0]?.caseNumber]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(term);
}

function unitClasses(cell) {
  if (!cell.plot) return ['vault-unit--empty'];
  return [
    `vault-unit--${cell.plot.status}`,
    { 'vault-unit--selected': selectedPlot.value?.id === cell.plot.id },
    { 'vault-unit--dimmed': !matchesFilters(cell.plot) },
  ];
}

function unitNumber(plot) {
  return String(plot.number || plot.code.match(/(\d+)$/)?.[1] || '').padStart(2, '0');
}

function unitDisplayText(plot) {
  return occupantName(plot) || `${props.unitLabel} ${plot.number || ''}`.trim();
}

function occupantName(plot) {
  const occupant = plot?.interments?.[0];
  return occupant
    ? [occupant.firstName, occupant.middleName, occupant.lastName].filter(Boolean).join(' ')
    : '';
}

function statusLabel(status) {
  return {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    maintenance: 'Maintenance',
    unavailable: 'Unavailable',
  }[status] || status;
}

function unitAriaLabel(cell) {
  if (!cell.plot) return `Row ${cell.row}, column ${cell.column}, unregistered`;
  return `${cell.plot.code}, row ${cell.row}, column ${cell.column}, ${statusLabel(cell.plot.status)}`;
}

function positionForPlot(plot) {
  const cell = facilityCells.value.find(candidate => candidate.plot?.id === plot.id);
  return cell ? `Row ${cell.row}, Column ${cell.column}` : 'Outside standard layout';
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function handleTableRow(_, row) {
  selectedPlot.value = row.item;
  viewMode.value = 'elevation';
}

function openRegistry() {
  router.push({ name: 'managePlot', query: { type: props.type } });
}

function editSelectedPlot() {
  router.push({
    name: 'managePlot',
    query: {
      type: props.type,
      plot: selectedPlot.value?.code,
      action: 'edit',
    },
  });
}

function openInterments() {
  router.push({ name: 'interment', query: { record: selectedOccupant.value?.caseNumber } });
}
</script>

<style scoped>
.facility-page {
  background: #e8eef5;
  min-height: 100vh;
}

.facility-header-band {
  background: #102a43;
  border-top: 1px solid #27496d;
  color: #ffffff;
}

.facility-header-content {
  align-items: center;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1600px;
  min-height: 146px;
  padding: 24px;
}

.eyebrow,
.section-kicker {
  color: #9fc0df;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin: 0 0 7px;
  text-transform: uppercase;
}

.facility-header-content h1 {
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1.2;
  margin: 0;
}

.header-description {
  color: #c8d6e5;
  font-size: 0.86rem;
  margin: 8px 0 0;
  max-width: 720px;
}

.capacity-badge {
  align-items: center;
  background: #163b60;
  border: 1px solid #315a82;
  border-radius: 7px;
  display: flex;
  flex: 0 0 auto;
  gap: 11px;
  min-width: 224px;
  padding: 12px 14px;
}

.capacity-badge__icon {
  align-items: center;
  background: #dbeafe;
  border-radius: 50%;
  color: #1d4ed8;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.capacity-badge > div {
  display: grid;
}

.capacity-badge strong {
  font-size: 0.78rem;
}

.capacity-badge span:last-child {
  color: #b9c9da;
  font-size: 0.7rem;
  margin-top: 2px;
}

.facility-container {
  max-width: 1600px;
  min-width: 0;
  padding: 20px 24px 32px;
}

.inventory-summary {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 16px;
  overflow: hidden;
}

.summary-item {
  align-items: center;
  border-right: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  min-height: 82px;
  padding: 14px 18px;
}

.summary-item:last-child {
  border-right: 0;
}

.summary-item > span {
  align-items: center;
  background: #e8eef5;
  border-radius: 6px;
  color: #102a43;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.summary-item > div {
  display: grid;
}

.summary-item strong {
  color: #102a43;
  font-size: 1.35rem;
  line-height: 1.15;
}

.summary-item small {
  color: #627d98;
  font-size: 0.72rem;
  margin-top: 3px;
}

.summary-item--available > span { background: #dcfce7; color: #047857; }
.summary-item--occupied > span { background: #dbeafe; color: #1d4f7a; }
.summary-item--attention > span { background: #fef3c7; color: #a16207; }

.facility-workspace {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  min-width: 0;
  overflow: hidden;
}

.facility-toolbar {
  align-items: center;
  border-bottom: 1px solid #d9e2ec;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  min-height: 94px;
  padding: 15px 18px;
}

.facility-toolbar__heading {
  flex: 0 0 auto;
}

.facility-toolbar__heading .section-kicker {
  color: #486581;
  margin-bottom: 3px;
}

.facility-toolbar__heading h2 {
  color: #102a43;
  font-size: 1.12rem;
  font-weight: 750;
  margin: 0;
}

.facility-toolbar__heading > span {
  color: #627d98;
  display: block;
  font-size: 0.72rem;
  margin-top: 2px;
}

.facility-toolbar__controls {
  align-items: center;
  display: flex;
  flex: 1;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.facility-select { max-width: 240px; }
.unit-search { max-width: 250px; }
.status-select { max-width: 170px; }

.view-toggle {
  border: 1px solid #b8c7d9;
  height: 44px;
}

.view-toggle :deep(.v-btn) {
  height: 42px !important;
  min-width: 42px !important;
}

.elevation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 292px;
  min-height: 600px;
}

.elevation-area {
  min-width: 0;
  padding: 18px;
}

.elevation-meta {
  align-items: center;
  color: #486581;
  display: flex;
  font-size: 0.69rem;
  gap: 20px;
  justify-content: space-between;
  margin: 0 2px 13px;
}

.elevation-meta > div {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.status-dot {
  border-radius: 50%;
  display: inline-block;
  height: 8px;
  margin-left: 7px;
  width: 8px;
}

.status-dot:first-child { margin-left: 0; }
.status-dot--available { background: #10b981; }
.status-dot--occupied { background: #2563eb; }
.status-dot--reserved { background: #f59e0b; }
.status-dot--maintenance { background: #64748b; }
.status-dot--unavailable { background: #dc2626; }

.elevation-scroll {
  overflow-x: auto;
  padding: 0 1px 12px;
}

.building {
  background: #d5dee8;
  border: 1px solid #829ab1;
  border-radius: 4px;
  box-shadow: 0 7px 18px rgba(16, 42, 67, 0.1);
  min-width: calc((var(--vault-columns) * 112px) + 58px);
  overflow: hidden;
}

.building-signage {
  align-items: center;
  background: #163b60;
  border-bottom: 4px solid #829ab1;
  color: #ffffff;
  display: flex;
  gap: 10px;
  min-height: 68px;
  padding: 12px 16px;
}

.building-signage > span:first-child {
  align-items: center;
  background: #dbeafe;
  border-radius: 4px;
  color: #1d4f7a;
  display: flex;
  height: 35px;
  justify-content: center;
  width: 35px;
}

.building-signage > div {
  display: grid;
}

.building-signage strong {
  font-size: 0.92rem;
}

.building-signage small {
  color: #c8d6e5;
  font-size: 0.67rem;
  margin-top: 2px;
}

.building-signage__capacity {
  color: #b9c9da;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin-left: auto;
}

.column-labels,
.vault-grid {
  display: grid;
  grid-template-columns: 44px repeat(var(--vault-columns), minmax(104px, 1fr));
}

.column-labels {
  background: #b8c7d9;
  border-bottom: 1px solid #829ab1;
  color: #334e68;
  font-size: 0.62rem;
  font-weight: 750;
  min-height: 28px;
}

.column-labels span {
  align-items: center;
  border-left: 1px solid #9fb3c8;
  display: flex;
  justify-content: center;
}

.column-labels span:first-child { border-left: 0; }

.vault-grid {
  gap: 4px;
  padding: 4px;
}

.row-label {
  align-items: center;
  background: #b8c7d9;
  border: 1px solid #9fb3c8;
  border-radius: 2px;
  color: #334e68;
  display: flex;
  font-size: 0.63rem;
  font-weight: 750;
  justify-content: center;
  min-height: 112px;
}

.vault-unit {
  align-items: flex-start;
  background: #ffffff;
  border: 2px solid #9fb3c8;
  border-radius: 2px;
  color: #243b53;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 112px;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  padding: 10px 10px 8px;
  position: relative;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.vault-unit::before {
  background: #10b981;
  content: '';
  height: 4px;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.vault-unit:hover:not(:disabled) {
  border-color: #1d4f7a;
  box-shadow: inset 0 0 0 1px #1d4f7a;
}

.vault-unit__number {
  color: #486581;
  font-size: 0.6rem;
  font-weight: 750;
  position: absolute;
  right: 8px;
  top: 8px;
}

.vault-unit strong {
  font-size: 0.76rem;
  line-height: 1.2;
  max-width: calc(100% - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vault-unit small {
  color: #627d98;
  display: block;
  font-size: 0.59rem;
  margin-top: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vault-unit__status {
  background: #dcfce7;
  border-radius: 3px;
  color: #047857;
  font-size: 0.56rem;
  font-weight: 750;
  margin-top: 9px;
  padding: 3px 5px;
  text-transform: uppercase;
}

.vault-unit--occupied {
  background: #eaf2ff;
  border-color: #7aa7d9;
}

.vault-unit--occupied::before { background: #2563eb; }
.vault-unit--occupied .vault-unit__status { background: #dbeafe; color: #1d4f7a; }
.vault-unit--reserved::before { background: #f59e0b; }
.vault-unit--reserved .vault-unit__status { background: #fef3c7; color: #92400e; }
.vault-unit--maintenance { background: #f1f5f9; }
.vault-unit--maintenance::before { background: #64748b; }
.vault-unit--maintenance .vault-unit__status { background: #e2e8f0; color: #475569; }
.vault-unit--unavailable { background: #fff1f2; border-color: #f1aeb5; }
.vault-unit--unavailable::before { background: #dc2626; }
.vault-unit--unavailable .vault-unit__status { background: #fee2e2; color: #b42318; }

.vault-unit--selected {
  border-color: #102a43;
  box-shadow: inset 0 0 0 2px #102a43;
}

.vault-unit--dimmed { opacity: 0.25; }

.vault-unit--empty {
  align-items: center;
  background: repeating-linear-gradient(135deg, #edf2f7, #edf2f7 8px, #e5ebf2 8px, #e5ebf2 16px);
  border-color: #c6d2df;
  color: #829ab1;
  cursor: default;
  justify-content: center;
}

.vault-unit--empty::before { display: none; }
.vault-unit--empty small { color: #829ab1; }

.building-base {
  align-items: center;
  background: #9fb3c8;
  border-top: 4px solid #829ab1;
  color: #243b53;
  display: flex;
  font-size: 0.58rem;
  font-weight: 750;
  justify-content: space-between;
  letter-spacing: 0.08em;
  min-height: 34px;
  padding: 0 14px 0 58px;
}

.unit-inspector {
  background: #f8fafc;
  border-left: 1px solid #d9e2ec;
  min-width: 0;
  padding: 20px;
}

.inspector-heading {
  align-items: center;
  border-bottom: 1px solid #d9e2ec;
  display: grid;
  gap: 10px;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  padding-bottom: 16px;
}

.inspector-heading__icon {
  align-items: center;
  background: #dbeafe;
  border-radius: 6px;
  color: #1d4f7a;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.inspector-heading small,
.occupant-panel small,
.unit-notes small {
  color: #627d98;
  display: block;
  font-size: 0.63rem;
  text-transform: uppercase;
}

.inspector-heading h3 {
  color: #102a43;
  font-size: 0.96rem;
  margin: 2px 0 0;
}

.status-chip {
  border: 1px solid currentColor;
  font-size: 0.62rem;
  font-weight: 750;
}

.status-chip--available { background: #ecfdf5 !important; color: #047857 !important; }
.status-chip--occupied { background: #eff6ff !important; color: #1d4f7a !important; }
.status-chip--reserved { background: #fffbeb !important; color: #92400e !important; }
.status-chip--maintenance { background: #f1f5f9 !important; color: #475569 !important; }
.status-chip--unavailable { background: #fff1f2 !important; color: #b42318 !important; }

.unit-details {
  margin: 18px 0;
}

.unit-details > div {
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 10px 0;
}

.unit-details dt {
  color: #627d98;
  font-size: 0.68rem;
}

.unit-details dd {
  color: #243b53;
  font-size: 0.7rem;
  font-weight: 700;
  margin: 0;
  max-width: 150px;
  text-align: right;
}

.occupant-panel {
  align-items: flex-start;
  background: #eaf2ff;
  border: 1px solid #b8d4f0;
  border-radius: 5px;
  display: flex;
  gap: 10px;
  padding: 12px;
}

.occupant-panel--empty {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.occupant-panel__icon {
  color: #1d4f7a;
}

.occupant-panel--empty .occupant-panel__icon { color: #047857; }

.occupant-panel > div {
  display: grid;
  min-width: 0;
}

.occupant-panel strong {
  color: #102a43;
  font-size: 0.74rem;
  margin-top: 3px;
  overflow-wrap: anywhere;
}

.occupant-panel span {
  color: #486581;
  font-size: 0.65rem;
  margin-top: 2px;
}

.unit-notes {
  border-bottom: 1px solid #d9e2ec;
  margin-top: 16px;
  padding-bottom: 14px;
}

.unit-notes p {
  color: #334e68;
  font-size: 0.69rem;
  line-height: 1.5;
  margin: 5px 0 0;
}

.inspector-actions {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.inspector-empty {
  align-items: center;
  color: #627d98;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  justify-content: center;
  text-align: center;
}

.inspector-empty > span {
  align-items: center;
  background: #e8eef5;
  border-radius: 6px;
  color: #486581;
  display: flex;
  height: 52px;
  justify-content: center;
  margin-bottom: 12px;
  width: 52px;
}

.inspector-empty strong { color: #243b53; font-size: 0.82rem; }
.inspector-empty p { font-size: 0.7rem; line-height: 1.5; max-width: 210px; }

.registry-table-wrap { min-height: 540px; }
.registry-table :deep(th) { background: #f0f4f8; color: #334e68; font-size: 0.68rem; }
.registry-table :deep(td) { color: #334e68; font-size: 0.72rem; }
.registry-table :deep(tbody tr) { cursor: pointer; }

.table-code {
  align-items: center;
  display: flex;
  gap: 10px;
}

.table-code > span {
  align-items: center;
  background: #e8eef5;
  border-radius: 4px;
  color: #1d4f7a;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.table-code > div { display: grid; }
.table-code strong { color: #102a43; font-size: 0.72rem; }
.table-code small { color: #829ab1; font-size: 0.62rem; margin-top: 2px; }
.muted-text { color: #829ab1; }
.table-empty { color: #627d98; padding: 48px 20px; }

.load-state {
  align-items: center;
  color: #486581;
  display: flex;
  gap: 14px;
  justify-content: center;
  min-height: 420px;
  padding: 30px;
}

.load-state > div { display: grid; }
.load-state strong { color: #102a43; font-size: 0.86rem; }
.load-state span { font-size: 0.72rem; margin-top: 3px; }
.load-state--error > .v-icon { color: #b42318; }
.load-state .v-btn { margin-left: 10px; }

@media (max-width: 1250px) {
  .facility-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .facility-toolbar__controls {
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;
  }

  .facility-select,
  .unit-search,
  .status-select { max-width: none; min-width: 190px; }
}

@media (max-width: 960px) {
  .elevation-layout { grid-template-columns: minmax(0, 1fr); }
  .unit-inspector { border-left: 0; border-top: 1px solid #d9e2ec; }
  .inventory-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item:nth-child(2) { border-right: 0; }
  .summary-item:nth-child(-n + 2) { border-bottom: 1px solid #e2e8f0; }
}

@media (max-width: 800px) {
  .facility-header-content {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    padding: 24px 16px;
  }

  .capacity-badge { min-width: 0; width: 100%; }
  .facility-container { padding: 14px; }
  .facility-toolbar { padding: 14px; }
  .facility-toolbar__controls { align-items: stretch; display: grid; grid-template-columns: 1fr auto auto; }
  .facility-select,
  .unit-search,
  .status-select { grid-column: 1 / -1; width: 100%; }
  .facility-toolbar__controls > .v-btn:last-child { grid-column: 1 / -1; }
  .elevation-area { padding: 14px; }
  .elevation-meta { align-items: flex-start; flex-direction: column; gap: 7px; }
}

@media (max-width: 520px) {
  .inventory-summary { grid-template-columns: 1fr; }
  .summary-item { border-bottom: 1px solid #e2e8f0; border-right: 0; min-height: 70px; }
  .summary-item:last-child { border-bottom: 0; }
  .facility-header-content h1 { font-size: 1.45rem; }
  .load-state { align-items: flex-start; flex-direction: column; }
  .load-state .v-btn { margin-left: 0; }
}
</style>
