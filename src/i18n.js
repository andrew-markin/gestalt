import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const messages = {}
const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
locales.keys().forEach((key) => {
  const matched = key.match(/([A-Za-z0-9-_]+)\./i)
  if (matched && (matched.length > 1)) {
    const locale = matched[1]
    messages[locale] = locales(key)
  }
})

const trimLocale = (locale) => locale && locale.trim().split(/-|_/)[0]
const navigatorLocale = trimLocale(
  navigator.languages !== undefined
    ? navigator.languages[0]
    : navigator.language
)

const LOCALE_KEY = 'locale'

export const preferLocale = (value) => {
  if (value !== navigatorLocale) localStorage.setItem(LOCALE_KEY, value)
  else localStorage.removeItem(LOCALE_KEY)
}

export default new VueI18n({
  locale: localStorage.getItem(LOCALE_KEY) || navigatorLocale || 'en',
  fallbackLocale: 'en',
  messages
})
