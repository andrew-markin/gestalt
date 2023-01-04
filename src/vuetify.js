import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

import { dark, light } from './themes'

Vue.use(Vuetify)

let darkThemeIsPreferredBySystem = false
const darkThemeMediaQuery = matchMedia && matchMedia('(prefers-color-scheme: dark)')

if (darkThemeMediaQuery) {
  darkThemeIsPreferredBySystem = darkThemeMediaQuery.matches
  darkThemeMediaQuery.addEventListener('change', ({ matches }) => {
    darkThemeIsPreferredBySystem = matches
    updateDarkThemeState()
  })
}

const DARK_THEME_KEY = 'dark'

const darkThemeIsPreferred = () => {
  const darkThemeIsPreferredByUser = localStorage.getItem(DARK_THEME_KEY)
  return darkThemeIsPreferredByUser !== null
    ? darkThemeIsPreferredByUser === 'true'
    : darkThemeIsPreferredBySystem
}

const updateDarkThemeState = () => {
  vuetify.framework.theme.dark = darkThemeIsPreferred()
}

export const toggleDarkTheme = () => {
  const dark = !vuetify.framework.theme.dark
  if (dark !== darkThemeIsPreferredBySystem) localStorage.setItem(DARK_THEME_KEY, dark)
  else localStorage.removeItem(DARK_THEME_KEY)
  updateDarkThemeState()
}

const vuetify = new Vuetify({
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    themes: { light, dark },
    options: { customProperties: true },
    dark: darkThemeIsPreferred()
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

export default vuetify
