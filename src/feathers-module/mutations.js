export default options => {
  return {

    /**
     * Adds a service to the Feathers module's `services.vuex` property,
     * keyed by the service.path.
     * @param {*state} state This module's vuex state
     * @param {*FeathersService} the service to be added
     */
    addService (state, service) {
      const name = service.path
      // Overwrite existing services
      if (state.services.vuex[name]) {
        state.services.vuex[name] = service

      // Add new services
      } else {
        const vuexServices = {
          [name]: service,
          ...state.services.vuex
        }
        state.services.vuex = vuexServices
      }
    }
  }
}
