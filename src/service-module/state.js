export default service => {
  const vuexOptions = service.vuexOptions
  const idField = (vuexOptions.module && vuexOptions.module.idField) || vuexOptions.global.idField

  return {
    ids: [],
    keyedById: {},
    currentId: undefined,
    copy: undefined,
    service,
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
}
