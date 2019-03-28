/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'

/**
 * A global object that holds references to all Model Classes in the application.
 */
export const globalModels: { [k: string]: Record<string, any> } = {}

/**
 * prepareAddModel wraps options in a closure around addModel
 * @param options
 */
export function prepareAddModel(options: FeathersVuexOptions) {
  const { serverAlias } = options

  return function addModel(Model) {
    globalModels[serverAlias] = globalModels[serverAlias] || {
      byServicePath: {}
    }
    if (globalModels[serverAlias][Model.name] && options.debug) {
      console.error(`Overwriting Model: models[${serverAlias}][${Model.name}].`)
    }
    globalModels[serverAlias][Model.name] = Model
    globalModels[serverAlias].byServicePath[Model.servicePath] = Model
  }
}

export function clearModels() {
  Object.keys(globalModels).forEach(key => {
    const serverAliasObj = globalModels[key]

    Object.keys(serverAliasObj).forEach(key => {
      delete globalModels[key]
    })

    delete globalModels[key]
  })
}
