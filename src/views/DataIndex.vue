<template>
    <v-app>
      <AppBar />
      
          <!-- Main Content Area -->
           
          <v-main>
            <DataList />
   

          </v-main>
          
    </v-app>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  import AppBar from '../components/AppBar.vue';
  import DataList from '../components/DataindexLayout/DataList.vue';


  
  </script>
  
  
  <style scoped>

  </style>