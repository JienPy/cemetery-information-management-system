// src/axios.js
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const instance = axios.create({
  baseURL: 'http://localhost:8055/users/me', // Replace with your API URL
});

// Add a response interceptor
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Redirect to login page if unauthorized
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default instance;
