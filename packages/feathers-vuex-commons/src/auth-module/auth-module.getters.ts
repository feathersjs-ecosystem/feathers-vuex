/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
export default function makeAuthGetters({ userService }) {
  const getters = {}

  if (userService) {
    Object.assign(getters, {
      // A reactive user object
      user(state, getters, rootState) {
        if (!state.user) {
          return null
        }
        const { idField } = rootState[userService]
        const userId = state.user[idField]
        return rootState[userService].keyedById[userId] || null
      },
      isAuthenticated(state, getters) {
        return !!getters.user
      },
    })
  }

  return getters
}
