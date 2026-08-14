<template>
  <v-app>
    <AppBar />
    <NavigationDrawer />

    <v-main class="lot-map-page">
      <section class="lot-map-header">
        <div class="lot-map-header__content">
          <div>
            <p class="eyebrow">Cemetery Inventory</p>
            <h1>Cemetery Grounds Map</h1>
            <p class="header-description">
              Geographic registry of ground plots across Tayabas cemetery grounds.
            </p>
          </div>
          <div class="location-badge">
            <span class="location-badge__icon">
              <v-icon icon="mdi-map-marker-radius-outline" size="21" />
            </span>
            <div>
              <strong>{{ cemeteries.length }} cemetery grounds</strong>
              <span>Brgy. Baguio, Tayabas City</span>
            </div>
          </div>
        </div>
      </section>

      <v-container fluid class="lot-map-container">
        <section class="inventory-summary" aria-label="Lot Yard inventory summary">
          <div class="summary-item summary-item--primary">
            <span><v-icon icon="mdi-map-marker-multiple-outline" size="22" /></span>
            <div><strong>{{ plots.length }}</strong><small>Total ground plots</small></div>
          </div>
          <div class="summary-item summary-item--available">
            <span><v-icon icon="mdi-map-marker-check-outline" size="22" /></span>
            <div><strong>{{ availableCount }}</strong><small>Available</small></div>
          </div>
          <div class="summary-item summary-item--occupied">
            <span><v-icon icon="mdi-account-marker-outline" size="22" /></span>
            <div><strong>{{ occupiedCount }}</strong><small>Occupied</small></div>
          </div>
          <div class="summary-item summary-item--mapped">
            <span><v-icon icon="mdi-crosshairs-gps" size="22" /></span>
            <div><strong>{{ mappedCount }}</strong><small>Saved pin positions</small></div>
          </div>
        </section>

        <section class="map-workspace">
          <header class="map-toolbar">
            <div class="map-toolbar__heading">
              <p class="section-kicker">Graveyard map view</p>
              <h2>Numbered tomb locations</h2>
              <span>{{ visiblePlots.length }} of {{ plots.length }} pins displayed</span>
            </div>

            <div class="map-toolbar__controls">
              <v-select
                v-model="selectedCemeteryId"
                :items="cemeteries"
                item-title="name"
                item-value="id"
                label="Cemetery"
                prepend-inner-icon="mdi-map-marker-radius-outline"
                hide-details
                density="comfortable"
                class="cemetery-filter"
              />
              <v-text-field
                v-model="search"
                label="Search plots"
                placeholder="Plot number, code, or occupant"
                prepend-inner-icon="mdi-magnify"
                hide-details
                density="comfortable"
                class="map-search"
              />
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Status"
                clearable
                hide-details
                density="comfortable"
                class="map-status-filter"
              />

              <v-btn-toggle v-model="mapLayer" mandatory color="primary" class="layer-toggle">
                <v-tooltip text="Satellite map" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" value="satellite" icon="mdi-satellite-variant" aria-label="Satellite map" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Street map" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" value="street" icon="mdi-map-outline" aria-label="Street map" />
                  </template>
                </v-tooltip>
              </v-btn-toggle>

              <v-tooltip text="Reset map view" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-crosshairs"
                    variant="outlined"
                    color="primary"
                    height="44"
                    width="44"
                    aria-label="Reset map view"
                    @click="resetMapView"
                  />
                </template>
              </v-tooltip>

              <v-btn
                :variant="placementMode ? 'flat' : 'outlined'"
                :color="placementMode ? 'warning' : 'primary'"
                :prepend-icon="placementMode ? 'mdi-map-marker-path' : 'mdi-map-marker-plus-outline'"
                height="44"
                class="placement-button"
                @click="placementMode = !placementMode"
              >
                {{ placementMode ? 'Positioning active' : 'Position pins' }}
              </v-btn>
            </div>
          </header>

          <v-progress-linear v-if="isLoading" indeterminate color="info" height="3" />

          <div class="map-layout">
            <div class="map-stage">
              <LMap
                ref="mapRef"
                v-model:zoom="zoom"
                :center="cemeteryCenter"
                :min-zoom="16"
                :max-zoom="21"
                :use-global-leaflet="false"
                class="cemetery-map"
                @ready="handleMapReady"
              >
                <LTileLayer
                  :key="activeLayer.name"
                  :url="activeLayer.url"
                  :attribution="activeLayer.attribution"
                  :max-zoom="21"
                  :options="{ maxNativeZoom: activeLayer.maxNativeZoom }"
                />
                <LPolygon
                  v-if="cemeteryBoundary.length"
                  :key="`cemetery-boundary-${selectedCemeteryId}`"
                  :lat-lngs="cemeteryBoundary"
                  :color="placementMode ? '#f59e0b' : '#3b82f6'"
                  :fill-color="placementMode ? '#f59e0b' : '#2563eb'"
                  :fill-opacity="0.08"
                  :weight="3"
                  :dash-array="placementMode ? '7 7' : undefined"
                />
                <LMarker
                  v-for="plot in allPlots"
                  :key="plot.id"
                  :lat-lng="getPlotPosition(plot)"
                  :icon="createPlotIcon(plot)"
                  :visible="isPlotVisible(plot)"
                  :draggable="placementMode"
                  :z-index-offset="selectedPlot?.id === plot.id ? 1000 : 0"
                  @click="selectPlot(plot)"
                  @dragend="saveMarkerPosition(plot, $event)"
                >
                  <LTooltip :options="{ direction: 'top', offset: [0, -31], opacity: 0.96 }">
                    <div class="marker-tooltip">
                      <strong>{{ plot.code }}</strong>
                      <span>{{ getStatusLabel(plot.status) }}</span>
                    </div>
                  </LTooltip>
                </LMarker>
                <LControlScale position="bottomleft" :imperial="false" />
              </LMap>

              <div class="map-site-label">
                <v-icon icon="mdi-map-marker-radius-outline" size="17" />
                <div>
                  <strong>{{ activeCemetery?.name || 'Tayabas Cemetery' }}</strong>
                  <span>{{ formatCoordinates(cemeteryCenter) }}</span>
                </div>
              </div>

              <div class="map-legend" aria-label="Plot status legend">
                <div v-for="status in legendStatuses" :key="status.value">
                  <span :class="`legend-dot legend-dot--${status.value}`" />
                  {{ status.title }}
                </div>
                <div><span class="legend-dot legend-dot--draft" />Draft position</div>
              </div>

              <div v-if="placementMode" class="placement-state">
                <v-icon icon="mdi-map-marker-path" size="17" />
                Pin placement mode
              </div>
            </div>

            <aside class="plot-inspector">
              <section class="selected-plot">
                <header>
                  <div>
                    <p class="section-kicker">Selected plot</p>
                    <h3>{{ selectedPlot?.code || 'No plot selected' }}</h3>
                  </div>
                  <v-chip
                    v-if="selectedPlot"
                    :color="getStatusColor(selectedPlot.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ getStatusLabel(selectedPlot.status) }}
                  </v-chip>
                </header>

                <template v-if="selectedPlot">
                  <div class="selected-plot__number">{{ getPlotNumber(selectedPlot) }}</div>
                  <dl class="plot-facts">
                    <div><dt>Section</dt><dd>{{ selectedPlot.section || 'Lot Yard' }}</dd></div>
                    <div><dt>Block</dt><dd>{{ selectedPlot.block || 'Not assigned' }}</dd></div>
                    <div><dt>Map position</dt><dd>{{ hasSavedPosition(selectedPlot) ? 'Saved' : 'Draft' }}</dd></div>
                    <div><dt>Current interment</dt><dd>{{ getOccupantName(selectedPlot) || 'None' }}</dd></div>
                  </dl>
                  <div class="selected-actions">
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-crosshairs-gps"
                      variant="tonal"
                      @click="focusPlot(selectedPlot)"
                    >
                      Center pin
                    </v-btn>
                    <v-btn
                      color="secondary"
                      prepend-icon="mdi-database-outline"
                      variant="text"
                      @click="router.push('/manage-plot')"
                    >
                      Open registry
                    </v-btn>
                  </div>
                </template>

                <div v-else class="selected-plot__empty">
                  <v-icon icon="mdi-map-marker-question-outline" size="30" />
                  <span>No active map selection</span>
                </div>
              </section>

              <section class="plot-index">
                <header>
                  <h3>Ground Plot index</h3>
                  <span>{{ visiblePlots.length }} records</span>
                </header>
                <div class="plot-index__list">
                  <button
                    v-for="plot in visiblePlots"
                    :key="plot.id"
                    type="button"
                    :class="['plot-index-row', { 'plot-index-row--active': selectedPlot?.id === plot.id }]"
                    @click="selectPlot(plot, true)"
                  >
                    <span :class="['index-number', `index-number--${plot.status}`]">{{ getPlotNumber(plot) }}</span>
                    <span class="index-copy">
                      <strong>{{ plot.code }}</strong>
                      <small>{{ getOccupantName(plot) || getStatusLabel(plot.status) }}</small>
                    </span>
                    <v-icon
                      :icon="hasSavedPosition(plot) ? 'mdi-crosshairs-gps' : 'mdi-map-marker-outline'"
                      :color="hasSavedPosition(plot) ? 'success' : 'secondary'"
                      size="17"
                    />
                  </button>
                  <div v-if="!visiblePlots.length && !isLoading" class="plot-index__empty">
                    No Lot Yard records in {{ activeCemetery?.name || 'this cemetery' }}
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </v-container>

      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3500" location="top right">
        {{ snackbar.text }}
        <template #actions>
          <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false" />
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LControlScale,
  LMap,
  LMarker,
  LPolygon,
  LTileLayer,
  LTooltip,
} from '@vue-leaflet/vue-leaflet';
import AppBar from '../components/AppBar.vue';
import NavigationDrawer from '../components/NavigationDrawer.vue';

const apiUrl = 'http://localhost:8055/api';
const router = useRouter();
const mapRef = ref(null);
const mapObject = shallowRef(null);
const zoom = ref(19);
const cemeteries = ref([]);
const selectedCemeteryId = ref(null);
const allPlots = ref([]);
const selectedPlot = ref(null);
const selectedStatus = ref(null);
const search = ref('');
const mapLayer = ref('satellite');
const placementMode = ref(false);
const isLoading = ref(true);
const savingPlotId = ref(null);
const snackbar = ref({ show: false, text: '', color: 'success' });

const mapLayers = {
  satellite: {
    name: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxNativeZoom: 17,
  },
  street: {
    name: 'street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
  },
};

const statusOptions = [
  { title: 'Available', value: 'available' },
  { title: 'Occupied', value: 'occupied' },
  { title: 'Reserved', value: 'reserved' },
  { title: 'Under maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
];

const legendStatuses = statusOptions.slice(0, 4);
const activeCemetery = computed(() => cemeteries.value.find(cemetery => cemetery.id === selectedCemeteryId.value) || null);
const cemeteryCenter = computed(() => {
  const cemetery = activeCemetery.value;
  return [Number(cemetery?.latitude || 14.0211), Number(cemetery?.longitude || 121.5858)];
});
const cemeteryBoundary = computed(() => activeCemetery.value?.boundary || []);
const activeLayer = computed(() => mapLayers[mapLayer.value]);
const plots = computed(() => allPlots.value.filter(plot => plot.cemeteryId === selectedCemeteryId.value));
const availableCount = computed(() => plots.value.filter(plot => plot.status === 'available').length);
const occupiedCount = computed(() => plots.value.filter(plot => plot.status === 'occupied').length);
const mappedCount = computed(() => plots.value.filter(hasSavedPosition).length);

const visiblePlots = computed(() => {
  const term = search.value.trim().toLowerCase();
  return plots.value.filter(plot => {
    const searchable = [plot.code, plot.number, plot.section, plot.block, getOccupantName(plot)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (!selectedStatus.value || plot.status === selectedStatus.value)
      && (!term || searchable.includes(term));
  });
});

onMounted(loadWorkspace);

watch(selectedCemeteryId, async (cemeteryId, previousId) => {
  if (!cemeteryId || cemeteryId === previousId) return;
  selectedPlot.value = null;
  await nextTick();
  resetMapView();
  window.setTimeout(resetMapView, 80);
});

async function loadWorkspace() {
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiUrl}/cemeteries`);
    cemeteries.value = response.data.data;
    selectedCemeteryId.value = cemeteries.value[0]?.id || null;
    await loadPlots();
  } catch (error) {
    isLoading.value = false;
    showSnackbar(getApiError(error, 'Unable to load cemetery locations.'), 'error');
  }
}

async function loadPlots() {
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiUrl}/plots`, { params: { type: 'lot' } });
    allPlots.value = [...response.data.data].sort((first, second) => (
      first.cemeteryId - second.cemeteryId
      || Number(first.number || first.id) - Number(second.number || second.id)
    ));
    if (selectedPlot.value) {
      selectedPlot.value = allPlots.value.find(plot => plot.id === selectedPlot.value.id) || null;
    }
    await nextTick();
    resetMapView();
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to load Lot Yard plots.'), 'error');
  } finally {
    isLoading.value = false;
  }
}

function handleMapReady(leafletMap) {
  mapObject.value = leafletMap;
  resetMapView();
}

function resetMapView() {
  const exposedMap = mapRef.value?.leafletObject;
  const leafletMap = exposedMap?.value || exposedMap || mapObject.value;
  if (!leafletMap) return;
  leafletMap.invalidateSize({ animate: false });
  if (cemeteryBoundary.value.length >= 3) {
    leafletMap.fitBounds(cemeteryBoundary.value, {
      padding: [34, 34],
      maxZoom: 19,
      animate: false,
    });
  } else {
    leafletMap.setView(cemeteryCenter.value, 18, { animate: false });
  }
}

function selectPlot(plot, shouldFocus = false) {
  selectedPlot.value = plot;
  if (shouldFocus) focusPlot(plot);
}

function isPlotVisible(plot) {
  return visiblePlots.value.some(visiblePlot => visiblePlot.id === plot.id);
}

function focusPlot(plot) {
  const exposedMap = mapRef.value?.leafletObject;
  const leafletMap = exposedMap?.value || exposedMap || mapObject.value;
  if (!leafletMap || !plot) return;
  leafletMap.flyTo(getPlotPosition(plot), 20, { duration: 0.55 });
}

function hasSavedPosition(plot) {
  return plot.latitude !== null
    && plot.longitude !== null
    && Number.isFinite(Number(plot.latitude))
    && Number.isFinite(Number(plot.longitude));
}

function getPlotPosition(plot) {
  if (hasSavedPosition(plot)) return [Number(plot.latitude), Number(plot.longitude)];

  const positions = getDraftPositions(cemeteryBoundary.value, Math.max(plots.value.length, 40));
  const index = plots.value.findIndex(item => item.id === plot.id);
  return positions[Math.max(0, index) % positions.length] || cemeteryCenter.value;
}

function getDraftPositions(boundary, targetCount) {
  if (!boundary?.length) return [cemeteryCenter.value];
  const latitudes = boundary.map(point => point[0]);
  const longitudes = boundary.map(point => point[1]);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const candidates = [];
  const gridSize = Math.max(10, Math.ceil(Math.sqrt(targetCount * 3)));

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const point = [
        maxLat - ((row + 0.7) / (gridSize + 0.4)) * (maxLat - minLat),
        minLng + ((column + 0.7) / (gridSize + 0.4)) * (maxLng - minLng),
      ];
      if (isPointInsideBoundary(point, boundary)) candidates.push(point);
    }
  }

  return candidates.length ? candidates : [cemeteryCenter.value];
}

function isPointInsideBoundary([latitude, longitude], boundary) {
  let inside = false;
  for (let current = 0, previous = boundary.length - 1; current < boundary.length; previous = current, current += 1) {
    const [currentLat, currentLng] = boundary[current];
    const [previousLat, previousLng] = boundary[previous];
    const intersects = ((currentLng > longitude) !== (previousLng > longitude))
      && (latitude < ((previousLat - currentLat) * (longitude - currentLng)) / (previousLng - currentLng) + currentLat);
    if (intersects) inside = !inside;
  }
  return inside;
}

function createPlotIcon(plot) {
  const status = statusOptions.some(option => option.value === plot.status) ? plot.status : 'unavailable';
  const selectedClass = selectedPlot.value?.id === plot.id ? ' lot-map-marker--selected' : '';
  const draftClass = hasSavedPosition(plot) ? '' : ' lot-map-marker--draft';
  const savingClass = savingPlotId.value === plot.id ? ' lot-map-marker--saving' : '';
  const number = String(getPlotNumber(plot)).replace(/[^0-9A-Za-z-]/g, '').slice(0, 4);

  return divIcon({
    className: 'lot-map-marker-wrapper',
    html: `<div class="lot-map-marker lot-map-marker--${status}${selectedClass}${draftClass}${savingClass}"><span>${number}</span></div>`,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    tooltipAnchor: [0, -34],
  });
}

async function saveMarkerPosition(plot, event) {
  if (!placementMode.value) return;
  const position = event.target.getLatLng();
  savingPlotId.value = plot.id;
  try {
    const response = await axios.patch(`${apiUrl}/plots/${plot.id}`, {
      latitude: Number(position.lat.toFixed(7)),
      longitude: Number(position.lng.toFixed(7)),
    });
    const index = allPlots.value.findIndex(item => item.id === plot.id);
    if (index !== -1) allPlots.value[index] = response.data.data;
    selectedPlot.value = response.data.data;
    showSnackbar(`${plot.code} map position saved.`);
  } catch (error) {
    showSnackbar(getApiError(error, 'Unable to save the map position.'), 'error');
    await loadPlots();
  } finally {
    savingPlotId.value = null;
  }
}

function getPlotNumber(plot) {
  return plot.number || String(plot.code || '').match(/(\d+)$/)?.[1] || plot.id;
}

function getOccupant(plot) {
  return plot.interments?.[0] || null;
}

function getOccupantName(plot) {
  const occupant = getOccupant(plot);
  return occupant ? [occupant.firstName, occupant.middleName, occupant.lastName].filter(Boolean).join(' ') : '';
}

function getStatusLabel(status) {
  return statusOptions.find(option => option.value === status)?.title || 'Unavailable';
}

function formatCoordinates(position) {
  return `${Number(position?.[0] || 0).toFixed(4)}, ${Number(position?.[1] || 0).toFixed(4)}`;
}

function getStatusColor(status) {
  return {
    available: 'success',
    occupied: 'info',
    reserved: 'warning',
    maintenance: 'orange-darken-2',
    unavailable: 'error',
  }[status] || 'secondary';
}

function getApiError(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color };
}
</script>

<style scoped>
.lot-map-page {
  background: #e8eef5;
  min-height: 100vh;
}

.lot-map-header {
  background: #102a43;
  border-top: 1px solid #27496d;
  color: #ffffff;
}

.lot-map-header__content {
  align-items: center;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1600px;
  min-height: 144px;
  padding: 24px;
}

.eyebrow,
.section-kicker {
  color: #8fb4d8;
  font-size: 0.68rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

.lot-map-header h1 {
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1.2;
  margin: 0;
}

.header-description {
  color: #c8d6e5;
  font-size: 0.85rem;
  margin: 8px 0 0;
}

.location-badge {
  align-items: center;
  background: #163b60;
  border: 1px solid #315a82;
  border-radius: 7px;
  display: flex;
  flex: 0 0 auto;
  gap: 11px;
  min-width: 260px;
  padding: 12px 14px;
}

.location-badge__icon {
  align-items: center;
  background: #dbeafe;
  border-radius: 50%;
  color: #1d4ed8;
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.location-badge > div {
  display: grid;
}

.location-badge strong {
  font-size: 0.78rem;
}

.location-badge span:last-child {
  color: #b9c9da;
  font-size: 0.7rem;
  margin-top: 2px;
}

.lot-map-container {
  max-width: 1600px;
  min-width: 0;
  padding: 20px 24px 32px;
}

.inventory-summary {
  background: #ffffff;
  border: 1px solid #cdd8e5;
  border-radius: 7px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
  overflow: hidden;
}

.summary-item {
  align-items: center;
  border-left: 1px solid #d9e2ec;
  display: flex;
  gap: 12px;
  min-height: 86px;
  padding: 16px 20px;
}

.summary-item:first-child {
  border-left: 0;
}

.summary-item > span {
  align-items: center;
  border-radius: 7px;
  display: flex;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.summary-item--primary > span { background: #dce6f1; color: #1d4f7a; }
.summary-item--available > span { background: #d1fae5; color: #047857; }
.summary-item--occupied > span { background: #dbeafe; color: #1d4ed8; }
.summary-item--mapped > span { background: #fef3c7; color: #a16207; }

.summary-item > div {
  display: grid;
  gap: 2px;
}

.summary-item strong {
  color: #102a43;
  font-size: 1.35rem;
  line-height: 1;
}

.summary-item small {
  color: #62758a;
  font-size: 0.72rem;
}

.map-workspace {
  background: #ffffff;
  border: 1px solid #cdd8e5;
  border-radius: 7px;
  overflow: hidden;
}

.map-toolbar {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  min-height: 100px;
  padding: 16px 18px;
}

.map-toolbar__heading {
  flex: 0 0 auto;
}

.map-toolbar__heading h2 {
  color: #102a43;
  font-size: 1rem;
  margin: 0;
}

.map-toolbar__heading > span {
  color: #6b7f93;
  display: block;
  font-size: 0.72rem;
  margin-top: 4px;
}

.map-toolbar__controls {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  min-width: 0;
}

.map-search {
  flex: 0 1 310px;
  min-width: 210px;
}

.cemetery-filter {
  flex: 0 1 245px;
  min-width: 210px;
}

.map-status-filter {
  flex: 0 1 180px;
  min-width: 150px;
}

.layer-toggle {
  border: 1px solid #9fb3c8;
  flex: 0 0 auto;
  height: 44px;
}

.placement-button {
  flex: 0 0 auto;
}

.map-layout {
  border-top: 1px solid #d9e2ec;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  min-height: 650px;
}

.map-stage {
  min-height: 650px;
  overflow: hidden;
  position: relative;
}

.cemetery-map {
  height: 650px;
  width: 100%;
  z-index: 1;
}

.map-site-label,
.map-legend,
.placement-state {
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(16, 42, 67, 0.2);
  position: absolute;
  z-index: 500;
}

.map-site-label {
  align-items: center;
  background: rgba(16, 42, 67, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #ffffff;
  display: flex;
  gap: 9px;
  left: 14px;
  padding: 9px 11px;
  top: 14px;
}

.map-site-label > div {
  display: grid;
}

.map-site-label strong {
  font-size: 0.72rem;
}

.map-site-label span {
  color: #c8d6e5;
  font-size: 0.62rem;
}

.map-legend {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #c9d5e2;
  border-radius: 6px;
  bottom: 22px;
  color: #334e68;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.66rem;
  gap: 10px 14px;
  left: 14px;
  max-width: calc(100% - 28px);
  padding: 9px 11px;
}

.map-legend > div {
  align-items: center;
  display: flex;
  gap: 5px;
}

.legend-dot {
  border-radius: 50%;
  display: inline-block;
  height: 8px;
  width: 8px;
}

.legend-dot--available { background: #047857; }
.legend-dot--occupied { background: #1d4ed8; }
.legend-dot--reserved { background: #a16207; }
.legend-dot--maintenance { background: #c2410c; }
.legend-dot--draft { background: #ffffff; border: 1px dashed #52677c; }

.placement-state {
  align-items: center;
  background: #f59e0b;
  border-radius: 5px;
  color: #422006;
  display: flex;
  font-size: 0.7rem;
  font-weight: 700;
  gap: 6px;
  padding: 8px 10px;
  right: 14px;
  top: 14px;
}

.plot-inspector {
  background: #f7f9fc;
  border-left: 1px solid #cdd8e5;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
}

.selected-plot {
  background: #ffffff;
  border-bottom: 1px solid #d9e2ec;
  min-height: 270px;
  padding: 18px;
}

.selected-plot > header,
.plot-index > header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}

.selected-plot h3,
.plot-index h3 {
  color: #102a43;
  font-size: 0.95rem;
  margin: 0;
}

.selected-plot__number {
  align-items: center;
  background: #102a43;
  border: 4px solid #dbeafe;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  font-size: 1.15rem;
  font-weight: 800;
  height: 58px;
  justify-content: center;
  margin: 18px 0;
  width: 58px;
}

.plot-facts {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.plot-facts div {
  display: grid;
  gap: 2px;
}

.plot-facts dt {
  color: #7b8da1;
  font-size: 0.62rem;
  text-transform: uppercase;
}

.plot-facts dd {
  color: #243b53;
  font-size: 0.74rem;
  font-weight: 650;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-actions {
  display: flex;
  gap: 4px;
  margin-top: 18px;
}

.selected-actions :deep(.v-btn) {
  font-size: 0.68rem;
}

.selected-plot__empty {
  align-items: center;
  color: #8293a6;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-height: 180px;
}

.selected-plot__empty span {
  font-size: 0.74rem;
}

.plot-index {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  padding: 0 0 10px;
}

.plot-index > header {
  align-items: center;
  padding: 14px 16px 10px;
}

.plot-index > header span {
  color: #6b7f93;
  font-size: 0.66rem;
}

.plot-index__list {
  min-height: 0;
  overflow-y: auto;
  padding: 0 10px;
}

.plot-index-row {
  align-items: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #e1e8f0;
  color: #243b53;
  cursor: pointer;
  display: grid;
  gap: 10px;
  grid-template-columns: 34px minmax(0, 1fr) 18px;
  min-height: 57px;
  padding: 8px 7px;
  text-align: left;
  width: 100%;
}

.plot-index-row:hover,
.plot-index-row--active {
  background: #e8f0f8;
}

.plot-index-row--active {
  box-shadow: inset 3px 0 #1d4f7a;
}

.index-number {
  align-items: center;
  background: #64748b;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  font-size: 0.67rem;
  font-weight: 750;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.index-number--available { background: #047857; }
.index-number--occupied { background: #1d4ed8; }
.index-number--reserved { background: #a16207; }
.index-number--maintenance { background: #c2410c; }
.index-number--unavailable { background: #b42318; }

.index-copy {
  display: grid;
  min-width: 0;
}

.index-copy strong {
  color: #102a43;
  font-size: 0.74rem;
}

.index-copy small {
  color: #6b7f93;
  font-size: 0.65rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plot-index__empty {
  color: #7b8da1;
  font-size: 0.74rem;
  padding: 32px 12px;
  text-align: center;
}

.marker-tooltip {
  display: grid;
  gap: 1px;
  min-width: 80px;
}

.marker-tooltip strong {
  color: #102a43;
  font-size: 0.7rem;
}

.marker-tooltip span {
  color: #62758a;
  font-size: 0.62rem;
}

:deep(.leaflet-control-zoom a) {
  color: #102a43;
}

:deep(.leaflet-control-attribution) {
  font-size: 8px;
}

@media (max-width: 1250px) {
  .map-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-toolbar__controls {
    justify-content: flex-start;
    width: 100%;
  }

  .map-search,
  .cemetery-filter {
    flex-grow: 1;
  }
}

@media (max-width: 980px) {
  .inventory-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid #d9e2ec;
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid #d9e2ec;
  }

  .map-layout {
    grid-template-columns: 1fr;
  }

  .plot-inspector {
    border-left: 0;
    border-top: 1px solid #cdd8e5;
    grid-template-columns: minmax(280px, 0.8fr) minmax(320px, 1.2fr);
    grid-template-rows: 360px;
  }

  .selected-plot {
    border-bottom: 0;
    border-right: 1px solid #d9e2ec;
  }
}

@media (max-width: 760px) {
  .lot-map-header__content {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    padding: 24px 16px;
  }

  .location-badge {
    min-width: 0;
    width: 100%;
  }

  .lot-map-container {
    padding: 14px;
  }

  .map-toolbar__controls {
    align-items: stretch;
    display: grid;
    grid-template-columns: 1fr 1fr auto;
  }

  .cemetery-filter,
  .map-search,
  .map-status-filter {
    grid-column: 1 / -1;
    min-width: 0;
    width: 100%;
  }

  .placement-button {
    grid-column: 1 / -1;
  }

  .map-stage,
  .cemetery-map {
    height: 570px;
    min-height: 570px;
  }

  .plot-inspector {
    display: block;
  }

  .selected-plot {
    border-bottom: 1px solid #d9e2ec;
    border-right: 0;
  }

  .plot-index__list {
    max-height: 420px;
  }
}

@media (max-width: 520px) {
  .inventory-summary {
    grid-template-columns: 1fr;
  }

  .summary-item,
  .summary-item:nth-child(2),
  .summary-item:nth-child(4) {
    border-left: 0;
    border-top: 1px solid #d9e2ec;
  }

  .summary-item:first-child {
    border-top: 0;
  }

  .map-toolbar {
    padding: 16px 14px;
  }

  .map-legend {
    gap: 7px 10px;
  }

  .map-site-label {
    max-width: calc(100% - 28px);
  }

  .plot-facts {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.lot-map-marker-wrapper {
  background: transparent !important;
  border: 0 !important;
}

.lot-map-marker {
  align-items: center;
  background: #64748b;
  border: 3px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.45);
  color: #ffffff;
  display: flex;
  height: 32px;
  justify-content: center;
  transform: rotate(-45deg);
  transition: transform 150ms ease, box-shadow 150ms ease;
  width: 32px;
}

.lot-map-marker span {
  font-family: Arial, sans-serif;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  transform: rotate(45deg);
}

.lot-map-marker--available { background: #047857; }
.lot-map-marker--occupied { background: #1d4ed8; }
.lot-map-marker--reserved { background: #a16207; }
.lot-map-marker--maintenance { background: #c2410c; }
.lot-map-marker--unavailable { background: #b42318; }

.lot-map-marker--draft {
  border-color: #ffffff;
  outline: 2px dashed #334e68;
  outline-offset: 1px;
}

.lot-map-marker--selected {
  box-shadow: 0 0 0 5px rgba(250, 204, 21, 0.75), 0 3px 9px rgba(15, 23, 42, 0.55);
  transform: rotate(-45deg) scale(1.18);
}

.lot-map-marker--saving {
  opacity: 0.58;
}
</style>
