<!-- Notification.vue -->
<template>
    <v-dialog
      v-model="dialog"
      max-width="300"
      :position-x="positionX"
      :position-y="positionY"
      absolute
    >
      <v-card>
        <v-card-title>Notifications</v-card-title>
        <v-list>
          <v-list-item
            v-for="(notification, index) in notifications"
            :key="index"
            @click="markAsRead(notification)"
          >
            <v-list-item-content>
              <v-list-item-title
                :class="{ 'text-primary': notification.unread }"
              >
                {{ notification.title }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </template>
  
  <script>
  export default {
    props: {
      notifications: {
        type: Array,
        required: true
      },
      positionX: {
        type: String,
        default: 'right'
      },
      positionY: {
        type: String,
        default: 'bottom'
      }
    },
    data() {
      return {
        dialog: false
      }
    },
    methods: {
      markAsRead(notification) {
        notification.unread = false;
        this.$emit('update:notifications', this.notifications.filter((n) => n.unread));
      }
    }
  }
  </script>