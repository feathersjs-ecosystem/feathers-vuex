# Differences in Feathers-Vuex 2.0

The biggest change in Feathers-Vuex 2.0 is that it has been refactored with TypeScript!

> I will admit that I was less than excited to try out TypeScript.  It definitely introduces a bigger learning curve.  I'm not a fan of large barriers to entry, especially when it comes to software development.  I thought "It's hard enough already!".  And I still feel that's accurate, but it's not an excuse to stay away from TypeScript.  I see now that it's actually one of the reasons to use TypeScript.
>
> It only took me a couple of hours to learn some of the basics of TypeScript. Most of the time was spent configuring Visual Studio Code in a way that I liked.  For those interested in what I picked, check out [this article](https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project). Thank you, Robert Cooper for such a great setup.
>
> As I started devloping with TypeScript, I really appreciated how it started to rewire how I thought about code organization.  The cdde is much cleaner, especially the service plugin.  When adding Model support in Feathers-Vuex 1.0, I ran into a difficult race condition.  The Models need the store to first be initialized.  But the store actions/mutations need the Models to first be initialized.  In version 1.0 this resulted in a 115-line monkey patch!  With TypeScript's assistance, I was able to see how to reduce it to a clean, two-line monkey patch.  Much better!
>
> Some huge benefits came from this refactor.
>
> 1. The FeathersVuex Model class is now fully extendable. This introduces a new level of flexibility.
> 1. Test coverage has improved.  The newly-organized code is much easier to test in smaller units.
> 1. Greater compatibility for communicating with multiple FeathersJS servers. The organized code made it easy to see where to add support for this.
>
> TypeScript users will likely notice plenty of room for more accurate types. I'm just getting started with this stuff.  Please feel free to make PRs. I'm really excited to see what we can make out of this.

```js
const differencesToDocument = {
  instanceDefaults: {}, // The default values for the instance when `const instance =new Model()`
}
```

## Changes to Initialization

1. To assist in connecting with multiple FeathersJS API servers, a new `serverAlias` option is now required.  This requires a simple addition to the initial options.
2. The returned object has also changed.  The `service` method has been renamed to `makeServicePlugin`.
3. The `auth` method is now called `makeAuthPlugin`
4. You get back the actual FeathersVuexModel / BaseModel.  Feel free to extend it and make it fit your awesome apps!
5. You no longer pass a `servicePath` to create a service-plugin. Instead, pass the actual Feathers service.
6. Since you can customize the Model, you also pass the model into the `makeServicePlugin` method.

```js
import feathers from './feathers-client'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'

const {
  BaseModel,
  makeServicePlugin, // (2^)
  makeAuthPlugin, // (3^)
  FeathersVuex,
  models // (4^)
} = feathersVuex(feathers, {
  idField: '_id',
  serverAlias: 'myApiServer' // (1^)
})

class Todo extends BaseModel {
  public static modelName = 'Todo'
  // customize the model as you see fit!
}

const todosPlugin = makeServicePlugin({
  Model: Todo, // (6^)
  service: feathers.service('todos') // (5^)
})

const store = new Vuex.Store({
  plugins: [
    todosPlugin
  ]
})
```

## FeathersVuex Vue plugin changes

The Vue plugin is registered in exactly the same way.  The difference comes when you try to find the Model classes in the `$FeathersVuex` object.  Instead of finding models directly on the `$FeathersVuex` object, they are namespaced by the `serverAlias` you provided.  This allows cleaner support for multiple APIs.  Supposing you had this code in a component, previously...

```js
created () {
  // The old way
  const { Todo } = this.$FeathersVuex
}
```

Modify it to include the new `serverAlias`.  Suppose you set a `serverAlias` of `myApi`, you'd put this in the new version:

```js
created () {
  // The new way includes the `serverAlias` of '.myApi'
  const { Todo } = this.$FeathersVuex.myApi
}
```

## Support for Temporary Records

Feathers-Vuex 2.0 supports tracking temporary items and automatically assigns a temporary id (customizable using the `options.tempIdField`) and adds the records to the `state.tempsById` field.

Previously, when a record didn't have an `[idField]`, a console.error would ask if you had configured the `idField` option.  Because of the new ability to handle temporary records, a message is only logged when assigning a temporary id to a record.  The `checkId` utility function has been removed, since this was its main purpose.

Note: In order to get a tempId, you must pass at least an empty object to the constructor.  Supposing you have a Class named Todo:

```js
// This will not get you a tempId
const noTempId = new Todo()

// This will
const todoWithTempId = new Todo({})
```

## Getters Work with Temporary Records

The `find` getter has been updated to include records from `state.tempsById`, by default.  You can pass `temps: false` in the params to only search `state.keyedById`: `find({ query: {}, temps: false })`

The `get` getter has also been updated to work with temp ids.  Pass the tempId the way you normally would pass the id:  `get(tempId)`

## Changes to service module state

The options are no longer at the root level of the service module state.  You'll find them all in the options key:

```js
const state = {
  // ...
  options: {
    addOnUpsert: false,
    autoRemove: false,
    debug: false,
    diffOnPatch: true,
    enableEvents: true,
    idField: 'id',
    keepCopiesInStore: false,
    modelName: 'Todo',
    nameStyle: 'short',
    namespace: 'todos',
    paramsForServer: [],
    preferUpdate: false,
    replaceItems: false,
    serverAlias: 'default',
    servicePath: 'todos',
    skipRequestIfExists: false,
    whitelist: []
  },
  // ...
}
```

## The "currentItem" workflow is no longer supported

The `setCurrent` mutation and `currentId` state encouraged use of a very limiting API.  It's much more common for apps to require more than one current record.  The `createCopy`, `resetCopy` (formerly called `rejectCopy`), `commitCopy`, and `clearCopy` mutations (since v1.x) provide a more flexible solution for implementing the same functionality.  As a result of this, following have been removed from the modules:

- state: `currentID`
- getters: `current`
- mutations: `setCurrent`, `clearList`, `copy`

## The `diffOnPatch` option is turned on by default

In Feathers-Vuex 2.0, the `diffOnPatch` option is enabled, by default. This means that only the necessary data is sent to the API server.  Set `diffOnPatch: false` in the options to revert back to the old way.

## The `modelName` option has been removed

Previous versions of Feathers-Vuex only supported a single FeathersVuexModel class, which was difficult to customize.  This limitation required internal use of using inflections or passing a `modelName`.  Version 2.0, with its full support for extending the FeathersVuexModel/BaseModel class no longer requires this option.  Just name your class something new:

```js
const { makeServicePlugin, BaseModel } = feathersVuex(feathers, { serverAlias: 'myApi' })

class Todo extends BaseModel {
  public static modelName = 'Todo'
  public static exampleProp: string = 'Hello, World! (notice the comma, folks!)'
}

const store = new Vuex.Store({
  plugins: [
    makeServicePlugin({
      Model: Todo,
      service: feathers.service(servicePath)
    })
  ]
})
```

## Options are no longer kept on the Model

The Model class no longer has an `options` property.  You can access the same information through the `Model.store.state[Model.namespace]`.

## The 'apiPrefix' option has been removed

Feathers-Vuex now includes full support for communicating with multiple FeathersJS APIs.  The `apiPrefix` option was a poorly implemented, hacky first attempt at this same feature.  It was buggy.  Since it didn't work as intended, it has been removed.  See this example test for working with multiple APIs:

```js
import { assert } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import {
  feathersRestClient as feathers,
  makeFeathersRestClient
} from '../../test/fixtures/feathers-client'
import feathersVuex from './index'

it('works with multiple, independent Feathers servers', function() {
  // Connect to myApi, create a Todo Model & Plugin
  const feathersMyApi = makeFeathersRestClient('https://api.my-api.com')
  const myApi = feathersVuex(feathersMyApi, {
    idField: '_id',
    serverAlias: 'myApi'
  })
  class Todo extends myApi.BaseModel {
    public static modelName = 'Todo'
    public test: boolean = true
  }
  const todosPlugin = myApi.makeServicePlugin({
    Model: Todo,
    service: feathersMyApi.service('todos')
  })

  // Create a Task Model & Plugin on theirApi
  const feathersTheirApi = makeFeathersRestClient('https://api.their-api.com')
  const theirApi = feathersVuex(feathersTheirApi, {
    serverAlias: 'theirApi'
  })
  class Task extends theirApi.BaseModel {
    public static modelName = 'Task'
    public test: boolean = true
  }
  const tasksPlugin = theirApi.makeServicePlugin({
    Model: Task,
    service: feathersTheirApi.service('tasks')
  })

  // Register the plugins
  new Vuex.Store({
    plugins: [todosPlugin, tasksPlugin]
  })
  const { models } = myApi

  assert(models.myApi.Todo === Todo)
  assert(!models.theirApi.Todo, `Todo stayed out of the 'theirApi' namespace`)
  assert(models.theirApi.Task === Task)
  assert(!models.myApi.Task, `Task stayed out of the 'myApi' namespace`)

  assert.equal(
    models.myApi.byServicePath[Todo.servicePath],
    Todo,
    'also registered in models.byServicePath'
  )
  assert.equal(
    models.theirApi.byServicePath[Task.servicePath],
    Task,
    'also registered in models.byServicePath'
  )
```

## Services are no longer set up internally

You no longer just pass a servicePath, but instead an entire service object.

## Simplified Pending Mutations

Previously, there was a mutation for every single variety of method and set/unset pending. (`setFindPending`, `unsetFindPending`, etc.). There were a total of twelve methods for this simple operation. They are now combined into two methods: `setPending(method)` and `unsetPending(method)`.  Here's the difference.

```js
// The old way
commit('setFindPending')
commit('unsetFindPending')

// The new way
commit('setPending', 'find')
commit('unsetPending', 'find')
```

## Simplified Error Mutations

The "error" mutations have been simplified similar to the "pending" mutations:

```js
// The old way
commit('setFindError', error)
commit('clearFindError')

// The new way
commit('setError', { method: 'find', error })
commit('clearError', 'find')
```

## New Actions in the Service Module

The `handleFindResponse` and `handleFindError` actions were previously enclosed inside the `find` action.  Since the majority fo the `find` action consisted of the response handler, they've been pulled out.  This allows for much better readability.  It's technically now possible to override both actions by providing replacements in the `makeServicePlugin` config.

## Relationships have been separated from `instanceDefaults`

Feathers-Vuex 2.0 has a new API for establishing relationships between data.  Before we cover how it works, let's review the old API, first.

Feathers-Vuex 1.x allowed using the `instanceDefaults` API to both setup default values for Vue reactivity AND establishing relationships between services.  It supported passing a string name that matched a model name to setup a relationship, as shown in this next example.  This was a simple, but very limited API:

```js
// Defaults for a todo service
instanceDefaults: {
  _id: '',
  description: '',
  isCompleted: false,
  user: 'User'
}
```

Any instance data with a matching key would overwrite the same property in the instanceDefaults, which resulted in an inconsistent API.

In Feathers-Vuex 2.0, the `instanceDefaults` work the same for setting defaults with only one exception (see the next example).  They no longer setup the relationships, though.  The new `setupInstance` function provides an API that is much more powerful.

The main difference with `instanceDefaults` in Feathers-Vuex 2.0 is that it MUST be provided as a function, now:

```js
// See the `model-instance-defaults.test.ts` file for example usage.
// This is a brief example.
instanceDefaults(data, { models, store}) {
  return {
    _id: '',
    description: '',
    isCompleted: false
    // No user props, here.
  }
}
```

Notice in the above example that we did not return `user`.  We'll handle it in the `setupInstance` method.

Where `instanceDefaults` props get replaced by instance data, the props returned from `setupInstance` overwrite the instance data.  If it were using `Object.assign`, internally (it's not, but IF it were), it would look like the below example, where `data` is the original instance data passed to the constructor.

```js
Object.assign({}, instanceDefaults(data), data, setupInstance(data))
```

## Define Relationships and Modify Data with `setupInstance`

The new `setupInstance` method allows a lot of flexibility in creating new instances.  It has the exact same API as the `instanceDefaults` method.  The only difference is the order in which they are applied to the instance data.

While you could technically use `setupInstance` to do all of your default values, the APIs have been kept separate to allow a clean separation between setting up defaults and establishing relationships and other constructors.

```js
// See the `model-relationships.test.ts` file for example usage.
// This is a brief example.
function setupInstance(data, { models, store }) {
  const { User, Tag } = models.myServerAlias // Based on the serverAlias you provide, initially

  // A single User instance
  if (data.user) {
    data.user = new User(data.user)
  }
  // An array of Tag instances
  if (data.tags) {
    data.tags = data.tags.map(t => new Tag(t))
  }
  // A JavaScript Date Object
  if (data.createdAt) {
    data.createdAt = new Date(data.createdAt)
  }
}
```

Or below is an example that does the exact same thing with one line per attribute:

```js
function setupInstance(data, { models, store }) {
  const { User } = models.myServerAlias

  return Object.assign(data, {
    ...(data.user && { user: new User(data.user) }), // A single User instance
    ...(data.tags && { tags: data.tags.map(t => new Tag(t)) }), // An array of Tag instances
    ...(data.createdAt && { createdAt: new Date(data.createdAt) }) // A JavaScript Date Object
  })
}
```

Where `instanceDefaults` props get replaced by instance data, the props returned from `setupInstance` overwrite the instance data.  If it were using `Object.assign`, internally (it's not, but IF it were), it would look like the below example, where `data` is the original instance data passed to the constructor.

```js
Object.assign({}, instanceDefaults(data), data, setupInstance(data))
```

### This part is out of date

I'm testing out a version of the `mergeWithAccessors` utility function that allows copying non-enumerables, but still skips `__ob__` properties for Vue.Observables.  This section will require updating after I've integration tested it.

Another important note when using es5 accessors (get/set) is that you must define the property as enumerable.  This is because the `mergeWithAccessors` utility that's used to clone and commit instances ignores any non-enumerable props.  Using the previous example as a starting point, this is how to define an es5 getter:

```js
function setupInstance(data, { models, store }) {
  const { User } = models.myServerAlias

  data = Object.assign(data, {
    ...(data.user && { user: new User(data.user) }), // A single User instance
    ...(data.tags && { tags: data.tags.map(t => new Tag(t)) }), // An array of Tag instances
    ...(data.createdAt && { createdAt: new Date(data.createdAt) }) // A JavaScript Date Object
  })

  Object.defineProperties(data, {
    fullName: {
      enumerable: true,
      get () {
        return `${this.firstName} ${this.lastName}`
      }
    }
  })

  return data
}
```

Making a getter enumerable means that it will get serialized in the toJSON method, by default.  This means that the attribute will get sent in requests to the API server.  This isn't a problem if the API strips away extra params without throwing an error.  For other APIs, it might be an issue.  To prevent the attribute from getting serialized in requests, you can override the toJSON method in the model class:

```js
import fastCopy from 'fast-copy'

const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'myApi'
})

const Todo extends BaseModel {
  // The `setupInstance` method must be a static method
  static setupInstance(data, { models, store }) {
    const { User } = models.myServerAlias

    data = Object.assign(data, {
      ...(data.user && { user: new User(data.user) }), // A single User instance
      ...(data.tags && { tags: data.tags.map(t => new Tag(t)) }), // An array of Tag instances
      ...(data.createdAt && { createdAt: new Date(data.createdAt) }) // A JavaScript Date Object
    })

    Object.defineProperties(data, {
      fullName: {
        enumerable: true,
        get () {
          return `${this.firstName} ${this.lastName}`
        }
      }
    })

    return data
  }
  // And toJSON is an instance prop
  toJSON () {
    // Copy the data so you don't modify the original
    const copy = fastCopy(this)

    // Delete the prop / modify as required
    delete copy.fullName

    // Return the modified data
    return copy
  }
}
```

## Preventing duplicate merge when extending BaseModel with a custom constructor

The BaseModel constructor calls `mergeWithAccessors(this, newData)`.  This utility function correctly copies data between both regular objects and Vue.observable instances.  If you create a class where you need to do your own merging, you probably don't want `mergeWithAccessors` to run twice.  In this case, you can use the `merge: false` BaseModel instance option to prevent the internal merge.  You can then access the `mergeWithAccessors` method by calling `MyModel.merge(this, newData)`.  Here's an example:

```ts
const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'myApiServer'
})

class Todo extends BaseModel {
  public constructor(data, options?) {
    options.merge = false // Prevent the internal merge from occurring.
    super(data, options)

    // ... your custom construcor logic happens here.

    // Call the static merge method to do your own merging.
    Todo.merge(this, data)
  }
  public static modelName = 'Todo'
}
```

It's important to note that setting `merge: false` in the options will disable the `setupinstance` function.  You need to manually call it, like this:

```ts
class Todo extends BaseModel {
  public constructor(data, options?) {
    options.merge = false // Prevent the internal merge from occurring.
    super(data, options)

    // ... your custom construcor logic happens here.

    // Call setupInstance manually
    const { models, store } = Todo
    // JavaScript fundamentals: if you're using `this` in `setupInstance`, use .call(this, ...)
    const instanceData = Todo.setupInstance.call(this, data, { models, store })
    // If you're not using `this, just call it like normal
    const instanceData = Todo.setupInstance(data, { models, store })

    // Call the static merge method to do your own merging.
    Todo.merge(this, instanceData)
  }
  public static modelName = 'Todo'
}
```