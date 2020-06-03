import { reactive } from 'vue'
import fastCopy from 'fast-copy'
import assert from 'assert'

/**
 * Tests baseline Vue functionality required by feathers-vuex to assure a solid foundation.
 */
describe('Vue Reactive Behavior', () => {
  it('can fastCopy a reactive', () => {
    const first = reactive({ _id: 1, name: 'Marshall' })
    const second = fastCopy(first)

    assert(first != second, 'the objects should be distinct.')
  })

  it('can fastCopy an instance of Model with getters and setters', () => {
    class Model {
      constructor(data) {
        Object.assign(this, data)
        return reactive(this)
      }
      givenName: string
      get firstName(): string {
        return this.givenName
      }
      set firstName(val) {
        this.givenName = val
      }
    }

    const first = new Model({ _id: 1, givenName: 'Marshall' })
    assert(first instanceof Model, 'first should be instance of Model')

    const second = fastCopy(first)
    assert(second instanceof Model, 'second should also be instance of Model')

    second.firstName = 'Marvin'
    assert.equal(second.givenName, 'Marvin', 'setter works properly')

    Object.assign(first, second)
    assert.equal(first.givenName, 'Marvin', 'first name should be Marvin, now.')
  })
})
