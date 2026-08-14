<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    :width="264"
    :temporary="!mdAndUp"
    class="nav-drawer"
    app
  >
    <div class="drawer-brand">
      <span class="drawer-brand__mark"><v-icon icon="mdi-bank-outline" size="22" /></span>
      <div>
        <strong>Records Office</strong>
        <span>Cemetery Operations</span>
      </div>
    </div>

    <v-list class="nav-list" nav>
      <v-list-subheader>MAIN</v-list-subheader>
      <v-list-item
        :to="{ name: 'home' }"
        :active="route.name === 'home'"
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        class="nav-item"
        @click="closeMobileDrawer"
      />

      <v-list-group value="plots">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-map-marker-multiple-outline"
            title="Plot Management"
            class="nav-item"
          />
        </template>
        <v-list-item
          v-for="item in plotItems"
          :key="item.title"
          :to="item.link"
          :active="route.name === item.link.name"
          :prepend-icon="item.icon"
          :title="item.title"
          class="nav-item nav-item--child"
          @click="closeMobileDrawer"
        />
      </v-list-group>

      <v-list-subheader class="mt-5">OPERATIONS</v-list-subheader>
      <v-list-item
        :to="{ name: 'interment' }"
        :active="route.name === 'interment'"
        prepend-icon="mdi-clipboard-text-outline"
        title="Interment Records"
        class="nav-item"
        @click="closeMobileDrawer"
      />
      <v-list-item
        :to="{ name: 'generate' }"
        :active="route.name === 'generate'"
        prepend-icon="mdi-calendar-alert-outline"
        title="Expired Records"
        class="nav-item"
        @click="closeMobileDrawer"
      />
    </v-list>

    <template #append>
      <div class="drawer-footer">
        <button type="button" class="user-preview" @click="navigateToProfile">
          <v-avatar size="38" class="user-avatar">
            <v-img v-if="userAvatar" :src="userAvatar" :alt="userProfile?.first_name || 'User'" />
            <span v-else>{{ getUserInitials }}</span>
          </v-avatar>
          <span class="user-preview__details">
            <strong>{{ userDisplayName }}</strong>
            <small>{{ userProfile?.role || 'Cemetery Officer' }}</small>
          </span>
          <v-icon icon="mdi-chevron-right" size="18" />
        </button>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();
const drawerOpen = ref(mdAndUp.value);
const apiUrl = 'http://localhost:8055';
const authToken = ref(localStorage.getItem('auth-token'));
const userAvatar = ref('');
const userProfile = ref(null);

const plotItems = [
  { link: { name: 'managePlot' }, icon: 'mdi-view-grid-outline', title: 'All Plots' },
  { link: { name: 'lotyard' }, icon: 'mdi-map-marker-outline', title: 'Cemetery Map' },
  { link: { name: 'apartment-tombs' }, icon: 'mdi-office-building-outline', title: 'Apartment Tombs' },
  { link: { name: 'boneVault' }, icon: 'mdi-archive-outline', title: 'Bone Vault' },
  { link: { name: 'babyVault' }, icon: 'mdi-baby-face-outline', title: 'Baby Vault' },
];

const getUserInitials = computed(() => {
  const first = userProfile.value?.first_name?.charAt(0) || 'A';
  const last = userProfile.value?.last_name?.charAt(0) || 'U';
  return `${first}${last}`.toUpperCase();
});

const userDisplayName = computed(() => {
  if (!userProfile.value) return 'Admin User';
  return [userProfile.value.first_name, userProfile.value.last_name].filter(Boolean).join(' ');
});

watch(mdAndUp, value => {
  drawerOpen.value = value;
});

onMounted(() => {
  window.addEventListener('toggle-navigation', toggleNavigation);
  if (authToken.value) fetchUserProfile();
});

onUnmounted(() => {
  window.removeEventListener('toggle-navigation', toggleNavigation);
});

async function fetchUserProfile() {
  try {
    const response = await axios.get(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${authToken.value}` },
    });
    const data = response.data.data;
    if (data.avatar) userAvatar.value = `${apiUrl}/assets/${data.avatar}`;
    userProfile.value = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      role: data.title,
    };
  } catch (error) {
    console.error('Unable to load the local user profile.', error);
  }
}

function toggleNavigation() {
  drawerOpen.value = !drawerOpen.value;
}

function closeMobileDrawer() {
  if (!mdAndUp.value) drawerOpen.value = false;
}

function navigateToProfile() {
  router.push('/account-profile');
  closeMobileDrawer();
}
</script>

<style scoped>
.nav-drawer {
  background: #102a43 !important;
  border-right: 1px solid #27496d !important;
  color: #d9e2ec;
}

.drawer-brand {
  align-items: center;
  border-bottom: 1px solid #27496d;
  display: flex;
  gap: 11px;
  height: 82px;
  margin: 0 14px;
  padding: 0 8px;
}

.drawer-brand__mark {
  align-items: center;
  background: #e9eff6;
  border-radius: 7px;
  color: #102a43;
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.drawer-brand > div {
  display: grid;
}

.drawer-brand strong {
  color: #ffffff;
  font-size: 0.88rem;
}

.drawer-brand span:last-child {
  color: #9fb3c8;
  font-size: 0.68rem;
  margin-top: 2px;
}

.nav-list {
  padding: 14px 10px;
}

:deep(.v-list-subheader) {
  color: #9fb3c8;
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  min-height: 30px;
}

.nav-item {
  border-radius: 6px !important;
  color: #d9e2ec;
  margin: 3px 0;
  min-height: 44px;
}

.nav-item:hover {
  background: #183d60;
}

.nav-item--child {
  font-size: 0.82rem;
  min-height: 40px;
  padding-inline-start: 28px !important;
}

:deep(.nav-item .v-list-item-title) {
  font-size: 0.84rem;
  font-weight: 550;
}

:deep(.nav-item .v-icon) {
  color: #b8c7d9;
}

:deep(.v-list-item--active.nav-item) {
  background: #e9eff6;
  color: #102a43;
}

:deep(.v-list-item--active.nav-item .v-list-item-title),
:deep(.v-list-item--active.nav-item .v-icon) {
  color: #102a43 !important;
  font-weight: 700;
}

.drawer-footer {
  background: #0d243a;
  border-top: 1px solid #27496d;
  padding: 12px;
}

.user-preview {
  align-items: center;
  background: #163b60;
  border: 1px solid #315a82;
  border-radius: 7px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 10px;
  text-align: left;
  width: 100%;
}

.user-preview:hover {
  background: #1b466f;
}

.user-avatar {
  background: #e9eff6;
  color: #102a43;
  font-size: 0.75rem;
  font-weight: 750;
}

.user-preview__details {
  display: grid;
  flex: 1;
  min-width: 0;
}

.user-preview__details strong {
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-preview__details small {
  color: #b8c7d9;
  font-size: 0.66rem;
  margin-top: 2px;
  text-transform: capitalize;
}
</style>
