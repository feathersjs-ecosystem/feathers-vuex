import { isBrowser } from '../utils'

export default service => {
  const vuexOptions = service.vuexOptions
  const idField = (vuexOptions.module && vuexOptions.module.idField) || vuexOptions.global.idField

  const state = {
    ids: [],
    keyedById: {},
    currentId: undefined,
    copy: undefined,
    idField,

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnfind: undefined,
    errorOnGet: undefined,
    errorOnCreate: undefined,
    errorOnUpdate: undefined,
    errorOnPatch: undefined,
    errorOnRemove: undefined
  }
  if (isBrowser) {
    state.service = service
  }
  return state
}
