import App from './App.vue'
import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.use(Vuetify)

const vuetify = new Vuetify({
  icons: {
    iconfont: 'md'
  }
})

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
