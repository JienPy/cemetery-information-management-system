<template>
  <v-app>
    <v-main class="login-wrapper">
      <div class="left-panel">
        <div class="overlay"></div>
        <div class="content-wrapper">
          <div class="brand-section">
            <img src="/OCP_logo.png" alt="OCP Logo" class="company-logo" />
            <h1 class="brand-name">Cemetery Management System</h1>
            <p class="brand-copy">Manage records, plots, and renewals from one local admin console.</p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="right-panel">
        <v-container class="form-container">
          <v-card class="login-card" elevation="0">
            <div class="login-header">
              <h2 class="welcome-text">Sign in</h2>
              <p class="subtitle-text">Use your cemetery officer account to continue.</p>
            </div>

            <v-form @submit.prevent="login" class="login-form" ref="form">
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

                <!-- Email Field -->
                <div key="email" class="input-wrapper">
                  <label class="input-label">Email Address</label>
                  <v-text-field
                    v-model="email"
                    :rules="emailRules"
                    placeholder="Enter your email"
                    variant="outlined"
                    bg-color="white"
                    class="custom-input"
                    prepend-inner-icon="mdi-email-outline"
                    :disabled="isLoading"
                  />
                </div>

                <!-- Password Field -->
                <div key="password" class="input-wrapper">
                  <label class="input-label">Password</label>
                  <v-text-field
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="passwordRules"
                    placeholder="Enter your password"
                    variant="outlined"
                    bg-color="white"
                    class="custom-input"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                    @click:append-inner="showPassword = !showPassword"
                    :disabled="isLoading"
                  />
                </div>

                <!-- Remember & Forgot Password -->
                <div key="options" class="options-row">
                  <v-checkbox
                    v-model="rememberMe"
                    label="Remember me"
                    color="primary"
                    hide-details
                    class="remember-checkbox"
                  />
                  <a @click="router.push('/request-new-password')" class="forgot-link">
                    Forgot password?
                  </a>
                </div>

                <!-- Login Button -->
                <div key="button" class="button-wrapper">
                  <v-btn
                    type="submit"
                    :loading="isLoading"
                    block
                    class="login-btn"
                    min-height="48"
                  >
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                  </v-btn>
                </div>
              </transition-group>
            </v-form>

            <div class="security-notice">
              <v-icon size="20" color="grey-darken-1" class="mr-2">
                mdi-database-outline
              </v-icon>
              <span>Local Prisma SQLite API: localhost:8055</span>
            </div>
          </v-card>
        </v-container>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const apiUrl = 'http://localhost:8055';
const authEndpoint = `${apiUrl}/auth/login`;
const router = useRouter();

// Form data
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const form = ref(null);

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Please enter a valid email'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

// Login handler
const login = async () => {
  const result = await form.value.validate();
  if (!result.valid) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await axios.post(authEndpoint, {
      email: email.value,
      password: password.value,
    });

    if (rememberMe.value) {
      localStorage.setItem('remember-email', email.value);
    }


    const token = response.data.data.access_token;
    localStorage.setItem('auth-token', token);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.response?.status === 401
      ? 'Invalid email or password'
      : 'An error occurred. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  const rememberedEmail = localStorage.getItem('remember-email');
  if (rememberedEmail) {
    email.value = rememberedEmail;
    rememberMe.value = true;
  }
});
</script>

<style scoped>
.login-wrapper {
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(420px, 1fr);
  min-height: 100vh;
  background: #f4f6f8;
}

.left-panel {
  position: relative;
  background-image: url("/cemetery-bg-2.png");
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 40px;
  min-width: 0;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(22, 32, 42, 0.2), rgba(22, 32, 42, 0.72));
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  color: white;
}

.brand-section {
  text-align: left;
}

.company-logo {
  width: 72px;
  height: auto;
  margin-bottom: 16px;
}

.brand-name {
  font-size: 2rem;
  font-weight: 650;
  margin: 0;
  line-height: 1.2;
  max-width: 360px;
}

.brand-copy {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.98rem;
  line-height: 1.5;
}

.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background-color: white;
  min-width: 0;
}

.form-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: #ffffff;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 32px;
}

.login-header {
  text-align: left;
  margin-bottom: 28px;
}

.welcome-text {
  font-size: 1.65rem;
  font-weight: 650;
  color: #17202a;
  margin: 0;
  line-height: 1.2;
}

.subtitle-text {
  color: #667085;
  margin-top: 8px;
  font-size: 0.95rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #344054;
  font-size: 0.9rem;
}

.custom-input {
  border-radius: 8px;
}

.custom-input :deep(.v-field) {
  border-radius: 8px !important;
  background-color: #ffffff !important;
  box-shadow: none !important;
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -8px 0;
}

.remember-checkbox {
  font-size: 0.95rem;
}

.forgot-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.button-wrapper {
  margin-top: 8px;
}

.login-btn {
  background: #1f2937 !important;
  color: white !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: background 0.2s !important;
}

.login-btn:hover {
  background: #111827 !important;
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 24px;
  color: #667085;
  font-size: 0.85rem;
}

.error-alert {
  border-radius: 8px;
}

.fade-stagger-enter-active, .fade-stagger-leave-active {
  transition: opacity 0.18s;
}

.fade-stagger-enter-from, .fade-stagger-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .left-panel {
    padding: 32px;
  }
  
  .right-panel {
    padding: 32px;
  }
}

@media (max-width: 960px) {
  .login-wrapper {
    grid-template-columns: 1fr;
  }
  
  .left-panel {
    min-height: 240px;
    min-width: unset;
  }
  
  .right-panel {
    min-width: unset;
  }
  
  .form-container {
    padding: 0;
  }
}

@media (max-width: 600px) {
  .right-panel {
    padding: 24px 16px;
  }

  .login-card {
    border: 0;
    padding: 24px 0;
  }
}
</style>
