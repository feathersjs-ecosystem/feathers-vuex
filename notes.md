This paves the way for using Model classes.  It is 99.9% API-compatible with version 1.0.

# Enhancements in this version

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

## The `feathers-vuex` Vue Plugin
This `feathers-vuex` release includes a Vue plugin which gives all of your components easy access to the exciting new Models feature.  Here's how to use the plugin:

```js
import Vue from 'vue'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'
import feathersClient from './feathers-client'

// Get a reference to the FeathersVuex plugin
const { service, auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })

// Register the plugin with Vue.
Vue.use(FeathersVuex)
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [
    service('todos')
  ]
})
```

Now, in your components, you'll have access to the `this.$FeathersVuex` object, which contains references to the Model classes, keyed by name.  The name of the model class is automatically inflected to singular, initial caps, based on the last section of the service path (split by `/`).  Here are some examples of what this looks like:

| Service Name              | Model Name in `$FeathersVuex` |
| ------------------------- | ----------------------------- |
| /cart                     | Cart                          |
| /todos                    | Todo                          |
| /v1/districts             | District                      |
| /some/deeply/nested/items | Item                          |

The `$FeathersVuex` object is available on the Vue object, directly at `Vue.$FeathersVuex`, as well as on the prototype, making it available in components:

```js
// In your Vue component
created () {
  const todo = new this.$FeathersVuex.Todo({ description: 'Do something!' })
  // `todo` is now a model instance
}
```

## Model Classes & Instances

Every service now includes a new `FeathersVuexModel` Class and new records are instantiated with that class before getting added to the store.

### Creating instances
You can create a Model instance by getting a reference to a Model class from the `$FeathersVuex` object:

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  const todo = new Todo({ description: 'Do something!' })
}
```

The example above shows instantiating a new Model instance without an `id` field. In this case, the record is not added to the Vuex store.  If you instantiate a record **with an `id`** field, it **will** get added to the Vuex store. *Note: This field is customizable using the `idField` option for this service.*

Now that we have Model instances, let's take a look at the functionality they provide. Each instance will include the following methods:

- `.save()`
- `.create()`
- `.patch()`
- `.update()`
- `.clone()`
- `.commit()`
- `.reset()`

*Remember, if a record an attribute with any of these method names, the attribute will be overwritten with the method.*

These methods give access to many of the store `actions` and `mutations`.  Using Model instances, you no longer have to use `mapActions` for `create`, `patch`, `update`, or `remove`.  You also no longer have to use `mapMutations` for `createCopy`, `commitCopy`, or `rejectCopy`.

```js
store.dispatch('todos/find', { query: {} })
  .then(response => {
    const { data } = response
    const todo = data[0]

    todo.description = 'Read Nuxt.js docs'
    todo.save() // Calls store.dispatch('todos/patch', [item.id, item, {}])
  })
```

### `instance.save(params)`

The `save` method is a convenience wrapper for the `create/patch` methods, by default. If the records has no `_id`, the `instance.create()` method will be used. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference on where params are used in each method.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  const todo = new Todo({ description: 'Do something!' })

  todo.save() // --> Creates the todo on the server.
}
```

Once the `create` response returns, the record will have an `_id`.  If you call `instance.save()` again, it will call `instance.patch()`.  Which method is used depends soletly on the data having an id (that matches the `options.idfield` for this service).

As mentioned, `save` performs either `create` or `patch`, but you can use the `preferUpdate` option to change the behavior to `create/update`.

### `instance.create(params)`

The `create` method is a shortcut for calling the `create` action (service method) using the instance data. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference.

You might not every need to use `.create()`, but can instead use the `.save()` method. Let `feathers-vuex` call `create` or `patch`.

```js
const { Todo } = this.$FeathersVuex
const data = { description: 'Do something!' }
const todo = new Todo(data)

todo.create() // --> Creates the todo on the server using the instance data
```

### `instance.patch(params)`

The `patch` method is a shortcut for calling the `patch` action (service method) using the instance data. The instance's id field is used for the `patch` id.  The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference.

Similar to the `.create()` method, you might not every need to use `.patch()` if you just use `.save()` and let `feathers-vuex` figure out how to handle it.

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.description = 'Do something else'

todo.patch() // --> Sends a `patch` request the with the id and description.
```

*Note: Currently, patch sends all data, not just what has changed. In a future update, it will only send the fields that have changed.*

### `instance.update(params)`

The `update` method is a shortcut for calling the `update` action (service method) using the instance data. The instance's id field is used for the `update` id. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference.

Use `.update()` whenever you want to completely replace the data on the server with the instance data.  You can also set the `preferUpdate` option to `true` to make `.save()` call `.update()` when an id field is present on the instance.

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.description = 'Do something else'

todo.update() // --> Sends a `update` request the with all instance data.
```

### `instance.remove(params)`

The `remove` method is a shortcut for calling the `remove` action (service method) using the instance data. The instance's id field is used for the `remove` id. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference.

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.save()
  .then(todo => {
    todo.remove() // --> Deletes the record from the server
  })
```

### `instance.clone()`

The `.clone()` method creates a deep copy of the record and stores it on `Model.copiesById`. This allows you to make changes to the clone and not update visible data until you commit or save the data.

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.

console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

There's another use case for using `.clone()`.  Vuex has a `strict` mode that's really useful in development.  It throws errors if any changes occur in the Vuex store `state` outside of mutations.  Clone really comes in handy here, because you can make changes to the clone without having to write custom Vuex mutations. When you're finished making changes, call `.commit()` to update the store. This gives you `strict` mode compliance with little effort!

Finally, if for some reason you prefer to keep the copies in the Vuex store and use custom mutations for all update, you can set the `keepCopiesInStore` option to `true`.  This will cause the copies to be stored in `state.copiesById`.

### `instance.commit()`

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.

console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

### `instance.reset()`

```js
const { Todo } = this.$FeathersVuex
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.reset() // --> Resets the record to match the one in the store.

console.log(todo.description) // --> 'Do something!'
console.log(todoCopy.description) // --> 'Do something!'
```

## Basic Data Modeling with `instanceDefaults`

Do you find yourself spending time writing defaults into your form components?  Maybe you wrote a utility for yourself or found one on npm that can do the trick for you.  That's a thing of the past.  You can now specify the default values for Model instances by using the `instanceDefaults` option when using the service plugin.  Here's what it looks like:

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
    })
  ]
})
```

With the above configuration, each `Todo` instance will have the attributes provided as `instanceDefaults`.  This is especially useful for binding to form data.  If the attributes aren't defined while binding, the automatic Vue reactivity won't work.  Remember to not set any of the attributes to `undefined`, but instead use `null`.  If not, the reactivity breaks, and you might spend some time wondering why your form is broken.

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

A requirement is put on the `/todos` service to populate the `user` in the response.  (As a super handy side note, this task is pretty easy when using [Matt Chaffe's](https://github.com/mattchewone) magical, efficient [feathers-shallow-populate hook](https://www.npmjs.com/package/feathers-shallow-populate))  So now the todo response looks like this:

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

Well, you've probably guessed by now that we've come up with an easier way to solve this problem. The introduction of `instanceDefaults` allowed for another awesome feature: Model Relationships!  To setup a relationship, specify a Model name, as a string, to any property, like this:

```js
instanceDefaults: {
  description: '',
  complete: false,
  userId: null,
  user: 'User'
}
```

When this record is instantiated, the `user` attribute will first be turned into a User model instance, stored properly in the `/users` store. The `todo.user` atribute will be a reference to that user.  No more duplicate data!  Here's an example of how to set this up.  The following example specifies that Todo instances can have a `user` attribute that contains a `User` Model instance:

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

There's another amazing benefit from these relationships.  Because `feathers-vuex` listens to real-time events and keeps data up to date, when the user record changes, the `todo.user` automatically updates.


### Multiple Copies

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