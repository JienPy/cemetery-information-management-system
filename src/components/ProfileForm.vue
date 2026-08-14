<template>
  <div>
    <!-- Profile Button Trigger -->
    <v-btn
      v-if="userProfile"
      variant="text"
      class="profile-btn"
      @click="openProfileDialog"
    >
      <v-avatar size="42" class="user-avatar mr-3">
        <v-img 
          v-if="userAvatar" 
          :src="userAvatar"
          :alt="userProfile.first_name"
        >
          <template v-slot:placeholder>
            <span class="text-subtitle-2">{{ getUserInitials }}</span>
          </template>
        </v-img>
        <span v-else class="text-subtitle-2">{{ getUserInitials }}</span>
      </v-avatar>
      <div class="user-info">
        <p class="text-subtitle-2 mb-0 font-weight-medium">
          {{ `${userProfile.first_name} ${userProfile.last_name}` }}
        </p>
        <span class="text-caption text-medium-emphasis">
          {{ userProfile.role }}
        </span>
      </div>
    </v-btn>

    <!-- Profile Dialog -->
    <v-dialog v-model="dialogOpen" max-width="600">
      <v-card class="profile-dialog">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h6">Edit Profile</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogOpen = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
            <!-- Avatar Upload -->
            <div class="avatar-upload mb-6 d-flex flex-column align-center">
              <v-avatar size="120" class="mb-3">
                <v-img v-if="previewAvatar || userAvatar" 
                  :src="previewAvatar || userAvatar"
                  :alt="formData.first_name"
                >
                  <template v-slot:placeholder>
                    <span class="text-h4">{{ getUserInitials }}</span>
                  </template>
                </v-img>
                <span v-else class="text-h4">{{ getUserInitials }}</span>
              </v-avatar>
              <v-file-input
                v-model="avatarFile"
                accept="image/*"
                hide-details
                class="avatar-input"
                density="compact"
                variant="outlined"
                label="Change Avatar"
                prepend-icon=""
                @update:model-value="handleAvatarChange"
              ></v-file-input>
            </div>

            <!-- Personal Information -->
            <div class="personal-info">
              <div class="d-flex gap-4">
                <v-text-field
                  v-model="formData.first_name"
                  label="First Name"
                  :rules="[v => !!v || 'First name is required']"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="formData.last_name"
                  label="Last Name"
                  :rules="[v => !!v || 'Last name is required']"
                  required
                ></v-text-field>
              </div>

              <v-text-field
                v-model="formData.email"
                label="Email"
                type="email"
                :rules="[
                  v => !!v || 'Email is required',
                  v => /.+@.+\..+/.test(v) || 'Email must be valid'
                ]"
                required
              ></v-text-field>

              <v-text-field
                v-model="formData.title"
                label="Title"
                placeholder="Your role or position"
              ></v-text-field>

              <v-text-field
                v-model="formData.location"
                label="Location"
                placeholder="City, Country"
              ></v-text-field>

              <v-textarea
                v-model="formData.description"
                label="About"
                placeholder="Tell us about yourself"
                rows="3"
              ></v-textarea>

              <v-combobox
                v-model="formData.tags"
                label="Tags"
                multiple
                chips
                closable-chips
                placeholder="Add tags"
              ></v-combobox>

              <!-- Password Change Section -->
              <v-expansion-panels variant="accordion" class="mt-4">
                <v-expansion-panel>
                  <v-expansion-panel-title>Change Password</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-text-field
                      v-model="formData.current_password"
                      label="Current Password"
                      type="password"
                      :rules="currentPasswordRules"
                    ></v-text-field>

                    <v-text-field
                      v-model="formData.new_password"
                      label="New Password"
                      type="password"
                      :rules="newPasswordRules"
                    ></v-text-field>

                    <v-text-field
                      v-model="formData.confirm_password"
                      label="Confirm New Password"
                      type="password"
                      :rules="confirmPasswordRules"
                    ></v-text-field>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="isLoading"
            :disabled="!isFormValid"
            @click="handleSubmit"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  userProfile: {
    type: Object,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  authToken: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['profile-updated']);

// Form and dialog state
const dialogOpen = ref(false);
const isFormValid = ref(false);
const isLoading = ref(false);
const form = ref(null);
const avatarFile = ref(null);
const previewAvatar = ref(null);

// Snackbar state
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

// Form data
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  title: '',
  location: '',
  description: '',
  tags: [],
  current_password: '',
  new_password: '',
  confirm_password: ''
});

// Password validation rules
const currentPasswordRules = [
  v => !formData.value.new_password || !!v || 'Current password is required to change password'
];

const newPasswordRules = [
  v => !v || v.length >= 8 || 'Password must be at least 8 characters',
  v => !v || /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  v => !v || /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
  v => !v || /[0-9]/.test(v) || 'Password must contain at least one number'
];

const confirmPasswordRules = [
  v => !formData.value.new_password || v === formData.value.new_password || 'Passwords must match'
];

// Computed
const getUserInitials = computed(() => {
  return `${formData.value.first_name?.[0] || ''}${formData.value.last_name?.[0] || ''}`;
});

// Methods
const openProfileDialog = () => {
  // Initialize form data with current user profile
  formData.value = {
    first_name: props.userProfile.first_name || '',
    last_name: props.userProfile.last_name || '',
    email: props.userProfile.email || '',
    title: props.userProfile.title || '',
    location: props.userProfile.location || '',
    description: props.userProfile.description || '',
    tags: props.userProfile.tags || [],
    current_password: '',
    new_password: '',
    confirm_password: ''
  };
  dialogOpen.value = true;
};

const handleAvatarChange = (file) => {
  if (file) {
    previewAvatar.value = URL.createObjectURL(file);
  } else {
    previewAvatar.value = null;
  }
};

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

const handleSubmit = async () => {
  if (!form.value.validate()) return;

  isLoading.value = true;
  try {
    const formDataToSend = new FormData();

    // Append avatar if changed
    if (avatarFile.value) {
      formDataToSend.append('avatar', avatarFile.value);
    }

    // Append user data
    const userData = {
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      email: formData.value.email,
      title: formData.value.title,
      location: formData.value.location,
      description: formData.value.description,
      tags: formData.value.tags
    };

    // Add password update if provided
    if (formData.value.new_password) {
      userData.password = formData.value.new_password;
      userData.current_password = formData.value.current_password;
    }

    formDataToSend.append('data', JSON.stringify(userData));

    // Send update to Directus
    const response = await axios.patch(
      'http://localhost:8055/users/me',
      formDataToSend,
      {
        headers: {
          'Authorization': `Bearer ${props.authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Emit updated profile
    emit('profile-updated', response.data.data);
    
    showMessage('Profile updated successfully');
    dialogOpen.value = false;
  } catch (error) {
    console.error('Error updating profile:', error);
    showMessage(
      error.response?.data?.errors?.[0]?.message || 'Error updating profile',
      'error'
    );
  } finally {
    isLoading.value = false;
  }
};

// Cleanup
watch(dialogOpen, (newValue) => {
  if (!newValue) {
    // Reset form when dialog closes
    formData.value.current_password = '';
    formData.value.new_password = '';
    formData.value.confirm_password = '';
    avatarFile.value = null;
    previewAvatar.value = null;
  }
});
</script>

<style scoped>
.profile-dialog {
  border-radius: 16px;
}

.avatar-upload {
  position: relative;
}

.avatar-input {
  max-width: 200px;
}

.profile-btn {
  width: 100%;
  justify-content: flex-start;
  height: auto;
  padding: 12px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.profile-btn:hover {
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

.user-info {
  text-align: left;
}
</style>