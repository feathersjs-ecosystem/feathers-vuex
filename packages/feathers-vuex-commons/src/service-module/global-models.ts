/*
eslint
no-console: 0,
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from './types'

/**
 * A global object that holds references to all Model Classes in the application.
 */
export const models: { [k: string]: any } = {}

/**
 * prepareAddModel wraps options in a closure around addModel
 * @param options
 */
export function prepareAddModel(options: FeathersVuexOptions) {
  const { serverAlias } = options

  return function addModel(Model) {
    models[serverAlias] = models[serverAlias] || {
      byServicePath: {},
    }
    const name = Model.modelName || Model.name
    if (models[serverAlias][name] && options.debug) {
      // eslint-disable-next-line no-console
      console.error(`Overwriting Model: models[${serverAlias}][${name}].`)
    }
    models[serverAlias][name] = Model
    models[serverAlias].byServicePath[Model.servicePath] = Model
  }
}

export function clearModels() {
  Object.keys(models).forEach(key => {
    const serverAliasObj = models[key]

    Object.keys(serverAliasObj).forEach(key => {
      delete models[key]
    })

    delete models[key]
  })
}
