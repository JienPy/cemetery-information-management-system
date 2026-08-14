<template>
  <div>
    <v-menu v-model="notificationsMenu" offset-y :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon class="notification-bell">
          <v-icon size="24">mdi-bell</v-icon>
          <v-badge
            v-if="unreadCount > 0"
            :content="unreadCount.toString()"
            color="error"
            floating
            class="notification-badge"
          ></v-badge>
        </v-btn>
      </template>

      <v-card class="notification-menu" elevation="8">
        <v-card-title class="notification-header">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon color="white" class="mr-2">mdi-bell-outline</v-icon>
              <span class="notification-title">Notifications</span>
            </div>
            <v-chip
              v-if="notifications.length"
              color="white"
              text-color="primary"
              size="small"
              class="ml-2"
            >
              {{ notifications.length }}
            </v-chip>
          </div>
        </v-card-title>

        <v-divider></v-divider>

        <v-list class="notification-list" v-if="notifications.length">
          
            <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'notification-read': notification.isRead }"
            :value="notification.id"
            >
              <v-card class="notification-card" elevation="2">
                <div class="notification-remove">
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    @click.stop="removeNotification(notification.id)"
                    class="remove-btn"
                  ></v-btn>
                </div>
                
                <v-card-title 
                  class="notification-card-title py-2"
                  @click="openDialog(notification)"
                >
                  <div class="d-flex align-center">
                    <v-avatar
                      :color="notification.isRead ? 'grey' : 'primary'"
                      size="32"
                      class="mr-3"
                    >
                      <v-icon color="white" size="18">mdi-alert-circle-outline</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-medium">{{ notification.name }}</div>
                      <div class="caption text-grey">Burial Record Expiring</div>
                    </div>
                  </div>
                </v-card-title>

                <v-card-text class="pt-2 pb-2" @click="openDialog(notification)">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon size="16" class="mr-1" :color="getDaysColor(notification.daysLeft)">
                        mdi-clock-outline
                      </v-icon>
                      <span :class="['caption', getDaysTextColor(notification.daysLeft)]">
                        {{ notification.daysLeft }} days remaining
                      </span>
                    </div>
                    <v-btn
                      variant="text"
                      size="small"
                      color="primary"
                      class="px-2"
                    >
                      View Details
                      <v-icon size="16" class="ml-1">mdi-chevron-right</v-icon>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-list-item>
          
        </v-list>

        <div v-else class="empty-state pa-4">
          <v-icon size="48" color="grey lighten-1" class="mb-2">mdi-bell-off-outline</v-icon>
          <div class="text-body-1 text-grey-darken-1">No notifications</div>
        </div>
      </v-card>
    </v-menu>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline primary white--text pa-4">
          {{ dialogTitle }}
          <v-icon color="white" class="ml-2">mdi-account-outline</v-icon>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div v-for="(value, key) in dialogData" :key="key" class="dialog-item py-2">
            <div class="d-flex justify-space-between align-center">
              <div class="text-caption text-grey-darken-1">{{ key }}</div>
              <div class="text-body-2">{{ value }}</div>
            </div>
            <v-divider class="mt-2"></v-divider>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="closeDialog"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Keep your existing script code unchanged
const router = useRouter();
const apiUrl = 'http://localhost:8055';
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`;

const notifications = ref([]);
const notificationsMenu = ref(false);
const dialog = ref(false);
const dialogData = ref({});
const dialogTitle = ref('');
const isAuthenticated = ref(false);

// Improved authentication token handling
const getAuthToken = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.warn('No authentication token found - redirecting to login');
    router.push('/login'); // Redirect to your login page
    return null;
  }
  return token;
};
// Add authentication check
const checkAuthentication = () => {
  const token = localStorage.getItem('auth_token');
  isAuthenticated.value = !!token;
  return isAuthenticated.value;
};



// Add this new function for dynamic color handling
const getDaysColor = (days) => {
  if (days <= 3) return 'error';
  if (days <= 5) return 'warning';
  return 'success';
};

const getDaysTextColor = (days) => {
  if (days <= 3) return 'text-error';
  if (days <= 5) return 'text-warning';
  return 'text-success';
};

// Function to mark notification as read
const markAsRead = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId);
  if (notification && !notification.isRead) {
    notification.isRead = true;
    // You can also make an API call here to update the read status in your backend
    saveNotificationsToStorage();
  }
};

// Function to remove notification
const removeNotification = (notificationId) => {
  notifications.value = notifications.value.filter(n => n.id !== notificationId);
  saveNotificationsToStorage();
};

const openDialog = (notification) => {
  markAsRead(notification.id);
  dialogData.value = notification;
  dialogTitle.value = `${notification.first_name} ${notification.last_name} Details`;
  dialog.value = true;
};


const closeDialog = () => {
  dialog.value = false;
};

// Local storage functions
const saveNotificationsToStorage = () => {
  localStorage.setItem('notifications', JSON.stringify(notifications.value));
};

const loadNotificationsFromStorage = () => {
  const stored = localStorage.getItem('notifications');
  if (stored) {
    notifications.value = JSON.parse(stored);
  }
};

// Modified fetch function with authentication handling
const fetchNotifications = async () => {
  try {
    if (!checkAuthentication()) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    const response = await axios.get(burialRecordsEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const today = new Date();
    const expiringContracts = response.data.data
      .filter(item => {
        const expirationDate = new Date(item.year_covered);
        const daysLeft = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 7;
      })
      .map(item => ({
        id: item.id,
        name: `${item.first_name} ${item.last_name}`,
        daysLeft: Math.floor((new Date(item.year_covered) - today) / (1000 * 60 * 60 * 24)),
        isRead: false,
        ...item
      }));

    const existingIds = notifications.value.map(n => n.id);
    const newNotifications = expiringContracts.filter(n => !existingIds.includes(n.id));
    notifications.value = [...notifications.value, ...newNotifications];
    
    saveNotificationsToStorage();
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Authentication token expired or invalid');
      localStorage.removeItem('auth_token');
      router.push('/login');
    } else {
      console.error('Error fetching notifications:', error);
    }
  }
};

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    fetchNotifications();
  } else {
    notifications.value = [];
  }
});

// Rest of your existing code remains the same
const unreadCount = computed(() => {
  return notifications.value.filter(notification => !notification.isRead).length;
});

// ... (rest of your existing functions)

onMounted(async () => {
  loadNotificationsFromStorage();
  if (checkAuthentication()) {
    await fetchNotifications();
  }
});
</script>

<style scoped>
.notification-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-card {
  position: relative;
}

.notification-card:hover .remove-btn {
  opacity: 1;
}

.notification-read {
  opacity: 0.7;
}

.notification-read .notification-card {
  background-color: #f5f5f5;
}

.notification-bell {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
}

.notification-menu {
  width: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.notification-header {
  background: linear-gradient(45deg, #1976d2, #2196f3);
  color: white;
  padding: 16px;
}

.notification-title {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.notification-list {
  max-height: 460px;
  overflow-y: auto;
  padding: 8px;
}

.notification-item {
  margin-bottom: 8px;
}

.notification-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-card-title {
  border-bottom: 1px solid #f5f5f5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  color: #9e9e9e;
}

.dialog-item {
  transition: background-color 0.2s ease;
}

.dialog-item:hover {
  background-color: #f5f5f5;
}

/* Custom scrollbar */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}
</style>