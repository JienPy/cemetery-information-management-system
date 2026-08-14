<template>
    <v-container fluid class="profile-container">

         <!-- Back/Home Button -->
        <v-row justify="center" class="mb-4">
        <v-col cols="12" md="10" lg="8" xl="6">
            <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-arrow-left"
            class="back-home-btn"
            :class="{ 'dark-mode': state.isDarkMode }"
            @click="goBack"
            >
            Back to Home
            </v-btn>
        </v-col>
        </v-row>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8" xl="6">
          <v-card 
            class="profile-card elevation-12 overflow-hidden" 
            :class="{ 'dark-mode': state.isDarkMode }"
          >
            <!-- Loading Overlay -->
            <v-overlay 
              :model-value="state.isLoading" 
              class="align-center justify-center"
            >
              <v-progress-circular 
                :size="100"
                :width="10"
                color="primary"
                indeterminate
              >
                <template v-slot:default>
                  <span class="loading-text">Syncing Profile</span>
                </template>
              </v-progress-circular>
            </v-overlay>
    
            <!-- Profile Header -->
            <v-card-item 
              class="profile-header d-flex flex-column flex-md-row align-center justify-space-between pa-6"
            >
              <div class="d-flex flex-column flex-md-row align-center w-100">
                <div class="avatar-wrapper position-relative me-0 me-md-6 mb-4 mb-md-0">
                  <v-badge 
                    :icon="verificationBadge" 
                    color="success" 
                    overlap 
                    location="bottom end"
                  >
                    <v-avatar 
                      size="120" 
                      class="professional-avatar elevation-6"
                    >
                      <v-img 
                        v-if="userAvatar" 
                        :src="userAvatar" 
                        :alt="formData.first_name"
                        cover
                      >
                        <template #placeholder>
                          <v-avatar 
                            size="120" 
                            color="primary" 
                            class="text-h4 text-uppercase"
                          >
                            {{ userInitials }}
                          </v-avatar>
                        </template>
                      </v-img>
                      <v-avatar 
                        v-else 
                        size="120" 
                        color="primary" 
                        class="text-h4 text-uppercase"
                      >
                        {{ userInitials }}
                      </v-avatar>
                    </v-avatar>
                  </v-badge>
                  
                  <v-btn 
                    icon 
                    size="small" 
                    color="primary" 
                    class="avatar-upload-btn"
                    @click="triggerAvatarUpload"
                  >
                    <v-icon>mdi-camera-plus</v-icon>
                  </v-btn>
                  <input 
                    ref="avatarInput" 
                    type="file" 
                    accept="image/*" 
                    class="d-none" 
                    @change="handleAvatarUpload"
                  />
                </div>
    
                <div class="text-center text-md-left">
                  <h2 class="text-h4 font-weight-bold mb-2">
                    {{ formData.first_name }} {{ formData.last_name }}
                  </h2>
                  <div class="d-flex justify-center justify-md-start align-center">
                    <v-chip 
                      color="secondary" 
                      size="small" 
                      class="me-2"
                    >
                      {{ formData.title || 'Professional' }}
                    </v-chip>
                    <v-chip 
                      color="info" 
                      size="small"
                    >
                      {{ formData.department || 'Unassigned' }}
                    </v-chip>
                  </div>
                </div>
              </div>
    
              <!-- Theme Toggle and Quick Actions -->
              <div class="quick-actions mt-4 mt-md-0">
                <v-tooltip text="Toggle Dark/Light Mode">
                  <template v-slot:activator="{ props }">
                    <v-btn 
                      icon 
                      v-bind="props" 
                      @click="toggleDarkMode"
                    >
                      <v-icon>
                        {{ state.isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}
                      </v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </v-card-item>
    
            <!-- Profile Content with Tab Navigation -->
            <v-tabs 
              v-model="state.activeTab" 
              grow 
              center-active 
              class="profile-tabs"
            >
              <v-tab value="personal">Personal Info</v-tab>
              <v-tab value="professional">Professional Details</v-tab>
              <v-tab value="settings">Account Settings</v-tab>
            </v-tabs>
    
            <v-window v-model="state.activeTab">
              <!-- Personal Information Tab -->
              <v-window-item value="personal">
                <v-card-text>
                  <v-form 
                    ref="personalForm" 
                    v-model="isPersonalInfoValid" 
                    @submit.prevent="saveAllChanges"
                  >
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="formData.first_name"
                          label="First Name"
                          prepend-inner-icon="mdi-account"
                          :rules="[rules.required]"
                          variant="outlined"
                          dense
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="formData.last_name"
                          label="Last Name"
                          prepend-inner-icon="mdi-account"
                          :rules="[rules.required]"
                          variant="outlined"
                          dense
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-textarea
                          v-model="formData.bio"
                          label="Professional Bio"
                          rows="3"
                          prepend-inner-icon="mdi-text"
                          variant="outlined"
                          auto-grow
                          dense
                        ></v-textarea>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-card-text>
              </v-window-item>
    
              <!-- Professional Details Tab -->
              <v-window-item value="professional">
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.title"
                        label="Job Title"
                        prepend-inner-icon="mdi-briefcase"
                        variant="outlined"
                        dense
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.department"
                        label="Department"
                        prepend-inner-icon="mdi-office-building"
                        variant="outlined"
                        dense
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-window-item>
    
              <!-- Account Settings Tab -->
              <v-window-item value="settings">
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.email"
                        label="Email"
                        prepend-inner-icon="mdi-email"
                        :rules="[rules.email]"
                        variant="outlined"
                        dense
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.phone"
                        label="Phone Number"
                        prepend-inner-icon="mdi-phone"
                        :rules="[rules.phoneFormat]"
                        variant="outlined"
                        dense
                      ></v-text-field>
                    </v-col>
                    
                    
                    <!-- Password Change Section -->
                    <v-col cols="12">
                    <v-divider class="my-4"></v-divider>
                    <div class="d-flex align-center justify-space-between">
                        <div>
                        <h3 class="text-h6 mb-1">Password</h3>
                        <p class="text-body-2 text-grey">Change your account password</p>
                        </div>
                        <v-btn
                        color="primary"
                        variant="outlined"
                        prepend-icon="mdi-lock"
                        @click="openPasswordDialog"
                        >
                        Change Password
                        </v-btn>
                    </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-window-item>
            </v-window>
    
            <!-- Action Buttons -->
            <v-card-actions class="pa-6 d-flex justify-end">
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="saveAllChanges"
              >
                Save All Changes
              </v-btn>
            </v-card-actions>
            <!-- Add Password Change Dialog -->
  <v-dialog v-model="state.showPasswordDialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 pa-4">
        Change Password
      </v-card-title>
      
      <v-card-text>
        <v-form ref="passwordForm" v-model="isPasswordFormValid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.currentPassword"
                :append-inner-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showCurrentPassword ? 'text' : 'password'"
                label="Current Password"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                @click:append-inner="showCurrentPassword = !showCurrentPassword"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.newPassword"
                :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showNewPassword ? 'text' : 'password'"
                label="New Password"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.password]"
                @click:append-inner="showNewPassword = !showNewPassword"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.confirmPassword"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm New Password"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, passwordMatchRule]"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Password Requirements -->
          <v-card class="mt-2 bg-grey-lighten-4">
            <v-card-text>
              <div class="text-subtitle-2 mb-2">Password Requirements:</div>
              <v-list-item
                v-for="(requirement, index) in passwordRequirements"
                :key="index"
                density="compact"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon
                    :color="checkPasswordRequirement(requirement.regex) ? 'success' : 'grey'"
                    size="small"
                  >
                    {{ checkPasswordRequirement(requirement.regex) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ requirement.text }}
                </v-list-item-title>
              </v-list-item>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="closePasswordDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="state.isLoading"
          :disabled="!isPasswordFormValid"
          @click="handlePasswordChange"
        >
          Change Password
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
          </v-card>
        </v-col>
      </v-row>
    
      <!-- Notification Snackbar -->
      <v-snackbar 
        v-model="state.showNotification" 
        :color="notificationColor"
        location="top"
      >
        {{ notificationMessage }}
      </v-snackbar>
    </v-container>
  </template>
  
  <script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Configuration Constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8055';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
// Add router
const router = useRouter();
// Add goBack method
const goBack = () => {
  // If there's previous history, go back
  if (window.history.length > 2) {
    router.back();
  } else {
    // Otherwise go to home
    router.push('/');
  }
};
// State Management
const state = reactive({
  isLoading: false,
  isDarkMode: localStorage.getItem('dark-mode') === 'true' || false,
  showNotification: false,
  activeTab: 'personal',
  authToken: localStorage.getItem('auth-token'),
  showPasswordDialog: false,
});


// Password change form data
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Password visibility toggles
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Form validation
const passwordForm = ref(null);
const isPasswordFormValid = ref(false);

// Password requirements
const passwordRequirements = [
  { regex: /.{8,}/, text: 'At least 8 characters long' },
  { regex: /[A-Z]/, text: 'Contains at least one uppercase letter' },
  { regex: /[a-z]/, text: 'Contains at least one lowercase letter' },
  { regex: /[0-9]/, text: 'Contains at least one number' },
  { regex: /[!@#$%^&*]/, text: 'Contains at least one special character (!@#$%^&*)' },
];


// Computed password match rule
const passwordMatchRule = (v) => 
  v === passwordData.value.newPassword || 'Passwords must match';

// Methods
const checkPasswordRequirement = (regex) => {
  return regex.test(passwordData.value.newPassword);
};

const openPasswordDialog = () => {
  state.showPasswordDialog = true;
};

const closePasswordDialog = () => {
  state.showPasswordDialog = false;
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
};

const handlePasswordChange = async () => {
  if (!passwordForm.value.validate()) return;

  try {
    state.isLoading = true;

    await axios.patch(
      `${API_URL}/users/me`, 
      {
        password: passwordData.value.newPassword,
        current_password: passwordData.value.currentPassword,
      },
      {
        headers: { 'Authorization': `Bearer ${state.authToken}` }
      }
    );

    showNotification('Password changed successfully', 'success');
    closePasswordDialog();
  } catch (error) {
    console.error('Password change error:', error);
    showNotification(
      error.response?.data?.message || 'Failed to change password',
      'error'
    );
  } finally {
    state.isLoading = false;
  }
};

// Form Data and Validation
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  title: '',
  department: '',
  bio: '',
  avatar: null
});

const originalFormData = ref({});
const avatarInput = ref(null);
const userAvatar = ref(null);

// Refs for UI State
const isPersonalInfoValid = ref(true);
const notificationMessage = ref('');
const notificationColor = ref('success');

// Validation Rules
const rules = {
  required: (v) => !!v || 'This field is required',
  email: (v) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || 'Invalid email format';
  },
  maxLength: (max) => (v) => 
    !v || v.length <= max || `Cannot exceed ${max} characters`,
  phoneFormat: (v) => {
    const pattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return !v || pattern.test(v) || 'Invalid phone number';
  },
  password: (v) => {
    const checks = passwordRequirements.every(req => req.regex.test(v));
    return checks || 'Password must meet all requirements';
  },
};

// Computed Properties
const userInitials = computed(() => 
  `${formData.value.first_name?.[0] || ''}${formData.value.last_name?.[0] || ''}`
);

const verificationBadge = computed(() => 
  formData.value.title ? 'mdi-check-decagram' : 'mdi-alert-circle'
);

// Methods
const toggleDarkMode = () => {
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('dark-mode', state.isDarkMode.toString());
  document.body.classList.toggle('dark-mode', state.isDarkMode);
};

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size and type
  if (file.size > MAX_AVATAR_SIZE) {
    showNotification('Avatar must be less than 5MB', 'error');
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    showNotification('Invalid file type. Use JPEG, PNG, or GIF', 'error');
    return;
  }

  const formUpload = new FormData();
  formUpload.append('file', file);

  try {
    state.isLoading = true;
    const uploadResponse = await axios.post(`${API_URL}/files`, formUpload, {
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const fileId = uploadResponse.data.data.id;
    
    // Update user avatar
    await updateUserProfile({ avatar: fileId });
    
    userAvatar.value = `${API_URL}/assets/${fileId}`;
    showNotification('Avatar updated successfully', 'success');
  } catch (error) {
    console.error('Avatar upload error:', error);
    showNotification('Failed to upload avatar', 'error');
  } finally {
    state.isLoading = false;
  }
};

const fetchUserProfile = async () => {
  try {
    state.isLoading = true;
    const response = await axios.get(`${API_URL}/users/me?fields=*`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });

    const userData = response.data.data;
    formData.value = {
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      title: userData.title || '',
      department: userData.department || '',
      bio: userData.bio || '',
      avatar: userData.avatar || null
    };

    // Store original data for comparison
    originalFormData.value = { ...formData.value };

    // Set avatar if exists
    if (userData.avatar) {
      userAvatar.value = `${API_URL}/assets/${userData.avatar}`;
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    showNotification('Failed to load profile', 'error');
  } finally {
    state.isLoading = false;
  }
};

const updateUserProfile = async (updateData) => {
  try {
    state.isLoading = true;
    await axios.patch(`${API_URL}/users/me`, updateData, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });

    // Merge updated data
    formData.value = { ...formData.value, ...updateData };
    originalFormData.value = { ...formData.value };

    showNotification('Profile updated successfully', 'success');
  } catch (error) {
    console.error('Profile update error:', error);
    showNotification('Failed to update profile', 'error');
  } finally {
    state.isLoading = false;
  }
};

const saveAllChanges = async () => {
  // Validate form before submission
  if (!isPersonalInfoValid.value) {
    showNotification('Please correct form errors', 'error');
    return;
  }

  // Detect changes
  const changedFields = {};
  Object.keys(formData.value).forEach(key => {
    if (JSON.stringify(formData.value[key]) !== JSON.stringify(originalFormData.value[key])) {
      changedFields[key] = formData.value[key];
    }
  });

  if (Object.keys(changedFields).length === 0) {
    showNotification('No changes to save', 'info');
    return;
  }

  await updateUserProfile(changedFields);
};

const showNotification = (message, type = 'success') => {
  notificationMessage.value = message;
  notificationColor.value = type;
  state.showNotification = true;
};

const resetForm = () => {
  formData.value = { ...originalFormData.value };
  state.activeTab = 'personal';
};

// Lifecycle Hooks
onMounted(() => {
  fetchUserProfile();
  
  // Apply initial dark mode
  document.body.classList.toggle('dark-mode', state.isDarkMode);
});

// Expose methods and state for potential external use
defineExpose({
  fetchUserProfile,
  updateUserProfile,
  resetForm,
  formData,
  state
});
</script>
  
<style lang="scss">
.v-list-item {
  min-height: 32px !important;
}

.password-requirements {
  .v-icon {
    transition: all 0.3s ease;
  }
}
.back-home-btn {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-5px);
  }

  &.dark-mode {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--dark-text-primary);
  }

  @media (max-width: 600px) {
    width: 100%;
    margin-bottom: 1rem;
  }
}
// Color Variables
:root {
  // Existing variables
  --primary-color: #6a11cb;
  --secondary-color: #2575fc;
  
  // Add RGB versions
  --primary-color-rgb: 106, 17, 203;     // RGB of #6a11cb
  --secondary-color-rgb: 37, 117, 252;   // RGB of #2575fc

  // Dark mode colors
  --dark-background: #121212;
  --dark-surface: #1e1e1e;
  --dark-text-primary: #e0e0e0;
  --dark-text-secondary: #b0b0b0;
}

// Global Styles
.profile-container {
  // Responsive Typography
  font-family: 'Inter', 'Roboto', sans-serif;
  transition: all 0.3s ease;
  
  // Background Gradient
  background: linear-gradient(
    135deg, 
    var(--background-light) 0%, 
    #e9ecef 100%
  );
  min-height: 100vh;
  padding: 2rem;

  @media (max-width: 600px) {
    padding: 0.5rem;
  }
}

// Profile Card Styling
.profile-card {
  // Advanced Card Design
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 15px 35px rgba(50, 50, 93, 0.1), 
    0 5px 15px rgba(0, 0, 0, 0.07);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  // Hover Effect
  &:hover {
    transform: translateY(-10px);
    box-shadow: 
      0 20px 40px rgba(50, 50, 93, 0.15), 
      0 8px 20px rgba(0, 0, 0, 0.1);
  }
}

// Profile Header Styling
.profile-header {
  // Gradient Background
  background: linear-gradient(
    135deg, 
    var(--primary-color) 0%, 
    var(--secondary-color) 100%
  );
  color: white;
  position: relative;
  padding: 2rem;

  // Header Overlay Effect
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

// Avatar Styling
.avatar-wrapper {
  position: relative;
  
  .professional-avatar {
    border: 4px solid white;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
  }

  .avatar-upload-btn {
    position: absolute;
    bottom: -10px;
    right: -10px;
    background-color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      background-color: var(--primary-color);
      color: white;
    }
  }
}

// Dark Mode Styles
.dark-mode {
  background-color: var(--dark-background);
  color: var(--dark-text-primary);

  .profile-card {
    background-color: var(--dark-surface);
    color: var(--dark-text-primary);
  }

  .profile-header {
    background: linear-gradient(
  135deg, 
  rgba(var(--primary-color-rgb), 0.9) 0%, 
  rgba(var(--secondary-color-rgb), 0.9) 100%
);
  }

  // Form Elements in Dark Mode
  .v-text-field,
  .v-textarea {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--dark-text-primary);
  }
}

// Responsive Typography
.text-h4 {
  @media (max-width: 600px) {
    font-size: 1.5rem !important;
  }
}

// Tab Styling
.profile-tabs {
  background-color: rgba(255, 255, 255, 0.1);
  
  .v-tab {
    transition: all 0.3s ease;
    
    &--selected {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
}

// Loading Overlay
.v-overlay {
  .v-progress-circular {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    padding: 1rem;
  }
}

// Notification Styling
.v-snackbar {
  &__content {
    background-color: var(--primary-color);
    color: white;
    border-radius: 8px;
  }
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

// Additional Utility Classes
.animate-fade-in {
  animation: fadeIn 0.5s ease;
}

.animate-slide-up {
  animation: slideUp 0.5s ease;
}

// Responsive Adjustments
@media (max-width: 960px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-card {
    border-radius: 0;
  }
}

// Print Styles
@media print {
  .profile-container {
    background: white;
  }

  .profile-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
}
</style>