import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import { light, dark } from './themes'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg'
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
