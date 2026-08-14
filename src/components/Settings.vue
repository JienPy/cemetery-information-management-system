<template>
  <v-container fluid class="settings-container">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <!-- Added Back Button -->
          <v-btn
            variant="text"
            color="primary"
            class="mr-4"
            @click="goBack"
            prepend-icon="mdi-arrow-left"
          >
            Back to Dashboard
          </v-btn>
          <v-divider vertical class="mr-4"></v-divider>
          <h1 class="text-h4 font-weight-bold">Settings</h1>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="saveSettings"
            :loading="isSaving"
            prepend-icon="mdi-content-save"
          >
            Save Changes
          </v-btn>
        </div>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="settings-nav soft-ui-card">
          <v-list nav>
            <v-list-item
              v-for="(item, i) in settingsSections"
              :key="i"
              :value="item"
              :active="activeSection === item.value"
              @click="activeSection = item.value"
              class="settings-nav-item"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="soft-ui-card">
          <!-- Account Settings -->
          <v-window v-model="activeSection">
            <v-window-item value="account">
              <v-card-title>Account Settings</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.account.firstName"
                      label="First Name"
                      variant="outlined"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="settings.account.lastName"
                      label="Last Name"
                      variant="outlined"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="settings.account.email"
                      label="Email"
                      variant="outlined"
                      type="email"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>

            <!-- Appearance Settings -->
            <v-window-item value="appearance">
              <v-card-title>Appearance Settings</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      v-model="settings.appearance.darkMode"
                      label="Dark Mode"
                      color="primary"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="settings.appearance.theme"
                      :items="themeOptions"
                      label="Theme"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>

            <!-- Notification Settings -->
            <v-window-item value="notifications">
              <v-card-title>Notification Settings</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      v-model="settings.notifications.email"
                      label="Email Notifications"
                      color="primary"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12">
                    <v-switch
                      v-model="settings.notifications.push"
                      label="Push Notifications"
                      color="primary"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>

            <!-- Security Settings -->
            <v-window-item value="security">
              <v-card-title>Security Settings</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-lock"
                      @click="changePassword"
                      class="mb-4"
                    >
                      Change Password
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-switch
                      v-model="settings.security.twoFactor"
                      label="Two-Factor Authentication"
                      color="primary"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Change Password Dialog -->
    <v-dialog v-model="passwordDialog" max-width="500px">
      <v-card>
        <v-card-title>Change Password</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="passwordForm.current"
            label="Current Password"
            type="password"
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.new"
            label="New Password"
            type="password"
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.confirm"
            label="Confirm New Password"
            type="password"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="passwordDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="updatePassword">Update Password</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// State
const activeSection = ref('account');
const isSaving = ref(false);
const passwordDialog = ref(false);

// Added back navigation function
const goBack = () => {
  router.push({ name: 'home' });
};

const settingsSections = [
  { title: 'Account', value: 'account', icon: 'mdi-account-circle' },
  { title: 'Appearance', value: 'appearance', icon: 'mdi-palette' },
  { title: 'Notifications', value: 'notifications', icon: 'mdi-bell' },
  { title: 'Security', value: 'security', icon: 'mdi-shield-lock' },
];

const themeOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
];

const settings = reactive({
  account: {
    firstName: '',
    lastName: '',
    email: '',
  },
  appearance: {
    darkMode: false,
    theme: 'default',
  },
  notifications: {
    email: true,
    push: true,
  },
  security: {
    twoFactor: false,
  },
});

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: '',
});

// Methods
const saveSettings = async () => {
  try {
    isSaving.value = true;
    // Implement your API call here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
    // Show success message
  } catch (error) {
    console.error('Error saving settings:', error);
    // Show error message
  } finally {
    isSaving.value = false;
  }
};

const changePassword = () => {
  passwordDialog.value = true;
};

const updatePassword = async () => {
  try {
    if (passwordForm.new !== passwordForm.confirm) {
      throw new Error('Passwords do not match');
    }
    // Implement password update API call here
    passwordDialog.value = false;
    // Show success message
  } catch (error) {
    console.error('Error updating password:', error);
    // Show error message
  }
};

// Fetch initial settings
const fetchSettings = async () => {
  try {
    // Implement your API call here to fetch user settings
    // Update the settings reactive object with the response
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
};

// Call fetchSettings when component is mounted
fetchSettings();
</script>

<style scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-nav {
  position: sticky;
  top: 80px;
}

.settings-nav-item {
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.settings-nav-item:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.soft-ui-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.soft-ui-card:hover {
  box-shadow: 0 6px 32px -1px rgba(0, 0, 0, 0.1);
}

:deep(.v-card-title) {
  font-size: 1.5rem;
  font-weight: 600;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.v-card-text) {
  padding: 24px;
}

/* Dark mode adjustments */
:deep(.v-theme--dark) .soft-ui-card {
  background-color: rgba(30, 30, 30, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Added vertical divider styling */
.v-divider.vertical {
  height: 32px;
}
</style>