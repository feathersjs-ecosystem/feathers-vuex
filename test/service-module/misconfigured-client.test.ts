import { assert } from 'chai'
import feathersVuex from '../../src/index'
import feathers from '@feathersjs/client'
import auth from '@feathersjs/authentication-client'

const feathersClient = feathers().configure(auth())

describe('Service Module - Bad Client Setup', () => {
  it('throws an error when no client transport plugin is registered', () => {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'misconfigured'
    })
    class MisconfiguredTask extends BaseModel {
      public static test: boolean = true
    }

    try {
      makeServicePlugin({
        Model: MisconfiguredTask,
        service: feathersClient.service('misconfigured-todos')
      })
    } catch (error) {
      assert(
        error.message.includes(
          'No service was provided. If you passed one in, check that you have configured a transport plugin on the Feathers Client. Make sure you use the client version of the transport`.'
        ),
        'got an error with a misconfigured client'
      )
    }
  })
})
