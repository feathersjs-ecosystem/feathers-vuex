/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'

export function assertGetter(item, prop, value) {
  assert(
    typeof Object.getOwnPropertyDescriptor(item, prop).get === 'function',
    'getter in place'
  )
  assert.equal(item[prop], value, 'returned value matches')
}

export const makeStore = () => {
  return {
    0: { id: 0, description: 'Do the first' },
    1: { id: 1, description: 'Do the second' },
    2: { id: 2, description: 'Do the third' },
    3: { id: 3, description: 'Do the fourth' },
    4: { id: 4, description: 'Do the fifth' },
    5: { id: 5, description: 'Do the sixth' },
    6: { id: 6, description: 'Do the seventh' },
    7: { id: 7, description: 'Do the eighth' },
    8: { id: 8, description: 'Do the ninth' },
    9: { id: 9, description: 'Do the tenth' }
  }
}
