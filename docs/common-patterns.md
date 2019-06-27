---
title: Common Patterns
---

## Set the `idField`

If you have a "WTF this isn't working" moment while setting up a new service, make sure you've set the `idField` property on your service.  In `feathers-vuex@1.x`, the `id` is the default `idField`.  You have to manually set `_id`.  Starting in `feathers-vuex@2.x`, both the `id` and `_id` fields are supported without any configuration, so you only set the `idField` when your service uses something else.

## Enable debugging

You can set `debug: true` in the options to enable some logging to assist with debugging.

## Use the `<feathers-vuex-find>` and `<feathers-vuex-get>` components

Using the new `<feathers-vuex-find>` and `<feathers-vuex-get>` components provides concise access to the best features of `feathers-vuex`, including live queries, reactive lists, custom pagination tracking per component, and fall-through cacheing of local data in the Vuex store.  Check out the [Renderless Data Components](./components.md) docs for more details.

## Use the `makeFindMixin` and `makeGetMixin` utilities

The mixin utilities provide the same functionality as the components, but with more power and flexibility.  Check out the [Mixin docs](./mixins.md) for more details.

## Working with TypeScript

See [this issue](https://github.com/feathers-plus/feathers-vuex/issues/114) for suggestions for with TypeScript helpers.

## Clearing data upon user logout

The best solution is to simply refresh to clear memory.  The alternative to refreshing would be to perform manual cleanup of the service stores.  Refreshing is much simpler, so it's the officially supported solution.  Feel free to read [this issue](https://github.com/feathers-plus/feathers-vuex/issues/10) for more suggestions.

## Accessing the store from hooks

Because the service's Model [is available](./service-module.md#The-FeathersClient-Service) at `service.FeathersVuexModel`, you can access the store inside hooks.  This is especially handy if you have some custom attributes in a paginated server response.

As an example, this `speeding-tickets` service has a `summary` attribute that comes back in the response.  We can

```js
import feathersVuex from 'feathers-vuex'
import feathersClient from '../../feathers-client'

const { service } = feathersVuex(feathersClient, { idField: '_id' })

const servicePath = 'speeding-tickets'
const servicePlugin = service(servicePath, {
  instanceDefaults: {
    vin: '',
    plateState: ''
  },
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

## Handling custom server responses.

Sometimes your server response may contain more attributes than just database records and pagination data.  You could handle this directly in a component, if it's only needed in that one component,  But, if you need it in multiple components, there are better options.

Depending on what you need to do, you may be able to solve this by [accessing the store from hooks](#Accessing-the-store-from-hooks).  But that solution won't handle a scenario where you need the response data to be already populated in the store.

If you need the response data to already be in the store, you can use the [`afterFind` action](./service-module.md#afterFind-response).  Here's what this looks like:

```js
import feathersVuex from 'feathers-vuex'
import feathersClient from '../../feathers-client'

const { service } = feathersVuex(feathersClient, { idField: '_id' })

const servicePath = 'speeding-tickets'
const servicePlugin = service(servicePath, {
  instanceDefaults: {
    vin: '',
    plateState: ''
  },
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
Using Live Queries will greatly simplify app development.  The `find` getter enables this feature.  Here's how you might setup a component to take advantage of them.  For the below example, let's create two live-query lists using two getters.

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
import feathersVuex from 'feathers-vuex'
import feathersClient from '../feathers-client'

const { auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })

Vue.use(Vuex)
Vue.use(FeathersVuex)

const requireModule = require.context(
  // The relative path holding the service modules
  './services',
  // Whether to look in subfolders
  false,
  // Only include .js files (prevents duplicate imports)
  /.js$/
)
const servicePlugins = requireModule.keys().map(modulePath => requireModule(modulePath).default)

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  modules: {},
  plugins: [
    // Use the spread operator to register all of the imported plugins
    ...servicePlugins,

    auth({ userService: 'users' })
  ]
})
```

With the `store.js` file in place, we can start adding services to the `services` folder.  Here's an example user service.  Notice that this format is a clean way to use hooks, as well.

```js
import feathersVuex from 'feathers-vuex'
import feathersClient from '../../feathers-client'

const { service } = feathersVuex(feathersClient, { idField: '_id' })

const servicePath = 'users'
const servicePlugin = service(servicePath, {
  instanceDefaults: {
    email: '',
    password: '',
    roles: [],
    firstName: '',
    lastName: '',
    get fullName () {
      return `${this.firstName} ${this.lastName}`
    }
  }
})

feathersClient.service(servicePath)
  .hooks({
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

See the [instanceDefaults API](./model-classes.md#instanceDefaults)

## Model-Specific Computed Properties

You may find yourself in a position where model-specific computed properties would be very useful. (github issue)[https://github.com/feathers-plus/feathers-vuex/issues/163]  This is already possible using es5 accessors. You can use both getters and setters inside `instanceDefaults`:

```js
export default new Vuex.Store({
  plugins: [
    service('post', {
      instanceDefaults: {
        description: '',
        isComplete: false,
        comments: [],
        get numberOfCommenters () {
            // Put your logic here.
        },
        set someOtherProp () {
            //  Setters also work
        }
      }
    })
  ]
})
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

There's an easier way to solve this problem. The introduction of `instanceDefaults` allowed for another awesome feature: Model Relationships!  To setup a relationship, specify a Model name, as a string, to any property, like this:

```js
instanceDefaults: {
  description: '',
  complete: false,
  userId: null,
  user: 'User'
}
```

When this record is instantiated, the `user` attribute will first be turned into a User [model instance](./model-classes.md), stored properly in the `/users` store. The `todo.user` attribute will be a reference to that user.  No more duplicate data!  Here's an example of how to set this up.  The following example specifies that Todo instances can have a `user` attribute that contains a `User` Model instance:

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
      instanceDefaults: {
        description: '',
        complete: false,
        userId: null,
        user: 'User'
      }
    }),
    service('users', {
      instanceDefaults: {
        email: '',
        name: ''
      }
    })
  ]
})
```

There's another amazing benefit from these relationships.  Because `feathers-vuex` listens to real-time events and keeps data up to date, when the user record changes, the `todo.user` automatically updates!

It's worth noting that this feature also supports arrays. Suppose you had `/users` and `/todos` services, and your `/users` service also returned a `todos` attribute on each record.  The setup would look like this:

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
      instanceDefaults: {
        description: '',
        isComplete: false
      }
    }),
    service('users', {
      instanceDefaults: {
        email: '',
        name: '',
        todos: 'Todo'
      }
    })
  ]
})
```

With the `instanceDefaults` shown above, any `todos` returned on the `users` service would be stored in the `/todos` service store and would always be Todo instances.


## Reactive User Data in Auth Store
The `user` record in the auth store is now fully reactive and will automatically update with real-time events.  In fact, the record in the auth store is the record in the users store.  Please note that if you configure the `userService` option on the `auth` plugin, you must also use the `service` plugin for the `/users` service.  The paths must match:

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
    service('users'),
    auth({
      userService: 'users'
    })
  ]
})
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

If items aren't not getting added to the store properly, try setting the `debug` option on the service.  It enables some additional logging that may be useful:

```
service('todos', {
  debug: true
})
```
