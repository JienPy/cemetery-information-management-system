<template>
    <v-btn icon @click="searchIconClicked = !searchIconClicked">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
    <v-slide-x-transition>
      <v-text-field
        v-if="searchIconClicked"
        solo-inverted
        flat
        hide-details
        label="Search"
        class="mx-4"
        v-model="searchQuery"
        @input="performSearch"
      />
    </v-slide-x-transition>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
import axios from 'axios';
const apiUrl = 'http://localhost:8055';
const router = useRouter();
const authToken = ref(localStorage.getItem('auth-token'));
  const searchIconClicked = ref(false);
  const searchQuery = ref('');
  
  const performSearch = async () => {
  if (!searchQuery.value) return;

  try {
    const response = await axios.get(`${apiUrl}/search`, {
      params: { query: searchQuery.value },
      headers: { Authorization: `Bearer ${authToken.value}` },
    });

    // Assuming the response contains a list of results
    // You can store these results in a ref or emit an event to update other components
    searchResults.value = response.data.results; // Adjust according to your API response
  } catch (error) {
    console.error('Error performing search:', error);
  }
};

  </script>

  <style scope>
.v-slide-x-transition {
  transition: transform 0.3s ease-in-out;
}

.v-slide-x-transition-enter-from,
.v-slide-x-transition-leave-to {
  transform: translateX(-100%);
}

.v-slide-x-transition-enter-to,
.v-slide-x-transition-leave-from {
  transform: translateX(0);
}
</style>