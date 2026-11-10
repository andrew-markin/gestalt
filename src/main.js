// Roboto is served along with the app instead of Google Fonts, so no requests
// leave for third parties. Browsers load only the weights and character subsets
// used on the page
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './utils'

import Vue from 'vue'

import App from './App.vue'
import i18n from './i18n'
import router from './router'
import store from './store'
import vuetify from './vuetify'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(App)
}).$mount('#app')
