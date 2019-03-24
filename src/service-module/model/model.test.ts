import { assert } from 'chai'
import Vuex from 'vuex'
import servicePluginInit from './model.service-module'
import {
  makeFeathersRestClient,
  feathersRestClient as feathersClient,
  feathersSocketioClient
} from '../../../test/fixtures/feathers-client'
import makeModel from './model'

const globalModels = {}
const service = servicePluginInit(feathersClient, {}, globalModels)

describe.skip('makeModel', function() {
  it('registers a vuex plugin and Model for the service', () => {
    const serviceName = 'todos'
    const feathersService = feathersClient.service(serviceName)
    const store = new Vuex.Store({
      plugins: [service(serviceName)]
    })
    assert(
      globalModels.hasOwnProperty('Todo'),
      'the Model was added to the globalModels'
    )
    // assert(
    //   feathersService.FeathersVuexModel === globalModels.Todo,
    //   'the Model is also found at service.FeathersVuexModel'
    // )

    // const todo = new globalModels.Todo({
    //   description: 'Do the dishes',
    //   isComplete: false
    // })
    // assert(todo instanceof globalModels.Todo, 'Model can be instantiated.')

    // assert(store.state[serviceName])
  })

  it('creating FeathersVuexModel', function() {
    const FeathersVuexModel = makeModel({
      store: {}
    })

    assert(FeathersVuexModel.idField === 'id')
  })

  it('customizing FeathersVuexModel', function() {
    const FeathersVuexModel = makeModel({
      idField: '_id',
      store: {}
    })

    assert(FeathersVuexModel.idField === '_id')
  })
})
