export default options => {
  return {
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
