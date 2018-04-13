export default function makeDefaultState(
  servicePath,
  { idField, autoRemove, paginate, upsert, skipRequestIfExists }
) {
  const state = {
    ids: [],
    keyedById: {},
    currentId: null,
    copy: null,
    idField,
    servicePath,
    autoRemove,
    pagination: {},
    upsert,
    skipRequestIfExists,

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: null,
    errorOnGet: null,
    errorOnCreate: null,
    errorOnUpdate: null,
    errorOnPatch: null,
    errorOnRemove: null
  };
  return state;
}
