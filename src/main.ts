import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'


// Import all Vuetify components
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


const vuetify = createVuetify({
  components, // Register all Vuetify components
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#102a43',
          secondary: '#486581',
          info: '#1d4f7a',
          success: '#047857',
          warning: '#a16207',
          error: '#b42318',
          background: '#e8eef5',
          surface: '#ffffff',
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'sm',
      elevation: 0,
    },
    VBtn: {
      rounded: 'sm',
      elevation: 0,
      style: 'letter-spacing: 0; text-transform: none;',
    },
    VTextField: {
      density: 'comfortable',
      variant: 'outlined',
    },
    VSelect: {
      density: 'comfortable',
      variant: 'outlined',
    },
    VDataTable: {
      density: 'comfortable',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    }
  }
})

const app = createApp(App)
const pinia = createPinia();


app.use(router)
app.use(pinia); // Install Pinia
app.use(vuetify)



app.mount('#app')
