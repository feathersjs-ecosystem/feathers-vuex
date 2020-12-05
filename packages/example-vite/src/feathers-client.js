import feathers from '@feathersjs/client'
import feathersVuex from '@feathersjs/vuex'
import fastCopy from 'fast-copy'
import { iff, discard } from 'feathers-hooks-common'

const feathersClient = feathers()
feathersClient.hooks({
  before: {
    all: [
      // Prevent temp attributes from getting stored on the server.
      iff(
        context => ['create', 'update', 'patch'].includes(context.method),
        discard('__id', '__isTemp')
      ),
      // Prevent editing records in the feathers-memory store by always storing a copy.
      // This better simulates a server
      context => {
        context.params.query = fastCopy(context.params.query)
        return context
      },
    ],
    create: [log],
    patch: [log],
  },
})

export default feathersClient

const { makeServicePlugin, makeAuthPlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'api',
  idField: '_id',
  whitelist: ['$regex', '$options'],
})

export { makeAuthPlugin, makeServicePlugin, BaseModel }

// Example logging function for showing in the console that the data is being updated
export function log(context) {
  const info = { data: context.data }
  if (context.id) {
    info._id = context.id
  }
  console.log(context.path, context.method, info)
}
