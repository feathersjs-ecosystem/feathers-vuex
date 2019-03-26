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
