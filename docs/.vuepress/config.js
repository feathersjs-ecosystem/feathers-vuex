module.exports = {
  title: 'FeathersVuex',
  description: 'Integration of FeathersJS, Vue, and Nuxt for the artisan developer',
  theme: 'default-prefers-color-scheme',
  themeConfig: {
    repo: 'feathersjs-ecosystem/feathers-vuex',
    docsDir: 'docs',
    editLinks: true,
    sidebar: [
      '/api-overview.md',
      '/vue-plugin.md',
      '/service-plugin.md',
      '/auth-plugin.md',
      '/model-classes.md',
      '/common-patterns.md',
      '/mixins.md',
      '/data-components.md',
      '/feathers-vuex-form-wrapper.md',
      '/nuxt.md',
      '/2.0-major-release.md'
    ],
    serviceWorker: {
      updatePopup: true
    }
  }
}