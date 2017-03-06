export default options => {
  return {
    addService (state, service) {
      const name = service.vuexOptions.module.name
      const vuexServices = {
        [name]: service,
        ...state.services.vuex
      }
      state.services.vuex = vuexServices
    }
  }
}
