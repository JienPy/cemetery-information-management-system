<template>
  <v-app>
    <v-main class="password-request-wrapper">
      <!-- Left Panel - Informative Side -->
      <div class="left-panel">
        <div class="overlay"></div>
        <div class="content-wrapper">
          <div class="brand-section">
            <img src="/OCP_logo.png" alt="OCP Logo" class="company-logo" />
            <h1 class="brand-name">Password Recovery</h1>
          </div>
          
          <div class="info-cards">
            <div class="info-card" v-for="(step, index) in recoverySteps" :key="index">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Request Form -->
      <div class="right-panel">
        <v-container class="form-container">
          <div class="back-button" @click="router.go(-1)">
            <v-icon>mdi-arrow-left</v-icon>
            <span>Back to Login</span>
          </div>

          <v-card class="request-card" elevation="0">
            <div class="request-header">
              <h2 class="title-text">Reset Your Password</h2>
              <p class="subtitle-text">Enter your details below to request a new password</p>
            </div>

            <v-form @submit.prevent="requestNewPassword" class="request-form" ref="form">
              <transition-group name="fade-stagger" tag="div" class="input-group">
                <!-- Error Alert -->
                <v-alert
                  v-if="errorMessage"
                  key="error"
                  type="error"
                  variant="tonal"
                  class="mb-4 error-alert"
                  closable
                >
                  {{ errorMessage }}
                </v-alert>

                <!-- Success Alert -->
                <v-alert
                  v-if="successMessage"
                  key="success"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ successMessage }}
                </v-alert>

                <!-- Email Field -->
                <div key="email" class="input-wrapper">
                  <label class="input-label">Email Address</label>
                  <v-text-field
                    v-model="email"
                    :rules="emailRules"
                    placeholder="Enter your registered email"
                    variant="outlined"
                    bg-color="white"
                    class="custom-input"
                    prepend-inner-icon="mdi-email-outline"
                    :disabled="isLoading"
                  />
                </div>

                <!-- Message Field -->
                <div key="message" class="input-wrapper">
                  <label class="input-label">Reason for Request</label>
                  <v-textarea
                    v-model="message"
                    :rules="messageRules"
                    placeholder="Please explain why you need a password reset"
                    variant="outlined"
                    bg-color="white"
                    class="custom-input"
                    rows="4"
                    prepend-inner-icon="mdi-text-box-outline"
                    :disabled="isLoading"
                  />
                </div>

                <!-- Submit Button -->
                <div key="button" class="button-wrapper">
                  <v-btn
                    type="submit"
                    :loading="isLoading"
                    block
                    class="submit-btn"
                    min-height="48"
                  >
                    {{ isLoading ? 'Submitting Request...' : 'Submit Request' }}
                  </v-btn>
                </div>
              </transition-group>
            </v-form>

            <!-- Security Notice -->
            <div class="security-notice">
              <v-icon size="20" color="grey-darken-1" class="mr-2">
                mdi-shield-check-outline
              </v-icon>
              <span>Your request will be processed securely</span>
            </div>
          </v-card>
        </v-container>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const requestNewPasswordEndpoint = `${apiUrl}/items/admin_messages`;
const router = useRouter();

// Form data
const email = ref('');
const message = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const form = ref(null);

// Recovery steps data
const recoverySteps = [
  {
    title: 'Submit Request',
    description: 'Enter your registered email and explain your situation'
  },
  {
    title: 'Verification',
    description: 'Admin will verify your identity and process your request'
  },
  {
    title: 'Reset Link',
    description: 'You will receive password reset instructions via email'
  }
];

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Please enter a valid email'
];

const messageRules = [
  v => !!v || 'Message is required',
  v => v.length >= 20 || 'Please provide more details (minimum 20 characters)'
];

// Submit handler
async function requestNewPassword() {
  // Validate the form before proceeding
  if (!form.value.validate()) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await axios.post(requestNewPasswordEndpoint, {
      email: email.value,
      message: message.value,
    });

    // Set success message after successful submission
    successMessage.value = 'Your request has been submitted successfully. Please check your email for further instructions.';
    
    // Reset form after successful submission
    setTimeout(() => {
      email.value = '';
      message.value = '';
      form.value.reset();
    }, 3000);
    
    // Redirect after a delay
    setTimeout(() => {
      router.push('/login');
    }, 5000);
  } catch (error) {
    // Handle errors from the request
    errorMessage.value = error?.response?.data?.error?.message || 
      'An error occurred while submitting your request. Please try again.';
  } finally {
    // Ensure loading state is reset
    isLoading.value = false;
  }
}
</script>

<style scoped>
.password-request-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.left-panel {
  flex: 1;
  position: relative;
  background-image: url("/cemetery-bg-2.png");
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-width: 500px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%);
  backdrop-filter: blur(4px);
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
  color: white;
}

.brand-section {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInUp 0.8s ease-out;
}

.company-logo {
  width: 120px;
  height: auto;
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 48px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: rgba(255,255,255,0.1);
  padding: 24px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  animation: fadeInUp 0.8s ease-out backwards;
}

.info-card:nth-child(1) { animation-delay: 0.2s; }
.info-card:nth-child(2) { animation-delay: 0.4s; }
.info-card:nth-child(3) { animation-delay: 0.6s; }

.step-number {
  background: rgba(255,255,255,0.2);
  width: 40px;
  height: 40px;
  border-radius: 50%;
 display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
}

.step-content p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.right-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background-color: white;
  min-width: 500px;
  position: relative;
}

.back-button {
  position: absolute;
  top: 32px;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
}

.back-button:hover {
  color: #1976D2;
}

.form-container {
  width: 100%;
  max-width: 460px;
}

.request-card {
  background: transparent;
  width: 100%;
}

.request-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s ease-out;
}

.title-text {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.subtitle-text {
  color: #666;
  margin-top: 8px;
  font-size: 1.1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-wrapper {
  animation: fadeInUp 0.6s ease-out backwards;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1a1a1a;
}

.custom-input {
  border-radius: 12px;
}

.custom-input :deep(.v-field) {
  border-radius: 12px !important;
  background-color: #f8f9fa !important;
}

.button-wrapper {
  margin-top: 8px;
}

.submit-btn {
  background: linear-gradient(135deg, #1976D2, #2196F3) !important;
  color: white !important;
  font-size: 1.1rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(33,150,243,0.3) !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(33,150,243,0.4) !important;
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  color: #666;
  font-size: 0.9rem;
}

.error-alert {
  border-radius: 12px;
  animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

.fade-stagger-enter-active, .fade-stagger-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-stagger-enter-from, .fade-stagger-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .left-panel {
    padding: 32px;
  }
  
  .right-panel {
    padding: 32px;
  }
}

@media (max-width: 960px) {
  .password-request-wrapper {
    flex-direction: column;
  }
  
  .left-panel {
    min-height: 400px;
    min-width: unset;
  }
  
  .right-panel {
    min-width: unset;
  }
  
  .form-container {
    padding: 24px;
  }
  
  .back-button {
    top: 16px;
    left: 16px;
  }
}
</style>
