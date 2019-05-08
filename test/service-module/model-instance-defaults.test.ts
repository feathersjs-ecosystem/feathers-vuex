/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState, Location } from './types'
import { assert } from 'chai'
import feathersVuex, { models } from '../../src/index'
import { mergeWithAccessors } from '../../src/utils'
import { clearModels } from '../../src/service-module/global-models'
import {
  makeFeathersRestClient,
  feathersRestClient as feathersClient,
  feathersSocketioClient
} from '../fixtures/feathers-client'
import Vuex from 'vuex'

interface TodoState extends ServiceState {
  test: any
  test2: {
    test: boolean
  }
  isTrue: boolean
}
interface RootState {
  todos: TodoState
  tasks: ServiceState
  tests: ServiceState
  blah: ServiceState
  things: ServiceState
}

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'service-module'
  })

  class Todo extends BaseModel {
    public static modelName = 'Todo'
    public id
    public description: string

    public constructor(data = {}, options?) {
      super(data, options)
    }
  }
  class Person extends BaseModel {
    public static modelName = 'Person'
    public static test: boolean = true
  }
  class Item extends BaseModel {
    public static modelName = 'Item'
    public static test: boolean = true
  }
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static test: boolean = true
  }
  class Car extends BaseModel {
    public static modelName = 'Car'
    public static test: boolean = true
  }
  class Group extends BaseModel {
    public static modelName = 'Group'
    public static test: boolean = true
  }
  class Test extends BaseModel {
    public static modelName = 'Test'
    public static test: boolean = true
  }
  class Thing extends BaseModel {
    public static modelName = 'Thing'
    public static test: boolean = true
  }

  const todosPlugin = makeServicePlugin({
    Model: Todo,
    service: feathersClient.service('service-todos')
  })
  const store = new Vuex.Store<RootState>({
    plugins: [
      todosPlugin,
      makeServicePlugin({
        Model: Person,
        service: feathersClient.service('people')
      }),
      makeServicePlugin({
        Model: Car,
        service: feathersClient.service('cars')
      }),
      makeServicePlugin({
        Model: Group,
        service: feathersClient.service('groups')
      })
    ]
  })

  return {
    makeServicePlugin,
    BaseModel,
    Todo,
    Person,
    Item,
    Task,
    Car,
    Group,
    Test,
    Thing,
    store
  }
}

describe('Models - Default Values', function () {
  beforeEach(() => {
    clearModels()
  })

  it('models default to an empty object when there is no BaseModel.store', function () {
    const { BaseModel } = makeContext()

    // Since we're not using this NakedTodo model in a service plugin, it doesn't get
    // monkey patched with the store.
    class NakedTodo extends BaseModel {
      public static test: boolean = true
    }
    const todo = new NakedTodo()

    assert.deepEqual(todo.toJSON(), {}, 'default model is an empty object')
  })

  it('models have tempIds when there is a store', function () {
    const { Todo } = makeContext()
    const todo = new Todo()

    const expectedProps = ['__id', '__isTemp']

    assert.deepEqual(
      Object.keys(todo),
      expectedProps,
      'default model is a temp'
    )
  })

  it('adds new instances containing an id to the store', function () {
    const { Todo } = makeContext()

    const todo = new Todo({
      id: 1,
      description: 'test',
      isComplete: true
    })
    const todoInStore = Todo.store.state['service-todos'].keyedById[1]

    assert.deepEqual(todoInStore, todo, 'task was added to the store')
  })

  it('stores clones in Model.copiesById by default', function () {
    const { Todo } = makeContext()
    const todo = new Todo({ id: 1, description: 'This is the original' })

    assert.deepEqual(
      Todo.copiesById,
      {},
      'Model.copiesById should start out empty'
    )

    const todoClone = todo.clone()
    assert(Todo.copiesById[1], 'should have a copy stored on Model.copiesById')

    todoClone.description = `I'm a clone, now!`
    todoClone.commit()

    assert.equal(
      todo.description,
      `I'm a clone, now!`,
      'the original should have been updated'
    )
  })

  it('allows instance defaults, including getters and setters', function () {
    const { BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Car extends BaseModel {
      public id?
      public year: number = 1905
      public make: string = 'Tesla'
      public model: string = 'Roadster'
      public get combined(): string {
        return `${this.year} ${this.make} ${this.model}`
      }
      public set yearBeforeCurrent(year) {
        if (year < this.year) {
          this.year = year
        }
      }

      public constructor(data?, options?) {
        super(data, options)
      }
    }

    const car = new Car()

    assert.equal(car.year, 1905, 'default year set')
    assert.equal(car.make, 'Tesla', 'default make set')
    assert.equal(car.model, 'Roadster', 'default model set')
    assert.equal(car.combined, '1905 Tesla Roadster', 'getters work, too!')

    car.yearBeforeCurrent = 1900

    assert.equal(car.combined, '1900 Tesla Roadster', 'setters work, too!')
  })

  it('allows overriding default values in the constructor', function () {
    const { BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Car extends BaseModel {
      public id?
      public year: number = 1905
      public make: string = 'Tesla'
      public model: string = 'Roadster'

      public constructor(data?, options?) {
        super(data, options)
        if (this.make === 'Tesla') {
          this.make = 'Porsche'
        }
      }
    }

    const car = new Car()

    assert.equal(car.make, 'Porsche', 'default make set')
  })

  it(`uses the class defaults if you don't override them in the constructor`, function () {
    const { BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Person extends BaseModel {
      public id?
      public firstName: string = 'Harry'
      public location: Location = {
        coordinates: [0, 0]
      }

      public constructor(data?, options?) {
        // Calling super calls the BaseModel constructor, which merges the data
        // onto `this`.
        super(data, options)

        // Once the BaseModel constructor has finished, the props in the class
        // definition are applied to `this` before running any additional code in the
        // extending class's constructor. This means that at this point, all
        // new instances have `location.coordinates = [0, 0]`

        // Since we're not re-applying the `data` to `this`, the class defaults have
        // overwritten whatever we passed in.
        return this
      }
    }

    const location: Location = {
      coordinates: [1, 1]
    }

    const person1 = new Person({ firstName: 'Marshall', location })
    const person2 = new Person({ firstName: 'Austin', location })
    const areSame = person1.location === person2.location

    assert(!areSame, 'the locations are different objects')
    assert(person1.firstName === 'Harry', 'the defaults replaced our args')
    assert(person2.firstName === 'Harry', 'the defaults replaced our args')

    // See, even the location we passed in was overwritten by the defaults.
    assert.deepEqual(person1.location.coordinates, [0, 0], 'defaults won')
  })

  it('does not share nested objects between instances when you override class defaults in the constructor', function () {
    const { BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Person extends BaseModel {
      public id?
      public firstName: string
      public location: Location = {
        coordinates: [0, 0]
      }

      public constructor(data?, options?) {
        // Pass { merge: false } in the third arg to prevent BaseModel from
        // doing its own merge
        super(data, options, { merge: false })

        // Calling merge here overwrites the Class's default location.
        // You could also write `this.location = data.location`
        return Person.merge(this, data)
      }
    }

    const location: Location = {
      coordinates: [1, 1]
    }

    // Look, I'm passing in location with coordinates [1, 1]
    const person1 = new Person({ firstName: 'Marshall', location })
    const person2 = new Person({ firstName: 'Austin', location })
    const areSame = person1.location === person2.location

    // But the objects are distinct because they've been merged in the constructor
    assert(!areSame, 'the locations are different objects')
  })

  it('allows passing instanceDefaults in the service plugin options', function () {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Person extends BaseModel {
      public constructor(data?, options?) {
        super(data, options)
      }
    }

    const location: Location = {
      coordinates: [1, 1]
    }

    new Vuex.Store({
      plugins: [
        makeServicePlugin({
          Model: Person,
          service: feathersClient.service('people'),
          instanceDefaults: () => ({
            firstName: 'Harry',
            lastName: 'Potter',
            location,
            get fullName() {
              return `${this.firstName} ${this.lastName}`
            },
            set fullName(val) {
              const [firstName, lastName] = val.split(' ')
              Object.assign(this, { firstName, lastName })
            }
          })
        })
      ]
    })

    const person1 = new Person({ firstName: 'Marshall', lastName: 'Thompson' })
    const person2 = new Person({
      firstName: 'Kai',
      location: { coordinates: [0, 0] },
      fullName: 'Jerry Seinfeld'
    })
    const areSame = person1.location === person2.location
    assert(!areSame, 'nested objects are unique')

    assert.equal(person1.lastName, 'Thompson', 'person1 has correct lastName')
    assert.equal(person2.lastName, 'Potter', 'person2 got default lastName')
    assert.deepEqual(
      person1.location.coordinates,
      [1, 1],
      'person1 got default location'
    )
    assert.deepEqual(
      person2.location.coordinates,
      [0, 0],
      'person2 got provided location'
    )
    assert.equal(person1.fullName, 'Marshall Thompson', 'getter is in place')
    assert.equal(person2.fullName, 'Kai Potter', 'getter is still in place')

    person1.fullName = 'Marshall Me'
    person2.fullName = 'Kai Me'

    assert.equal(person1.firstName, 'Marshall', 'firstName was set')
    assert.equal(person1.lastName, 'Me', 'lastName was set')
    assert.equal(person2.firstName, 'Kai', 'firstName was set')
    assert.equal(person2.lastName, 'Me', 'lastName was set')
  })

  it('instanceDefault accessors stay intact with clone and commit', function () {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'instance-defaults'
    })

    class Person extends BaseModel {
      public constructor(data?, options?) {
        super(data, options)
      }
    }

    const location: Location = {
      coordinates: [1, 1]
    }

    new Vuex.Store({
      plugins: [
        makeServicePlugin({
          Model: Person,
          service: feathersClient.service('people'),
          instanceDefaults: () => ({
            firstName: 'Harry',
            lastName: 'Potter',
            location,
            get fullName() {
              return `${this.firstName} ${this.lastName}`
            },
            set fullName(val) {
              const [firstName, lastName] = val.split(' ')
              Object.assign(this, { firstName, lastName })
            }
          })
        })
      ]
    })

    const person = new Person({ firstName: 'Marshall', lastName: 'Thompson' })

    // Clone the person
    const clone = person.clone()

    // Check the getter
    clone.firstName = 'FeathersJS'
    clone.lastName = 'Developer'
    assert.equal(clone.fullName, 'FeathersJS Developer', 'getter is in place')

    // Check the setter
    clone.fullName = 'Marshall Me'
    assert.equal(
      `${clone.firstName} ${clone.lastName}`,
      'Marshall Me',
      'Setter is in place'
    )

    // Commit the clone
    clone.commit()

    //Check the getter
    person.firstName = 'FeathersJS'
    person.lastName = 'Developer'
    assert.equal(person.fullName, 'FeathersJS Developer', 'getter is in place')

    // Check the setter
    person.fullName = 'Scooby Doo'
    assert.equal(
      `${person.firstName} ${person.lastName}`,
      'Scooby Doo',
      'Setter is in place'
    )
  })
})
