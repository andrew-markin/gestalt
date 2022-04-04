import { light, dark } from './themes'
import App from './App.vue'
import router from './router'
import store from './store'
import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import './utils'

Vue.config.productionTip = false

Vue.use(Vuetify)

const vuetify = new Vuetify({
  icons: {
    iconfont: 'md'
  },
  theme: {
    themes: { light, dark },
    options: { customProperties: true },
    dark: localStorage.getItem('dark') === 'true'
  },
  breakpoint: {
    thresholds: {
      xs: 576,
      sm: 768,
      md: 992,
      lg: 1200
    }
  }
})

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
