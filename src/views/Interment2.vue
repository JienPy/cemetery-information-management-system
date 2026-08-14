<template>
    <v-app>
      <!-- App Bar (Top Navigation) -->
      <AppBar />
  
      <!-- Navigation Drawer (Left Side) -->
      <NavigationDrawer />
  
      <v-main  class="mainStyle">
        <v-container fluid>
          <v-row>
            <v-col > <!-- Add a column for the DeceaseForm -->
                <!-- <DeceaseForm2 class="mt-0"/> -->
                 <DataList2 />
            </v-col>
              
          </v-row>
        </v-container>
      </v-main>
      
    </v-app>
  </template>
  
  <script setup>
  
  import AppBar from '../components/AppBar.vue';
  import NavigationDrawer from '../components/NavigationDrawer.vue';
  import DeceaseForm2 from '@/components/IntermentView/DeceaseForm2.vue'; // corrected import
  import DataList2 from '@/components/DataindexLayout/DataList2.vue';
  
  </script>
  
  <style scoped>
  .mainStyle {
    background-color: #90A4AE;
  }
  </style>