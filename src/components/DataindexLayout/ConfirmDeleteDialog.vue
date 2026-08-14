<template>
    <v-dialog :model-value="dialog" @update:model-value="updateDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this item?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-grey" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="red" text @click="$emit('confirm')">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    dialog: Boolean,
  });
  
  const emit = defineEmits();
  
  // Emit the updated dialog state to the parent
  const updateDialog = (value) => {
    emit('update:dialog', value);
  };
  
  const closeDialog = () => {
    updateDialog(false);
  };
  </script>
  
  <style scoped>
  /* Add styles if needed */
  </style>