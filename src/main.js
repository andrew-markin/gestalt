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

// The app is mounted once the main font faces are loaded, so that the text
// isn't shown in a fallback font first and then swapped. The faces are picked
// by the weights and the sample text (Latin and Cyrillic). If loading takes too
// long, the app is mounted anyway and the font is swapped in later
const FONT_WEIGHTS = [400, 500]
const FONT_SAMPLE = 'Aa Аа'
const FONT_TIMEOUT = 1500

const fontsLoaded = () => Promise.race([
  Promise.all(FONT_WEIGHTS.map((weight) => {
    return document.fonts.load(`${weight} 1em Roboto`, FONT_SAMPLE)
  })),
  new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT))
]).catch(() => {})

const mount = () => {
  new Vue({
    router,
    store,
    vuetify,
    i18n,
    render: h => h(App)
  }).$mount('#app')
}

if (document.fonts) fontsLoaded().then(mount)
else mount()
