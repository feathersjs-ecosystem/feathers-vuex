/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import globalModels from './global-models'

/**
 * prepareAddModel wraps options in a closure around addModel
 * @param options
 */
export default function prepareAddModel(options) {
  const { serverAlias } = options

  return function addModel(Model) {
    globalModels[serverAlias] = globalModels[serverAlias] || {}
    if (globalModels[serverAlias][Model.name]) {
      console.error(`Overwriting Model: models[${serverAlias}][${Model.name}].`)
    }
    globalModels[serverAlias][Model.name] = Model
  }
}
