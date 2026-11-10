const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: ['vuetify'],
  productionSourceMap: false,
  chainWebpack: (config) => {
    // Keep fonts as separate files: inlined into the render-blocking CSS, the
    // small ones would be loaded even when their characters aren't used
    config.module.rule('fonts').type('asset/resource')
  },
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: false,
      enableBridge: false
    }
  }
})
