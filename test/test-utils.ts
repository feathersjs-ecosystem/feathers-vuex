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
    0: { id: 0, description: 'Do the first', isComplete: false },
    1: { id: 1, description: 'Do the second', isComplete: false },
    2: { id: 2, description: 'Do the third', isComplete: false },
    3: { id: 3, description: 'Do the fourth', isComplete: false },
    4: { id: 4, description: 'Do the fifth', isComplete: false },
    5: { id: 5, description: 'Do the sixth', isComplete: false },
    6: { id: 6, description: 'Do the seventh', isComplete: false },
    7: { id: 7, description: 'Do the eighth', isComplete: false },
    8: { id: 8, description: 'Do the ninth', isComplete: false },
    9: { id: 9, description: 'Do the tenth', isComplete: false }
  }
}

export const makeStoreWithAtypicalIds = () => {
  return {
    0: { someId: 0, description: 'Do the first', isComplete: false },
    1: { someId: 1, description: 'Do the second', isComplete: false },
    2: { someId: 2, description: 'Do the third', isComplete: false },
    3: { someId: 3, description: 'Do the fourth', isComplete: false },
    4: { someId: 4, description: 'Do the fifth', isComplete: false },
    5: { someId: 5, description: 'Do the sixth', isComplete: false },
    6: { someId: 6, description: 'Do the seventh', isComplete: false },
    7: { someId: 7, description: 'Do the eighth', isComplete: false },
    8: { someId: 8, description: 'Do the ninth', isComplete: false },
    9: { someId: 9, description: 'Do the tenth', isComplete: false }
  }
}
