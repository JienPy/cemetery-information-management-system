<template>
    <v-avatar @click="showProfileDialog = true" size="40" class="mx-4">
      <img :src="userAvatar" alt="User  Avatar" class="avatar-image" />
    </v-avatar>

    
    <!-- Profile dialog -->
    <v-dialog v-model="showProfileDialog" max-width="400" class="custom-dialog">
      <v-card class="blur-background">
        <v-card-title>
          {{ userProfile.first_name }} {{ userProfile.last_name }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <v-avatar size="80">
                <img :src="userAvatar" alt="User  Avatar" class="avatar-image" />
              </v-avatar>
            </v-col>
            <v-col cols="8">
              <p>Email: {{ userProfile.email }}</p>
              <p>Role: {{ userProfile.role }}</p>
            </v-col>
          </v-row>
 </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showProfileDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
const userAvatar = ref('');
const userProfile = ref({});
const showProfileDialog = ref(false);

onMounted(async () => {
  if (!authToken.value) {
    console.log('No authentication token found. Redirecting to login page...');
    router.push('/login');
  } else {
    await fetchUserAvatar();
  }
});

const fetchUserAvatar = async () => {
  try {
    const response = await axios.get(`${apiUrl}/users/me?fields=avatar,first_name,last_name,email,title`, {
      headers: { Authorization: `Bearer ${authToken.value}` },
    });

    if (response.data.data.avatar) {
      userAvatar.value = `${apiUrl}/assets/${response.data.data.avatar}`;
    }

    userProfile.value = {
      first_name: response.data.data.first_name,
      last_name: response.data.data.last_name,
      email: response.data.data.email,
      role: response.data.data.title,
    };

  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};
</script>

<style scope>

.blur-background {
  backdrop-filter: blur(5px); /* Blurs the background when the dialog is open */

  border-radius: 12px; /* Rounded corners */
  box-shadow: 0 4px  12px rgba(0, 0, 0, 0.1); /* Add depth with shadows */
  padding: 24px; /* Increase padding for better readability */
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}


.custom-dialog {
  backdrop-filter: blur(5px); /* Blurs the background when the dialog is open */
}
</style>
