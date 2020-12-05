import feathers from '@feathersjs/client'
import feathersVuex from '@feathersjs/vuex'
import fastCopy from 'fast-copy'

const feathersClient = feathers()
feathersClient.hooks({
  before: {
    all: [
      // Prevent editing records in the feathers-memory store by always storing a copy.
      // This better simulates a server
      context => {
        context.params.query = fastCopy(context.params.query)
        return context
      },
    ],
  },
})

export default feathersClient

const { makeServicePlugin, makeAuthPlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'api',
  idField: '_id',
  whitelist: ['$regex', '$options'],
})

export { makeAuthPlugin, makeServicePlugin, BaseModel }
