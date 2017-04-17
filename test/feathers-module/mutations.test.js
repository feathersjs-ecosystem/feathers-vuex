import assert from 'chai/chai'
import mapMutations from '~/src/feathers-module/mutations'

const mutations = mapMutations()
const { addService } = mutations

describe('Feathers Module - Mutations', () => {
  it('addService', () => {
    const state = {
      services: {
        vuex: {}
      }
    }
    const name = 'todos'
    const service = {
      path: name
    }

    addService(state, service)
    assert(state.services.vuex.todos)
  })
})
