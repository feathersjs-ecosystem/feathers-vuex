import { assert } from 'chai'
// import Vuex from 'vuex'

// import { makeTodos } from '../../../test/fixtures/todos'
// import {
//     feathersRestClient as feathersClient, feathersSocketioClient, makeFeathersRestClient
// } from '../fixtures/feathers-client'
import makeModel from './model'

describe('makeModel', function() {
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
