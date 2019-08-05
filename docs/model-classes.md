---
title: Models & Instances API
---

Every service now includes a new `FeathersVuexModel` Class and new records are instantiated with that class before getting added to the store.

## Model attributes

The following attributes are available on each model:

- `servicePath {String}` - `Model.servicePath` is the path passed to create the FeathersClient service.
- `namespace {String}` - `Model.namespace` holds the value that was used to register the module with Vuex. This will match the `servicePath` unless you've provided a custom namespace in the [Service Module options](./index.md#Use).
- `store {Vuex Store}` - Use `Model.store` to access the Vuex store. [example](./common-patterns.md#Accessing-the-store-from-hooks)

## Model Methods

### Model.find(params)

Model classes have a `find` method, which is a proxy to the [`find` action](./service-module.md#find-params). <Badge text="1.7.0+" />

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  Todo.find({ query: {} }).then(/* ... */)
}
```

### Model.findInStore(params)

Model classes have a `findInStore` method, which is a proxy to the [`find` getter](./service-module.md#Service-Getters).  <Badge text="1.7.0+" />

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  const todos = Todo.findInStore({ query: {} })
}
```

### Model.get(id, params)

Model classes have a `get` method, which is a proxy to the [`get` action](./service-module.md#get-id-or-get-id-params).   <Badge text="1.7.0+" />Notice that the signature is more Feathers-like, and doesn't require using an array to passing both id and params.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  Todo.get(this.id).then(/* ... */)
}
```

### Model.getFromStore(id, params)

Model classes have a `getFromStore` method, which is a proxy to the [`get` getter](./service-module.md#Service-Getters).   <Badge text="1.7.0+" /> Notice that the signature is more Feathers-like, and doesn't require using an array to passing both id and params.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  const todo = Todo.getFromStore(this.id)
}
```

## Creating instances
The [FeathersVuex plugin for Vue](./vue-plugin.md) allow convenient access to all Model constructors. You can create a Model instance by getting a reference to a Model class from the `$FeathersVuex` object:

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex
  const todo = new Todo({ description: 'Do something!' })
}
```

You can also reference this directly from the Vue module:

```js
import Vue from 'vue'

const { Todo } = Vue
const todo = new Todo({ description: 'Do something!' })
```

The examples above show instantiating a new Model instance without an `id` field. In this case, the record is not added to the Vuex store.  If you instantiate a record **with an `id`** field, it **will** get added to the Vuex store. *Note: This field is customizable using the `idField` option for this service.*

Now that we have Model instances, let's take a look at the functionality they provide. Each instance will include the following methods:

- `.save()`
- `.create()`
- `.patch()`
- `.update()`
- `.clone()`
- `.commit()`
- `.reset()`

*Remember, if a record already has an attribute with any of these method names, it will be overwritten with the method.*

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

## instanceDefaults | Object

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

With the above configuration, when you create a [`Todo` instance](./model-classes.md), it will have the attributes provided as `instanceDefaults`.  This is especially useful for binding to form data.  If the attributes aren't defined while binding, the automatic Vue reactivity won't work.  Remember to not set any of the attributes to `undefined`, but instead use `null`.  If not, the reactivity breaks, and you might spend some time wondering why your form is broken.

### A Word Of Warning

One thing to be aware of when using `instanceDefaults` as an object is that values can persist between instances and mutate separate instances. For example, when including an `Array`, changes made to one instance will affect any other instances of this model too.

Using `instanceDefaults` as an object will be deprecated in the next major version of `feathers-vuex` so it's best to stick to the function option below.

## instanceDefaults | Function  <Badge text="1.7.0+" /> <Badge text="recommended" type="warn"/>

A much more powerful API is available when you provide `instanceDefaults` as a function.  The function will be called with the following arguments and should return an instanceDefaults object.

- `data {Object}` - The instance data
- An `utils` object containing these props:
  - `store` - The vuex store
  - `Model {FeathersVuexModel}` - The current Model (the same as the current instance's constructor)
  - `Models {Object}` The `globalModels` object, which is the same as you'll find inside a component at `this.$FeathersVuex`.

This API allows for a lot of flexibility.  In the below example, each todo instance has a `get user` property.  If the instance has a `userId`, the correct user record will automatically be fetched from the store.

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
      instanceDefaults (data, { store, Model, Models }) {
        return {
          description: '',
          isComplete: false,
          userId: null,
          get user () {
            if (this.userId) {
              const user = Models.User.getFromStore(this.userId)

              // Fetch the User record if we don't already have it
              if (!user) {
                Models.User.get(this.userId)
              }

              return user
            } else {
              return null
            }
          }
        }
      }
    })
  ]
})
```

## Instance Methods

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

You might not ever need to use `.create()`, but can instead use the `.save()` method. Let `feathers-vuex` call `create` or `patch`.

```js
const { Todo } = this.$FeathersVuex
const data = { description: 'Do something!' }
const todo = new Todo(data)

todo.create() // --> Creates the todo on the server using the instance data
```

### `instance.patch(params)`

The `patch` method is a shortcut for calling the `patch` action (service method) using the instance data. The instance's id field is used for the `patch` id.  The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/api/services.html#service-methods) docs, for reference.

Similar to the `.create()` method, you might not ever need to use `.patch()` if you just use `.save()` and let `feathers-vuex` figure out how to handle it.

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
