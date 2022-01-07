import App from './App.vue'
import router from './router'
import store from './store'
import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

Vue.config.productionTip = false

Vue.use(Vuetify)

const vuetify = new Vuetify({
  icons: {
    iconfont: 'md'
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
