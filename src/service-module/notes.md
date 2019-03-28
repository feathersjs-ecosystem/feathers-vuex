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
