module.exports = {
  title: 'FeathersVuex',
  description: 'Integration of FeathersJS, Vue, and Nuxt for the artisan developer',
  themeConfig: {
    repo: 'feathers-plus/feathers-vuex',
    docsDir: 'docs',
    editLinks: true,
    sidebar: [
      '/api-overview.md',
      '/vue-plugin.md',
      '/service-module.md',
      '/auth-module.md',
      '/model-classes.md',
      '/common-patterns.md',
      '/mixins.md',
      '/components.md',
      '/nuxt.md'
    ],
    serviceWorker: {
      updatePopup: true
    }
  }
}