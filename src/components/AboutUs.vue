<template>
  <v-card class="about-us-card">
    <v-card-title class="text-h5 bg-primary text-white py-4 d-flex align-center">
      <v-icon left color="white" class="mr-3">mdi-information-outline</v-icon>
      About Our Application
    </v-card-title>

    <v-card-text class="pa-6">
      <div class="about-content">
        <div class="mission-section mb-6">
          <div class="mission-icons">
            <div class="mission-icon-wrapper">
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div 
                    v-bind="props" 
                    class="icon-container"
                  >
                    <v-icon size="x-large" color="primary">mdi-target</v-icon>
                    <span class="mission-label">Mission</span>
                  </div>
                </template>
                <span>Our Mission</span>
              </v-tooltip>

              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div 
                    v-bind="props" 
                    class="icon-container"
                  >
                    <v-icon size="x-large" color="success">mdi-eye</v-icon>
                    <span class="mission-label">Vision</span>
                  </div>
                </template>
                <span>Our Vision</span>
              </v-tooltip>

              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div 
                    v-bind="props" 
                    class="icon-container"
                  >
                    <v-icon size="x-large" color="error">mdi-heart</v-icon>
                    <span class="mission-label">Values</span>
                  </div>
                </template>
                <span>Our Values</span>
              </v-tooltip>
            </div>
          </div>
        </div>

        <div class="content-section">
          <v-progress-circular 
            v-if="loading" 
            indeterminate 
            color="primary"
          ></v-progress-circular>

          <p 
            v-else-if="error" 
            class="text-center text-error"
          >
            {{ error }}
          </p>

          <div 
            v-else 
            v-html="aboutUsText" 
            class="about-text"
          ></div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn 
        color="primary" 
        variant="outlined" 
        @click="$emit('close')"
      >
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Configuration
const apiUrl = 'http://localhost:8055';
const aboutUsEndpoint = `${apiUrl}/items/about_us`;

// Reactive state
const aboutUsText = ref('');
const loading = ref(true);
const error = ref(null);

// Fetch About Us content
const fetchAboutUsContent = async () => {
  try {
    const response = await axios.get(aboutUsEndpoint);
    const data = response.data.data;
    
    // Assuming the first item contains the text
    aboutUsText.value = data[0]?.au_text || 'No content available';
    loading.value = false;
  } catch (err) {
    console.error('Error fetching About Us content:', err);
    error.value = 'Failed to load content. Please try again later.';
    loading.value = false;
  }
};

// Fetch content when component is mounted
onMounted(fetchAboutUsContent);

// Emit close event
defineEmits(['close']);
</script>

<style scoped>
.about-us-card {
  border-radius: 12px;
  overflow: hidden;
}

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mission-section {
  width: 100%;
}

.mission-icons {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.mission-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.icon-container:hover {
  transform: scale(1.1);
}

.mission-label {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.content-section {
  margin-top: 1.5rem;
  text-align: center;
  max-width: 800px;
}

.about-text {
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
  text-align: left;
}
</style>