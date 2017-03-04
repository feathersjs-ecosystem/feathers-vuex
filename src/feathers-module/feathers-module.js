export default function setupFeathersModule (store, options) {
  return feathers => store.registerModule(options.feathersModuleName, {
    namespaced: true,
    getters: {
      services: () => feathers.services
    }
  })
}
