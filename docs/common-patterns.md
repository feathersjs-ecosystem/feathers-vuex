---
title: Common Patterns
---

## Set the `idField`

If you have a "WTF this isn't working" moment while setting up a new service, make sure you've set the `idField` property on your service.  In `feathers-vuex@1.x`, the `id` is the default `idField`.  You have to manually set `_id`.  Starting in `feathers-vuex@2.x`, both the `id` and `_id` fields are supported without any configuration, so you only set the `idField` when your service uses something else.

## Enable debugging

You can set `debug: true` in the options to enable some logging to assist with debugging.

## Use the `<FeathersVuexFind>` and `<FeathersVuexGet>` components

Using the new `<FeathersVuexFind>` and `<FeathersVuexGet>` components provides concise access to the best features of `feathers-vuex`, including live queries, reactive lists, custom pagination tracking per component, and fall-through cacheing of local data in the Vuex store.  Check out the [Renderless Data Components](./components.html) docs for more details.

## Use the `makeFindMixin` and `makeGetMixin` utilities

The mixin utilities provide the same functionality as the components, but with more power and flexibility.  Check out the [Mixin docs](./mixins.html) for more details.

## Working with TypeScript

As of version 2.0, Feathers-Vuex has been rewritten in TypeScript.

See [this issue](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/114) for suggestions for with TypeScript helpers.

In version 3.0, support for the [Vue Composition API](https://github.com/vuejs/composition-api) was added in the form of the `useFind` and `useGet` utilities.  These new utilities provide the best experience for working with TypeScript.  This is due to two things:

1. Better general TypeScript support in the Vue Composition API.
1. Consistent object-key naming and types in the new utilities.

Read more about how to use them in the [Feathers-Vuex Composition API Docs](./composition-api.md)

## Clearing data upon user logout

The best solution is to simply refresh to clear memory.  The alternative to refreshing would be to perform manual cleanup of the service stores.  Refreshing is much simpler, so it's the officially supported solution.  Feel free to read [this issue](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/10) for more suggestions.

## Accessing the store from hooks

Because the service's Model [is available](./service-plugin.html#The-FeathersClient-Service) at `service.FeathersVuexModel`, you can access the store inside hooks.  This is especially handy if you have some custom attributes in a paginated server response.

As an example, this `speeding-tickets` service has a `summary` attribute that comes back in the response.  We can

```js
import { makeServicePlugin, BaseModel } from '../feathers-client'

class SpeedingTicket extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'SpeedingTicket'
  // Define default properties here
  static instanceDefaults() {
    return {
      vin: '',
      plateState: ''
    }
  }
}
const servicePath = 'speeding-tickets'
const servicePlugin = makeServicePlugin({
  Model: SpeedingTicket,
  service: feathersClient.service(servicePath),
  servicePath,
  mutations: {
    handleSummaryData (state, summaryData) {
      state.mostRecentSummary = summaryData
    }
  }
})

feathersClient.service(servicePath)
  .hooks({
    after: {
      find: [
        context => {
          const { service, result } = context

          if (result.summary) {
            service.FeathersVuexModel.store.commit('handleSummaryData', result.summary)
          }
        }
      ]
    }
  })
```

## Handling custom server responses

Sometimes your server response may contain more attributes than just database records and pagination data.  You could handle this directly in a component, if it's only needed in that one component,  But, if you need it in multiple components, there are better options.

Depending on what you need to do, you may be able to solve this by [accessing the store from hooks](#Accessing-the-store-from-hooks).  But that solution won't handle a scenario where you need the response data to be already populated in the store.

If you need the response data to already be in the store, you can use the [`afterFind` action](./service-plugin.html#afterFind-response).  Here's what this looks like:

```js
import { makeServicePlugin, BaseModel } from '../feathers-client'

class SpeedingTicket extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'SpeedingTicket'
  // Define default properties here
  static instanceDefaults() {
    return {
      vin: '',
      plateState: ''
    }
  }
}
const servicePath = 'speeding-tickets'
const servicePlugin = makeServicePlugin({
  Model: SpeedingTicket,
  service: feathersClient.service(servicePath),
  servicePath,
  actions: {
    afterFind ({ commit, dispatch, getters, state }, response) {
      if (response.summary) {
        commit('handleSummaryData', response.summary)
      }
    }
  },
  mutations: {
    handleSummaryData (state, summaryData) {
      state.mostRecentSummary = summaryData
    }
  }
})
```

## Reactive Lists with Live Queries

Using Live Queries will greatly simplify app development.  The `find` getter enables this feature.  Here is how you might setup a component to take advantage of them.  The next example shows how to setup two live-query lists using two getters.

```js
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'some-component',
  computed: {
    ...mapState('appointments', { areAppointmentsLoading: 'isFindPending' }),
    ...mapGetters('appointments', { findAppointmentsInStore: 'find' } ),
    // Query for future appointments
    queryUpcoming () {
      return { date: { $gt: new Date() }}
    },
    // Query for past appointments
    queryPast () {
      return { date: { $lt: new Date() }}
    },
    // The list of upcoming appointments.
    upcomingAppointments () {
      return this.findAppointmentsInStore({ query: this.queryUpcoming }).data
    },
    // The list of past appointments
    pastAppointments () {
      return this.findAppointmentsInStore({ query: this.queryPast }).data
    }
  },
  methods: {
    ...mapActions('appointments', { findAppointments: 'find' })
  },
  created () {
    // Find all appointments. We'll use the getters to separate them.
    this.findAppointments({ query: {} })
  }
}
```

in the above example of component code, the `upcomingAppointments` and `pastAppointments` will automatically update.  If a new item is sent from the server, it will get added to one of the lists, automatically.  `feathers-vuex` listens to socket events automatically, so you don't have to manually wire any of this up!

## Organizing the services in your project

You can use the file system to organize each service into its own module. This is especially useful in organizing larger-sized projects.  Here's an example `store.js`.  It uses Webpack's require.context feature save repetitive imports:

```js
import Vue from 'vue'
import Vuex from 'vuex'
import { FeathersVuex } from '../feathers-client'
import auth from './store.auth'

Vue.use(Vuex)
Vue.use(FeathersVuex)

const requireModule = require.context(
  // The path where the service modules live
  './services',
  // Whether to look in subfolders
  false,
  // Only include .js files (prevents duplicate imports`)
  /.js$/
)
const servicePlugins = requireModule
  .keys()
  .map(modulePath => requireModule(modulePath).default)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  plugins: [...servicePlugins, auth]
})
```

With the `store.js` file in place, we can start adding services to the `services` folder.

- [Learn how to setup a Vuex plugin for a Feathers service.](/api-overview.html#service-plugins)
- [Learn how to setup the feathers-client.js file](/api-overview.html)
- [Learn how to setup the auth plugin](/api-overview.html#auth-plugin)

## Actions return reactive store records

Previously, when you directly used the response from an action, the individual records were not reactive.  This meant that these plain objects wouldn't update when you updated the matching record in the store.

```js
methods: {
  ...mapActions('todos', { findTodos: 'find' })
},
created () {
  this.findTodos({ query: {} })
    .then(response => {
      const todos = response.data || response
      // Suppose firstTodo has an id of 'todo-1'
      const firstTodo = todos[0]

      // Now, when you update the data in the store...
      this.$store.state.todos.keyedById['todo-1'].description = 'Updated description'

      // ... the instance in the `find` response also updates.  Yay!
      console.log(firstTodo.description) // --> 'Updated description'
    })
}
```

This is a super convenient feature, and it works with all actions (except remove, of course) But be aware that **only the individual records returned are reactive**.  The lists, themselves, are not reactive.  So if another record comes in from the server that matches the query, the list will not update.  For reactive lists, you must use the `find` getter, as shown in the following example.

```js
computed: {
  ...mapGetters('todos', { findTodosInStore: 'find' })
  todos () {
    return this.findTodosInStore({ query: {} }).data
  }
},
methods: {
  ...mapActions('todos', { findTodos: 'find' })
},
created () {
  this.findTodos({ query: {} })
    .then(response => {
      // In the find action, the 'todos' array is not a reactive list, but the individual records are.
      const todos = response.data || response
    })
}
```

In the above example, the computed `todos` will be a reactive list.  This means that when new records are added to the store, the list of todos will automatically update in the UI to include the new data.

In summary, you can plan on individual records in the action response data to be reactive, but if you need the actual arrays to be reactive to live queries, use the 'find' getter.

## Basic Data Modeling with `instanceDefaults`

See the [instanceDefaults API](./model-classes.html#instancedefaults)

## Handling Non-Reactive Data

If you are encountering a scenario where certain properties in your records are not reactive, it's probably because they

1. Are not defined in the `instanceDefaults`.
2. Are getting added to the record after it gets added to the Vuex store.

There are two ways to solve this:

1. Add the property to the `instanceDefaults` (see the previous section, above)  This tends to be the simplest solution.
2. Make sure the property is added in the responses from the API server.

## Model-Specific Computed Properties

You may find yourself in a position where model-specific computed properties would be very useful. [github issue](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/163).  In Feathers-Vuex 1.7, these could be specified in the `instanceDefaults`.  As of 2.0, they are specified directly on each Model class:

```js
class Post extends BaseModel {
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'Post'
  // Define default properties here
  static instanceDefaults() {
    return {
      description: '',
      isComplete: false,
      comments: [],
    }
  }

  // Specify computed properties as regular class properties
  get numberOfCommenters () {
      // Put your logic here.
  },
  set someOtherProp () {
      //  Setters also work
  }
}
```

## Relationships for Populated Data

A common task with almost any API is properly handling relationships between endpoints.  Imagine an API where you have `/todos` and `/users` services.  Each todo record can belong to a single user, so a todo has a `userId`.

```js
// GET todos/1
{
  id: 1,
  description: 'Learn about the health benefits of a low-carb diet.',
  isComplete: false,
  userId: 5
}
```

And a user response looks like this:

```js
// GET users/5
{
  id: 5,
  name: 'Marshall',
  username: 'marshallswain'
  email: 'marshall@ilovehealthy.com'
}
```

Suppose a requirement is put on the `/todos` service to populate the `user` in the response.  (As a super handy side note, this task is pretty easy when using [Matt Chaffe's](https://github.com/mattchewone) magical, efficient [feathers-shallow-populate hook](https://www.npmjs.com/package/feathers-shallow-populate))  So now the todo response looks like this:

```js
{
  id: 1,
  description: 'Learn about the health benefits of a low-carb diet.',
  isComplete: false,
  userId: 5,
  user: {
    id: 5,
    name: 'Marshall',
    username: 'marshallswain'
    email: 'marshall@ilovehealthy.com'
  }
}
```

Can you see the problem that will occur with this response?  When this record is put into the `/todos` store, it will contain a copy of the user record.  But we already have the user record in the `/users` store.  And what happens when the user data changes?  Now it's out of sync.  To keep it in sync, you might have to manually listen for `users updated` & `users patched` events.  Then you might have to write a custom mutation to update the user record attached to every applicable `todo` record.  This gets messy, fast!

There's an easier way to solve this problem. Use the new [`setupInstance` method on Model classes](/model-classes.html#setupinstance).

```js
import feathersClient, { makeServicePlugin, BaseModel } from '../feathers-client'

class Todo extends BaseModel {
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'Todo'
  // Define default properties here
  static instanceDefaults() {
    return {
      email: '',
      password: ''
    }
  }
  // Updates `data.user` to be an instance of the `User` class.
  static setupInstance(data, { models }) {
    if (data.user) {
      data.user = new models.api.User(data.user)
    }
    return data
  }
}

const servicePath = 'todos'
const servicePlugin = makeServicePlugin({
  Model: Todo,
  service: feathersClient.service(servicePath),
  servicePath
})
```

When this record is instantiated, the `user` attribute will first be turned into a User [model instance](./model-classes.html), stored properly in the `/users` store. The `todo.user` attribute will be a reference to that user.  No more duplicate data!  Here's an example of how to set this up.

There's another amazing benefit from these relationships.  Because `feathers-vuex` listens to real-time events and keeps data up to date, when the user record changes, the `todo.user` automatically updates!

### Workflow for Saving Model Associations

A great issue was opened on GitHub about the [Workflow for clone and save Model with associations](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/278).  That's a great issue to read to get familiar with the workflow.

## Form Binding

Use the Model classes to reduce the boilerplate required to work with forms and Vuex, even in strict mode!  Every model instance has a `.clone()` method which can be used to get a fully-reactive copy of the record in the store.  Here is a very simple version of how you could bind to a form and submit new data to the server.

```vue
<template>
  <div class="bg-white h-full p-6">
    <h1>Create Todo</h1>

    <form @submit.prevent="createTodo">
      <input v-model="clone.name" type="text" class="form-input" />
      <button
        type="submit"
        class="bg-blue-500 px-4 py-2 rounded text-white ml-2"
      >
        Create Todo
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Todos',
  mixins: [makeFindMixin({ service: 'todos', watch: true })],
  data: () => ({
    todo: null,
    clone: null
  }),
  computed: {
    todosParams() {
      return {
        query: {},
        paginate: false
      }
    }
  },
  created() {
    const { Todo } = this.$FeathersVuex.myApi
    this.todo = new Todo({})
    this.clone = this.todo.clone()
  },
  methods: {
    async createTodo() {
      try {
        const todo = await this.clone.save()
        console.log(todo)
      } catch (error) {
        console.log(error)
      }
    },
    updateTodo(ev, todo) {
      todo.isComplete = ev.target.checked
      todo.save()
    }
  }
}
</script>

<style lang="postcss"></style>
```

## Multiple Copies

The previous version of `feathers-vuex` was hard-coded to allow for a single `current` record and one copy.  It was pretty easy to hit that limit.  This new release allows for keeping many more copies, one copy per stored record.  To make it easier to comply with Vuex's `strict` mode, copies are not kept in the store by default, but are instead kept on `Model.copiesById`.  You can make changes to the copies without having to make custom mutations, then you can commit them back into the store:

```js
const { Todo } = this.$FeathersVuex

// Create two records in the store (since they have ids, they get stored)
const todo = new Todo({ id: 1, description: 'Become more aware of others.'})
const todo2 = new Todo({ id: 2, description: 'Heal one ailments through healthy eating.'})

// Create a deep-cloned copies in Todo.copiesById
const todoCopy = todo.clone()
const todoCopy2 = todo2.clone()

// Try to clone a copy, and fail.
todoCopy.clone() // --> Error: You cannot clone a copy.
todoCopy2.clone() // --> Error: You cannot clone a copy.

// Modify the copies.
todoCopy.description.replace('others', 'self')
todoCopy2.description.replace('one', 'all')

// and update the original records
todoCopy.commit()
todoCopy2.commit()
```

You can use the `keepCopiesInStore` option to make this service keep all of its copies in `state.copiesById`.  Remember that to comply with Vuex `strict` mode (if that's a concern for you), you'll have to write custom mutations.  If it's not a concern (maybe you're the sole developer or whatever reason), you could technically turn off `strict` mode, enable `keepCopiesInStore`, and modify them however you desire, ignoring custom mutations.

```js
import Vue from 'vue'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'
import feathersClient from './feathers-client'

const { service, auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })

Vue.use(FeathersVuex)
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [
    service('todos', {
      keepCopiesInStore: true,
      instanceDefaults: {
        description: '',
        complete: false
      }
    })
  ]
})
```

## Enable Debug Logging

If items aren't not getting added to the store properly, try setting the `debug` option on the `makeServicePlugin` to `true`.  It enables some additional logging that may be useful for troubleshooting.

## Full nuxt example

In this example we will create a nuxt configuration with all the features discribed in the [Nuxt Section](./nuxt.md).

Our application is hosted in 2 different endpoints, one for the feathers api and another with our nuxt SSR, and we will also implement a permission system that will prevent users without an `admin` permission to get into some pages. For that you will need to [customize your payload](https://docs.feathersjs.com/cookbook/authentication/stateless.html#customizing-the-payload) in your feathers api.

```js
// nuxt.config.js
export default {
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3030'
  },
  router: {
    middleware: [
      'feathers'
    ]
  },
  plugins: [
    { src: '~/plugins/feathers-vuex.js' }
  ],
  modules: [
    'nuxt-client-init-module'
  ],
  build: {
    transpile: [
      'feathers-vuex'
    ]
  }
}
```

The `feathers` middleware will redirect any user in a non public page to the login, but will also redirect a loged user away from any public pages.

```js
// ~/middleware/feathers.js
export default function ({ store, redirect, route }) {
  const { auth } = store.state
  if (auth.publicPages.length > 0 && !auth.publicPages.includes(route.name) && !auth.payload) {
    return redirect('login')
  } else if (auth.publicPages.length > 0 && auth.publicPages.includes(route.name) && auth.payload) {
    return redirect('feed')
  }
}
```

The `admin` middleware will redirect any user that is not loged in or do not have the `admin` permission to a `not-permited` page.

```js
// ~/middleware/admin.js
export default function ({ store, redirect }) {
  const { auth } = store.state
  const permissions = auth.payload.permissions
  if (
    !auth.payload ||
    !permissions.includes('admin')
  ) {
    return redirect('/not-permited')
  }
}
```
Add the `admin` middleware to the administrative pages

```js
// ~/pages/**
export default {

  ...

  middleware: ['admin']

  ...

}
```

In the feathers client configuration we will use a different transport for the nuxt-server > api comunication and the nuxt-client > api. When we are making request on the server we do not need the socket io realtime messaging system so we can use an rest configuration for better performance.

```js
// ~/plugins/feathers.js
import feathers from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { CookieStorage } from 'cookie-storage'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex, { initAuth, hydrateApi } from 'feathers-vuex'
// Get the api url from the environment variable
const apiUrl = process.env.API_URL
let socket
let restClient
// We won't use socket to comunicate from server to server
if (process.client) {
  socket = io(apiUrl, { transports: ['websocket'] })
} else {
  restClient = rest(apiUrl)
}
const transport = process.client ? socketio(socket) : restClient.axios(axios)
const storage = new CookieStorage()

const feathersClient = feathers()
  .configure(transport)
  .configure(auth({ storage }))
  .hooks({
    before: {
      all: [
        iff(
          context => ['create', 'update', 'patch'].includes(context.method),
          discard('__id', '__isTemp')
        )
      ]
    }
  })

export default feathersClient

// Setting up feathers-vuex
const { makeServicePlugin, makeAuthPlugin, BaseModel, models, FeathersVuex } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api', // optional for working with multiple APIs (this is the default value)
    idField: '_id', // Must match the id field in your database table/collection
    whitelist: ['$regex', '$options'],
    enableEvents: process.client // Prevent memory leak
  }
)

export { makeAuthPlugin, makeServicePlugin, BaseModel, models, FeathersVuex, initAuth, hydrateApi }
```

I prefere install the `FeathersVuex` plugin in a separate file, it's more consistent with nuxt patterns.

```js
// ~/plugins/feathers-vuex.js
import Vue from 'vue'
import { FeathersVuex } from './feathers'

Vue.use(FeathersVuex)
```

Configure any service you want on `~/store/services/*.js`.

```js
// ~/store/services/users.js
import feathersClient, { makeServicePlugin, BaseModel } from '~/plugins/feathers'

class User extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'User'
  // Define default properties here
  static instanceDefaults() {
    return {
      email: '',
      password: '',
      permissions: []
    }
  }
}
const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath
})

// Setup the client-side Feathers hooks.
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

Create your nuxt store with the right nuxt pattern, exporting an Vuex store will be deprecated on nuxt 3.

```js
// ~/store/index.js
import { makeAuthPlugin, initAuth, hydrateApi, models } from '~/plugins/feathers'
const auth = makeAuthPlugin({
  userService: 'users',
  state: {
    publicPages: [
      'login',
      'signup'
    ]
  },
  actions: {
    onInitAuth ({ state, dispatch }, payload) {
      if (payload) {
        dispatch('authenticate', { strategy: 'jwt', accessToken: state.accessToken })
          .then((result) => {
            // handle success like a boss
            console.log('loged in')
          })
          .catch((error) => {
            // handle error like a boss
            console.log(error)
          })
      }
    }
  }
})

const requireModule = require.context(
  // The path where the service modules live
  './services',
  // Whether to look in subfolders
  false,
  // Only include .js files (prevents duplicate imports`)
  /.js$/
)
const servicePlugins = requireModule
  .keys()
  .map(modulePath => requireModule(modulePath).default)

export const modules = {
  // Custom modules
}

export const state = () => ({
  // Custom state
})

export const mutations = {
  // Custom mutations
}

export const actions = {
  // Custom actions
  nuxtServerInit ({ commit, dispatch }, { req }) {
    return initAuth({
      commit,
      dispatch,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
  },
  nuxtClientInit ({ state, dispatch, commit }, context) {

    hydrateApi({ api: models.api })

    if (state.auth.accessToken) {
      return dispatch('auth/onInitAuth', state.auth.payload)
    }
  }
}

export const getters = {
  // Custom getters
}

export const plugins = [ ...servicePlugins, auth ]
```
