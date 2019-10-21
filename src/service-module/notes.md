# Differences in Feathers-Vuex 2.0

The biggest change in Feathers-Vuex 2.0 is that it has been refactored with TypeScript!  (It's mostly ES6, still)

Your project does NOT require to be written in TypeScript.  The `dist` is compiled to ES6.

## Trying it out

One note about trying it out.  Because I accidentally published `feathers-vuex@2.0.0` with a `pre` tag on npm, you have to install the specific version number to get the latest code.  To find out which is the most-recently published version, run `npm view feathers-vuex` and look at the `pre` tag.  You can ignore the `next` and `pegasus` tags.  Those were that happened because I publish a lot of packages.  :)

To try the latest code.

```bash
npm view feathers-vuex
```

The end of the output looks something like this:

```bash
dist-tags:
latest: 1.7.0         next: 1.7.0-pre.37    pegasus: 1.7.0-pre.1  pre: 2.0.0-pre.45
```

Now use the latest `pre` tag:

```bash
npm i feathers-vuex@2.0.0-pre.45

# or with yarn
yarn add feathers-vuex@2.0.0-pre.45
```

## My TypeScript experience

Initially, I wasn't a fan of TypeScript.  I'm turned off by the steeper learning curve it introduces to writing code.

What I do like is the tooling.  It's like having an assistant that alerts you to stupid moves before you have to accidentally discover them yourself.  I'm only able to appreciate it for one reason: you can use directives to tell it to ignore lines or files, similar to ESLint. The tooling will then shut up and let me write JavaScript.  TypeScript has been quite beneficial to allowing me to better see how to refactor and get rid of a huge monkey patch.  It's down to a few lines of code, now.

I imagine I will like TypeScript more when there's first-class support for it built into Vue.  I imagine how powerful it will be in an entire Vue project.  It's one of the reasons that I'm REALLY excited about the new VueJS 3.0 API (The new function-based syntax is way more exciting, though. It's going to let me write some really pretty, well-organized code :)

But that's enough about TypeScript.

## Where I need assistance: the build

The build system has been my only frustration with switching to TypeScript.  Transpiling from TypeScript to JavaScript only to be transpiled by Babel (or whichever) into another form of JavaScript... has proven to be frustrating.  I could really use some help in this area.

My original intent was to target the build to ES5.  But there are some weird errors that show up when classes get transpiled into old Javascript code.  Classes don't quite behave the same after transpiling.  Things were so inconsistent that I couldn't write down any useful notes to tell you what I was experiencing.  The only clarity I got out of the experience was that it was frustrating.  ;)

I found that the simplest way around my frustration was to target ES6.  I found next that Vue's default build assumes packages in the `node_modules` folder to be compiled to ES5.  So you'll run into this error:

```text
TypeError : Class constructor BaseModel cannot be invoked without 'new'
```

This error was fixed by adding `feathers-vuex` to the `transpileDependencies` in the `vue.config.js` file:

```js
module.exports = {
  transpileDependencies: ['feathers-vuex']
}
```

It felt like everything was solved until I ran the production build.  There were more errors.  I finally copied the `feathers-vuex` folder from `node_modules` into a `src/libs` folder in my project.  Voila!  It all works.  So I'm currently running this code in production by using a shell script to copy it inside my project.

```bash
rm -rf src/libs
mkdir src/libs

# feathers-vuex
cp -r node_modules/feathers-vuex/dist src/libs/feathers-vuex
```

Then in my `package.json` scripts:

```json
{
  "copy": ". ./copy-deps.sh",
  "serve": "npm run copy && vue-cli-service serve",
  "build": "npm run copy && vue-cli-service build",
  "postinstall": "npm run copy"
}
```

I don't consider the above solution to be a pretty one.  I likely will not publish 2.0 until a solution is discovered which doesn't required copying from `node_modules`.  I know it's got to be simple.  It's has something to do with transpile settings for `node_modules`.  I just haven't found it yet.

## Here's what's new in `feathers-vuex`

Check out the tests for the best documentation.  They've been reorganized.  This is still a Work in Progress.

## Changes to Initialization

1. To assist in connecting with multiple FeathersJS API servers, a new `serverAlias` option is now available.  Starting with version `2.0.0-pre.79`, the default value is `api`, so you only need to provide this if you want to connect to a second API.
2. The exports have changed.
   - (a) A new `BaseModel` is available.  This is the base `FeathersVuexModel` which contains the model methods. Feel free to extend it and make it fit your awesome services!
   - (b) The `service` method has been renamed to `makeServicePlugin`.
   - (c) The `auth` method is now called `makeAuthPlugin`
   - (d) The `models` object is now exported, so you can access them from anywhere.  They are keyed by `serverAlias`.
   - (e) A new `clients` object is available. The intention is to allow working with multiple FeathersJS API servers.
3. You no longer pass a `servicePath` to create a service-plugin. Instead, pass the actual Feathers service.
4. Since you can customize the Model, you also pass the extended Model into the `makeServicePlugin` method.

Below is an all-in-one example of a the basic configuration steps.  See the next section for how to setup a project.

```js
// ./src/store/store.js
import feathers from './feathers-client'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'

const {
  BaseModel,         // (2a)
  makeServicePlugin, // (2b)
  makeAuthPlugin,    // (2c)
  models,            // (2d)
  clients            // (2e)
} = feathersVuex(feathers, {
  idField: '_id',
  serverAlias: 'api' // (1) optional as of version 2.0.0-pre.79
})

class Todo extends BaseModel {
  // required
  constructor (data, options) {
    super(data, options)
  }
  // required
  static modelName = 'Todo'

  // optional, but useful
  static instanceDefaults(data) {
    return {
      name: '',
      isComplete: false,
      userId: null,
      user: null // populated on the server
    }
  }

  // optional, but useful
  static setupInstance(data) {
    if (data.user) {
      data.user = new models.myApi.User(data.user)
    }
    return data
  }
  // customize the model as you see fit!
}

const todosPlugin = makeServicePlugin({
  Model: Todo, // (3)
  service: feathers.service('todos') // (4)
})

const store = new Vuex.Store({
  plugins: [
    todosPlugin
  ]
})
```

## Setting up a project

There are four steps to setting up the entirety of `feathers-vuex`:

1. Setup the FeathersJS Client.
2. Setup each Service plugin
3. Setup the Auth plugin
4. Register all plugins with Vuex

### Setup the FeathersJS Client

It's now recommended that the FeathersJS and client live together in the same file.  This cleans up imports when setting up services.  So let's start with the `feathers-client.js` file.  I usually put this in `src/feathers-client.js`, but you can put it in the store folder if you want.

```js
// src/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import authClient from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import feathersVuex from 'feathers-vuex' // or '@/libs/feathers-vuex' if you're copying feathers-vuex as mentioned earlier.

// Setup the Feathers client
const host = process.env.VUE_APP_API_URL // or set a string here, directly
const socket = io(host, { transports: ['websocket'] })
const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(authClient({ storage: window.localStorage }))

export default feathersClient

// Setup feathers-vuex
const {
  makeServicePlugin,
  makeAuthPlugin,
  BaseModel,
  models,
  clients,
  FeathersVuex
} = feathersVuex(feathersClient, {
  serverAlias: 'api', // or whatever that makes sense for your project
  idField: '_id' // `id` and `_id` are both supported, so this is only necessary if you're using something else.
})

export {
  makeAuthPlugin,
  makeServicePlugin,
  BaseModel,
  models,
  clients,
  FeathersVuex
}

```

Now that we have setup the client, we can use the configured exports in each of our services.

### Setup the Services Plugins

Now let's setup a Vuex plugin for each service. I use Webpack's `require.context` to automatically import all of the services instead of explicitly typing them all.  So, I'll put the services in the `src/store/services` folder.

```js
// Bring in the imports from the feathers-client.js file.
import feathersClient, {
  makeServicePlugin,
  BaseModel
} from '../../feathers-client'

// Extend the base class
class User extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  static modelName = 'User'
  static instanceDefaults() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    }
  }
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}
const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath
})

// Optionally add service-level hooks, here:
feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
})

export default servicePlugin

```

Once the service plugin is exported, we can register it with Vuex, but first let's setup the auth plugin.

### Setup the Auth Plugin

We'll use the `makeAuthPlugin` method to tell the auth plugin where to find our `/users` service:

```js
// src/store/store.auth.js
import feathersClient, { makeAuthPlugin } from '../feathers-client'

export default makeAuthPlugin({ userService: 'users' })

```

Once you've added the export, we're finally ready to setup the store.

### Register all plugins with Vuex

The final step is to add all of the plugins to the Vuex store.

```js
// src/store/store.js
import Vue from 'vue'
import Vuex from 'vuex'
import { FeathersVuex } from 'feathers-vuex'
import auth from './store.auth'

Vue.use(Vuex)
Vue.use(FeathersVuex)

// Require the entire folder of service plugins with Webpack
const requireModule = require.context( './services', false, /.js$/ )
const servicePlugins = requireModule
  .keys()
  .map(modulePath => requireModule(modulePath).default)

// Or you can import them manually for Rollup, etc.
import users from './services/users'

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  plugins: [
    ...servicePlugins, // if you're using require.context, spread the plugins into the array.
    users, // if you're manually importing, just add the plugins into the array, like this
    auth
  ]
})

```

With the above four steps accomplished, the base of most any application using `feathers-vuex` is ready to build something awesome!

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

## No more `instance.isFeathersVuexInstance` property

The `isFeathersVuexInstance` property has been removed from all instances and clones.  This could be a breaking change in your project if you were specfically depending on the property to check for instances.  You can check if an object is an instance using `instanceof`:

```js
// Assuming you've already registered a few plugins with Model classes.
import { models } from 'feathers-vuex'
const todo = new models.myApi.Todo({ description: 'test' })

assert(todo instanceof models.myApi.Todo) // <--- true
```

## Better default `idField` support

Since records are keyed by id, `feathers-vuex` needs to know what the `idField` is for each service.  In the last version, the default was `id`, and you had to specify something different.  This version supports `id` and `_id` with zero configuration.  You only need to set `idField` when you're using something other than `id` or `_id`.

There's still a warning message when records don't have a property matching the `idField`.  Just like in the last version, it only appears when you turn on `debug: true` in the options.

## Support for Temporary Records

Feathers-Vuex 2.0 supports tracking temporary items and automatically assigns a temporary id to new records. It also adds the records to `state.tempsById`.  This is customizable using the `tempIdField` option.

Because of the new ability to handle temporary records, a message is only logged when assigning a temporary id to a record.  The `checkId` utility function has been removed, since this was its main purpose.

## Getters Work with Temporary Records

The `find` getter has been updated to include records from `state.tempsById`, by default.  You can pass `temps: false` in the params to only search `state.keyedById`: `find({ query: {}, temps: false })`

The `get` getter has also been updated to work with temp ids.  Pass the tempId the way you normally would pass the id:  `get(tempId)`

## The "currentItem" workflow is no longer supported

The `setCurrent` mutation and `currentId` state encouraged use of a very limiting API.  It's much more common for apps to require more than one current record.  The `createCopy`, `resetCopy` (formerly called `rejectCopy`), `commitCopy`, and `clearCopy` mutations (since v1.x) provide a more flexible solution for implementing the same functionality.  As a result of this, following have been removed from the modules:

- state: `currentID`
- getters: `current`
- mutations: `setCurrent`, `clearList`, `copy`

## The `diffOnPatch` option has been removed

(See the next section for its replacement.)

I have not been able to find a diffing algorithm that works equally well acroos all schemas.  It's especially difficult for nested schemas.  Because of this, `diffOnPatch` is no longer a global option.  It is being replaced by the `diffOnPatch` static Model method. See the next section.

## Model Classes: BYOD (Bring Your Own Diffing)

First, why do any diffing?  On the API server, an `update` request replaces an entire object, but a `patch` request only overwrites the attributes that are provided in the data.  For services with simple schemas, it doesn't really matter.  But if your schema grows really large, it can be supportive to only send the updates instead of the entire object.

A new `diffOnPatch` method is available to override in your extended models.  `diffOnPatch` gets called just before sending the data to the API server.  It gets called with the data and must return the diffed data.  By default, it is set to `diffOnPatch: data => data`.

Below is an example of how you might implement `diffOnPatch`.  You would only ever use this with a cloned instance, otherwise there's nothing to diff.

```js
import { diff } from 'deep-object-diff'
const { makeServicePlugin, BaseModel } = feathersVuex(feathers, { serverAlias: 'myApi' })

class Todo extends BaseModel {
  public constructor (data, options?) {
    super(data, options)
  }
  public static modelName = 'Todo'
  public static diffOnPatch (data) {
    const originalObject = Todo.store.state.keyedById[data._id]
    return diff(originalObject, data)
  }
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

## The `modelName` option has moved

While the original intent was to completely remove the `modelName` option, it's still required after transpiling to ES5.  This is because during transpilation, the class name gets stripped and can't be put back into place.  Since ES5 is the default target for most build environments, the `modelName` is still required to be specified, but it has been moved.  Instead of being an option, it's required as a static property of each class.

Note: Once ES6 is the default target for most build systems, modelName will become optional.  For future upgradability, it's recommended that you give your `modelName` the exact same name as your model class.

```js
const { makeServicePlugin, BaseModel } = feathersVuex(feathers, { serverAlias: 'myApi' })

class Todo extends BaseModel {
  public constructor (data, options?) {
    super(data, options)
  }
  public static modelName = 'Todo' // modelName is required on all Model classes.
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

Feathers-Vuex now includes full support for communicating with multiple FeathersJS APIs.  The `apiPrefix` option was a poorly-implemented, hacky, first attempt at this same feature.  Since it didn't work as intended, it has been removed.  See this example test for working with multiple APIs:

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

## Services are no longer set up, internally

You no longer just pass a servicePath.  Instead, create the service, then pass the returned service object.

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

## `instanceDefaults` must be a function

In the previous version, you could specify instanceDefaults as an object.  It was buggy and limiting.  In this new version, `instanceDefaults` must always be a function.  See the next section for an example.

## Getter and Setter props go on the Model classes

One of the great features about using Model classes is data-level computed properties.  You get to specify computed properties directly on your data structures instead of inside components, which keeps a better separation of concerns.  In `feathers-vuex@2.x`, since we have direct access to the Model classes, it's the perfect place to define the computed properties:

```js
import feathersClient, {
  makeServicePlugin,
  BaseModel
} from '../../feathers-client'

class User extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  static modelName = 'User' // required
  // Computed properties don't go on in the instanceDefaults, anymore.
  static instanceDefaults() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isAdmin: false,
    }
  }
  // Here's a computed getter
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
  // Probably not something you'd do in real life, but it's an example of a setter.
  set fullName(fullName) {
    const [ firstName, lastName ] = fullName.split(' ')
    Object.assign(this, { firstName, lastName })
  }
}
const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath
})
```

## Relationships have been separated from `instanceDefaults`

Feathers-Vuex 2.0 has a new API for establishing relationships between data.  Before we cover how it works, let's review the old API.

Feathers-Vuex 1.x allowed using the `instanceDefaults` API to both setup default values for Vue reactivity AND establishing relationships between services.  It supported passing a string name that matched a model name to setup a relationship, as shown in this next example.  This was a simple, but very limited API:

```js
// The old way
instanceDefaults: {
  _id: '',
  description: '',
  isCompleted: false,
  user: 'User'
}
```

Any instance data with a matching key would overwrite the same property in the instanceDefaults, which resulted in an inconsistent API.

In Feathers-Vuex 2.0, the `instanceDefaults` work the same for setting defaults with only one exception:  They no longer setup the relationships.  The new `setupInstance` function provides an API that is much more powerful.

As mentioned earlier, it MUST be provided as a function:

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

Notice in the above example that we did not return `user`.  Relationships are now handled in the `setupInstance` method.

Where `instanceDefaults` props get overwritten with instance data, the props returned from `setupInstance` overwrite the instance data.  If it were using `Object.assign`, internally (it's not, but IF it were), it would look like the below example, where `data` is the original instance data passed to the constructor.

```js
Object.assign({}, instanceDefaults(data), data, setupInstance(data))
```

## Define Relationships and Modify Data with `setupInstance`

The new `setupInstance` method allows a lot of flexibility in creating new instances.  It has the exact same API as the `instanceDefaults` method.  The only difference is the order in which they are applied to the instance data.

Although it looks similar to `instanceDefaults`, it can't be used for default values.  This is because it overwrites instance data. Having separate methods allows a clean separation between setting up defaults and establishing relationships with other constructors.

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
  return data
}
```

Or below is an example that does the exact same thing with one line per attribute:

```js
function setupInstance(data, { models, store }) {
  const { User } = models.myServerAlias

  Object.assign(data, {
    ...(data.user && { user: new User(data.user) }), // A single User instance
    ...(data.tags && { tags: data.tags.map(t => new Tag(t)) }), // An array of Tag instances
    ...(data.createdAt && { createdAt: new Date(data.createdAt) }) // A JavaScript Date Object
  })
  return data
}
```

Where `instanceDefaults` props get replaced by instance data, the props returned from `setupInstance` overwrite the instance data.  If it were using `Object.assign`, internally (it's not, but IF it were), it would look like the below example, where `data` is the original instance data passed to the constructor.

```js
Object.assign({}, instanceDefaults(data), data, setupInstance(data))
```

## Preventing duplicate merge when extending BaseModel with a custom constructor

The BaseModel constructor calls `mergeWithAccessors(this, newData)`.  This utility function correctly copies data between both regular objects and Vue.observable instances.  If you create a class where you need to do your own merging, you probably don't want `mergeWithAccessors` to run twice.  In this case, you can use the `merge: false` BaseModel ___instance option___ to prevent the internal merge.  You can then access the `mergeWithAccessors` method by calling `MyModel.merge(this, newData)`.  Here's an example:

```ts
const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'myApiServer'
})

class Todo extends BaseModel {
  public constructor(data, options?) {
    options.merge = false // Prevent the internal merge from occurring.
    super(data, options)

    // ... your custom constructor logic happens here.

    // Call the static merge method to do your own merging.
    Todo.merge(this, data)
  }
}
```

It's important to note that setting `merge: false` in the options will disable the `setupinstance` function.  You need to manually call it, like this:

```ts
class Todo extends BaseModel {
  public constructor(data, options?) {
    options = options || {}
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
}
```

## Customizing the BaseModel

Because we have access to the BaseModel, we can extend it to do whatever custom stuff we need in our application.  The `feathers-client.js` file is a great, centralized location for accomplishing this:

```js
// src/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import authClient from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import feathersVuex from 'feathers-vuex' // or '@/libs/feathers-vuex' if you're copying feathers-vuex as mentioned earlier.

// Setup the Feathers client
const host = process.env.VUE_APP_API_URL // or set a string here, directly
const socket = io(host, { transports: ['websocket'] })
const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(authClient({ storage: window.localStorage }))

export default feathersClient

// Setup feathers-vuex
const {
  makeServicePlugin,
  makeAuthPlugin,
  BaseModel,
  models,
  clients,
  FeathersVuex
} = feathersVuex(feathersClient, {
  serverAlias: 'api', // or whatever that makes sense for your project
  idField: '_id' // `id` and `_id` are both supported, so this is only necessary if you're using something else.
})

// Note that if you want to
// extend the BaseClass for the rest of the app, this is a great place to do it.
// After you've extended the BaseClass with your CustomClass, export it, here.
class CustomBaseModel extends BaseModel {
  // Optionally add custom functionality for all services, here.
}

// Export all of the utilities for the rest of the app.
export {
  makeAuthPlugin,
  makeServicePlugin,
  BaseModel,
  models,
  clients,
  FeathersVuex,
  CustomBaseModel // Don't forget to export it for use in all other services.
}

```
