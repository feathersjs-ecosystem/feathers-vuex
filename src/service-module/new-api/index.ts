/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'
import prepareMakeServicePlugin from './make-service-plugin'
import makeModel from './make-model'
import { prepareAddModel } from './add-model'
import models from './global-models'

const defaultOptions: FeathersVuexOptions = {
  autoRemove: false, // Automatically remove records missing from responses (only use with feathers-rest)
  addOnUpsert: false, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them
  diffOnPatch: true, // Only send changed data on patch. Sends the full object if set to false.
  enableEvents: true, // Listens to socket.io events when available
  idField: 'id', // The field in each record that will contain the id
  debug: false, // Set to true to enable logging messages.
  keepCopiesInStore: false, // Set to true to store cloned copies in the store instead of on the Model.
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  paramsForServer: [], // Custom query operators that are ignored in the find getter, but will pass through to the server.
  preferUpdate: false, // When true, calling model.save() will do an update instead of a patch.
  replaceItems: false, // Instad of merging in changes in the store, replace the entire record.
  serverAlias: '',
  skipRequestIfExists: false, // For get action, if the record already exists in store, skip the remote request
  whitelist: [] // Custom query operators that will be allowed in the find getter.
}

export default function feathersVuex(feathers, options: FeathersVuexOptions) {
  if (!feathers || !feathers.service) {
    throw new Error(
      'The first argument to feathersVuex must be a feathers client.'
    )
  }
  options = Object.assign({}, defaultOptions, options)
  const BaseModel = makeModel(options)
  const makeServicePlugin = prepareMakeServicePlugin(options)
  const addModel = prepareAddModel(options)

  return {
    makeServicePlugin,
    BaseModel,
    addModel,
    models
  }
}
