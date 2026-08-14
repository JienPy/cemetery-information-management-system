<template>
    <v-dialog :model-value="dialog" @update:model-value="updateDialog" max-width="500px">
      <v-card>
        <v-card-title class="dialog-title">
          <span class="text-h5">{{ title }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col v-for="(value, key) in item" :key="key" cols="12" sm="6" md="4">
                <v-text-field 
                  v-model="item[key]" 
                  :label="formatLabel(key)" 
                  :type="getInputType(key)"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="$emit('save')">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { defineProps, toRefs } from 'vue';
  
  const props = defineProps({
    dialog: Boolean,
    item: Object,
    title: String,
  });
  
  const { dialog } = toRefs(props);
  
  // Emit the updated dialog state to the parent
  const updateDialog = (value) => {
    emit('update:dialog', value);
  };
  
  const closeDialog = () => {
    updateDialog(false);
  };
  
  const formatLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };
  
  const getInputType = (key) => {
    if (key.includes('date')) return 'date';
    if (key === 'age' || key === 'amount' || key === 'or_number' || key === 'year_covered') return 'number';
    return 'text';
  };
  </script>
  
  <style scoped>
  .dialog-title {
    background-color: #f7f7f7;
    color: #333;
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }
  </style>