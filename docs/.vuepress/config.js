module.exports = {
  title: 'FeathersVuex',
  description: 'Integration of FeathersJS, Vue, and Nuxt for the artisan developer',
  theme: 'default-prefers-color-scheme',
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
      '/data-components.md',
      '/feathers-vuex-form-wrapper.md',
      '/nuxt.md'
    ],
    serviceWorker: {
      updatePopup: true
    }
  }
}