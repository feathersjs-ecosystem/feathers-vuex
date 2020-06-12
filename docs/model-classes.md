---
title: Data Modeling
sidebarDepth: 3
---

# Data Modeling with Model Classes

Feathers-Vuex 1.0 introduced some lightweight data modeling.  Every service had its own, internal `FeathersVuexModel`.  In version 2.0 this `FeathersVuexModel` is now called the `BaseModel` and is extendable, so you can add your own functionality.


## Extending the BaseModel Class

While [setting up Feathers-Vuex](/getting-started.html#feathers-client-feathers-vuex), we exported the `BaseModel` class so that we could extend it.  The below example shows how to import and extend the `BaseModel`.  Each service must now have its own unique Model class.

```js
import feathersClient, { makeServicePlugin, BaseModel } from '../feathers-client'

export class User extends BaseModel {
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'User'
  // Define default properties here
  static instanceDefaults() {
    return {
      email: '',
      password: ''
    }
  }
}

const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath
})
```

In case you're wondering, the `modelName` property is used to get around transpilation errors when using Babel with ES3 or ES5.  Babel is still installed by default in most projects and generators.  The `modelName` is used instead of the `name` property to provide a reliable name AFTER transpilation.

If you're working in an environment that doesn't support static properties on classes, you can always specify the static properties using the dot operator:

```js
class User extends BaseModel {}

User.modelName = 'User'
User.instanceDefaults = function() {
  return {
    email: '',
    password: ''
  }
}
```

### BaseModel typing

BaseModel typing gives helpful IDE autocomplete and errors when using Model classes.

Since Feathers-Vuex doesn't know what your data looks like, you will need to help define your underlying model data's interface.

By default, Model classes are `string` indexable with value of type `any`. This isn't super helpful...

```ts
// Just like before, we define our class as an extension of BaseModel
export class User extends BaseModel { /* ... */ }

// Augment the User Model interface
export interface User {
  email: string
  password: string
}
```

Now, whenever we access a `User` model, all fields defined in the interface will be available in IDE auto-complete/intellisense along with the model methods/props.

If you already have a User interface defined under a different name, just define a new interface with the same name as your Model class like so

```ts
// if our User interface already exists as UserRecord
export interface User extends UserRecord {}
```

To further enhance typing, you can augment FeathersVuex types to aid development in other parts of your app. It's important to note the differences in the following example if you do or do not setup a `serverAlias`.

```ts
// src/store/user.store.ts
import { ServiceState } from 'feathers-vuex'

export class User extends BaseModel { /* ... */ }
export interface User { /* ... */ }
const servicePath = 'users'

declare module "feathers-vuex" {
  interface FeathersVuexStoreState {
    [servicePath]: ServiceState<User>
  }

  // Only if you setup FeathersVuex without a serverAlias!!
  interface FeathersVuexGlobalModels {
    User: typeof User
  }
}

// Only if you setup FeathersVuex with a serverAlias!!
declare module "src/store" {
  interface MyApiModels {
    User: typeof User
  }
}
```

If you have setup a `serverAlias`, you need to add the following to `src/store/index.ts`.

```ts
// src/store/index.ts
export interface MyApiModels { /* Let each service augment this interface */ }
declare module "feathers-vuex" {
  interface FeathersVuexGlobalModels {
    'my-api-name': MyApiModels
  }
}
```

Replace `my-api-name` with the `serverAlias` you used when setting up FeathersVuex.

## Model attributes

The following attributes are available on each model:

- `servicePath {String}` - `Model.servicePath` is the path passed to create the FeathersClient service.
- `namespace {String}` - `Model.namespace` holds the value that was used to register the module with Vuex. This will match the `servicePath` unless you've provided a custom namespace in the [Service Module options](./index.md#Use).
- `store {Vuex Store}` - Use `Model.store` to access the Vuex store. [example](./common-patterns.md#Accessing-the-store-from-hooks)

## Model Methods

### find(params)

Model classes have a `find` method, which is a proxy to the [`find` action](./service-plugin.html#find-params). <Badge text="1.7.0+" />

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  Todo.find({ query: {} }).then(/* ... */)
}
```

### findInStore(params)

Model classes have a `findInStore` method, which is a proxy to the [`find` getter](./service-plugin.html#Service-Getters).  <Badge text="1.7.0+" />

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  const todos = Todo.findInStore({ query: {} })
}
```

### get(id, params)

Model classes have a `get` method, which is a proxy to the [`get` action](./service-plugin.html#get-id-or-get-id-params).   <Badge text="1.7.0+" /> Notice that the signature is more Feathers-like, and doesn't require using an array to passing both id and params.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  Todo.get(this.id).then(/* ... */)
}
```

### getFromStore(id, params)

Model classes have a `getFromStore` method, which is a proxy to the [`get` getter](./service-plugin.html#Service-Getters).   <Badge text="1.7.0+" /> Notice that the signature is more Feathers-like, and doesn't require using an array to passing both id and params.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  const todo = Todo.getFromStore(this.id)
}
```

### instanceDefaults  <Badge text="1.7.0+" />

`instanceDefaults(data, { store, models })`

The `instanceDefaults` API was created in version 1.7 to prevent requiring to specify data for new instances created throughout the app.  Depending on the complexity of the service's "business logic", it can save a lot of boilerplate.  Notice that it is similar to the `setupInstance` method added in 2.0.  The instanceDefaults method should ONLY be used to return default values for a new instance.  Use `setupInstance` to handle other transformations on the data.

Starting with version 2.0, `instanceDefaults` must be provided as a function.  The function will be called with the following arguments and should return an object of default properties for new instances.

- `data {Object}` - The instance data
- An `utils` object containing these props:
  - `store` - The vuex store
  - `models {Object}` The `globalModels` object, which is the same as you'll find inside a component at `this.$FeathersVuex`.

As an example, a User model class might look like this:

```js
instanceDefaults(data, { store, models }) {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isAdmin: false
  }
}
```

With the above attributes in place, you no longer have to manually specify any of the listed attributes.  You can, however, provided data to replace them.  Calling `new User({ firstName: 'Marshall' })` will create the instance with the `firstName` filled in, already.

One important note, the `isAdmin` attribute is specified in the above example in order to allow immediate binding in a form.  You would pretty much NEVER allow specifying `isAdmin` from the client and storing it on the server.  Attributes related to roles and app security should pretty much ALWAYS be written in hooks on the API server.

### setupInstance  <Badge text="2.0.0+" />

`setupInstance(data, { store, models })`

A new `setupinstance` class method is now available in version 2.0.  This method allows you to transform the data and setup the final instance based on incoming data.  For example, you can access the `models` object to reference other service Model classes and create data associations.

The function will be called during model instance construction with the following arguments and should return an object containing properties that'll be merged into the new instance.

- `data {Object}` - The instance data
- A `utils` object containing these props:
  - `store` - The vuex store
  - `models {Object}` The `globalModels` object, which is the same as you'll find inside a component at `this.$FeathersVuex`.

For an example of how you might use `setupInstance`, suppose we have two services: Users and Posts.  Assume that the API request to get a user includes their `posts`, already populated on the data.  The `instanceDefaults` allows us to convert the array of `posts` into an array of `Post` instances.

> If you're looking for a great solution for populating data to work with Feathers-Vuex, check out [feathers-graph-populate](https://feathers-graph-populate.netlify.app/).


```js
// The setupInstance method on an imaginary User model.
setupInstance(data, { store, models }) {
  if (data.posts) {
    // Turn posts into an array of Post instances
    data.posts = data.posts.map(post => new models.Post(post))
  }
  return data
}
```

With the above `setupInstance` method in place, each `User` instance now stores a direct reference to the `Post` records in the store.

### on <Badge text="2.3.0+" />

Register event handlers to listen to events.

### once <Badge text="2.3.0+" />

Register an event handler that only occurs once.

### off <Badge text="2.3.0+" />

Remove an event handler.

## Model Events <Badge text="2.3.0+" />

Model classes are EventEmitter instances which emit service events when received (technically, EventEmitter methods are mixed onto each Model class).  All FeathersJS events are supported.  Oh, and one more thing: it works with `feathers-rest` (you won't receive socket events, but you can listen for when instances are created in other parts of the app.)

Here’s an example of how to use it in a component:

```js
export default {
   created() {
      this.$FeathersVuex.api.Todo.on(‘created’, this.handleTodoCreated)
   },
   destroyed() {
      this.$FeathersVuex.api.Todo.off(‘created’, this.handleTodoCreated)
   },
   methods: {
      handleTodoCreated(todo) {
         console.log(todo)
      }
   }
}
```

Since they have all of the EventEmitter methods, Model classes can be used as a data-layer Event Bus.  You can even use custom event names:

```js
const { Todo } = this.$FeathersVuex.api

Todo.on('custom-event', data => {
  console.log(data) // { test: true }
})

Todo.emit('custom-event', { test: true })
```

## Creating instances

The [FeathersVuex plugin for Vue](./vue-plugin.md) allow convenient access to all Model constructors. You can create a Model instance by getting a reference to a Model class from the `$FeathersVuex` object:

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  const todo = new Todo({ description: 'Do something!' })
}
```

You can also reference this directly from the Vue module:

```js
import Vue from 'vue'

const { Todo } = Vue.$FeathersVuex.api
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

These methods give access to many of the store `actions` and `mutations`.  Using Model instances, you no longer have to use `mapActions` for `create`, `patch`, `update`, or `remove`.  You also no longer have to use `mapMutations` for `createCopy`, `commitCopy`, or `resetCopy`.

```js
store.dispatch('todos/find', { query: {} })
  .then(response => {
    const { data } = response
    const todo = data[0]

    todo.description = 'Read Nuxt.js docs'
    todo.save() // Calls store.dispatch('todos/patch', [item.id, item, {}])
  })
```

## Instance Methods

### `instance.save(params)`

The `save` method is a convenience wrapper for the `create/patch` methods, by default. If the records has no `_id`, the `instance.create()` method will be used. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference on where params are used in each method.

```js
// In your Vue component
created () {
  const { Todo } = this.$FeathersVuex.api
  const todo = new Todo({ description: 'Do something!' })

  todo.save() // --> Creates the todo on the server.
}
```

Once the `create` response returns, the record will have an `_id`.  If you call `instance.save()` again, it will call `instance.patch()`.  Which method is used depends soletly on the data having an id (that matches the `options.idfield` for this service).

As mentioned, `save` performs either `create` or `patch`, but you can use the `preferUpdate` option to change the behavior to `create/update`.

### `instance.create(params)`

The `create` method calls the `create` action (service method) using the instance data. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

You might not ever need to use `.create()`, but can instead use the `.save()` method. Let `feathers-vuex` call `create` or `patch`.

```js
const { Todo } = this.$FeathersVuex.api
const data = { description: 'Do something!' }
const todo = new Todo(data)

todo.create() // --> Creates the todo on the server using the instance data
```

### `instance.patch(params)`

The `patch` method calls the `patch` action (service method) using the instance data. The instance's id field is used for the `patch` id.  The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

Similar to the `.create()` method, you might not ever need to use `.patch()` if you just use `.save()` and let `feathers-vuex` figure out how to handle it.


```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.description = 'Do something else'

todo.patch() // --> Sends a `patch` request the with the id and description.
```

<Badge text="3.9.0+" /> As of version 3.9.0, you can provide an object as `params.data`, and Feathers-Vuex will use `params.data` as the patch data.  This allows patching with partial data:

```js
import { models } from 'feathers-vuex'
const { Todo } = models.api

const todo = new Todo({ description: 'Do Something', isComplete: false })

todo.patch({ data: { isComplete: true } })
```

### `instance.update(params)`

The `update` method calls the `update` action (service method) using the instance data. The instance's id field is used for the `update` id. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

Use `.update()` whenever you want to completely replace the data on the server with the instance data.  You can also set the `preferUpdate` option to `true` to make `.save()` call `.update()` when an id field is present on the instance.

```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.description = 'Do something else'

todo.update() // --> Sends a `update` request the with all instance data.
```

### `instance.remove(params)`

The `remove` method calls the `remove` action (service method) using the instance data. The instance's id field is used for the `remove` id. The `params` argument will be used in the Feathers client request.  See the [Feathers Service](https://docs.feathersjs.com/guides/basics/services.html#service-methods) docs, for reference.

```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })

todo.save()
  .then(todo => {
    todo.remove() // --> Deletes the record from the server
  })
```

### `instance.clone()`

The `.clone()` method creates a deep copy of the record and stores it on `Model.copiesById`. This allows you to make changes to the clone and not update visible data until you commit or save the data.

```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.

console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

There's another use case for using `.clone()`.  Vuex has a `strict` mode that's really useful in development.  It throws errors if any changes occur in the Vuex store `state` outside of mutations.  Clone really comes in handy here, because you can make changes to the clone without having to write custom Vuex mutations. When you're finished making changes, call `.commit()` to update the store. This gives you `strict` mode compliance with little effort!

> Note: You could previously use the `keepCopiesInStore`<Badge text="deprecated" type="warning"/> option to keep copies in `state.copiesById`.  In 2.0, this feature is deprecated and will be removed from the next release.

### `instance.commit()`

```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.commit() // --> Update the data in the store.

console.log(todo.description) // --> 'Do something else!'
console.log(todoCopy.description) // --> 'Do something else!'
```

### `instance.reset()`

```js
const { Todo } = this.$FeathersVuex.api
const todo = new Todo({ id: 1, description: 'Do something!' })
const todoCopy = todo.clone()

todoCopy.description = 'Do something else!'
todoCopy.reset() // --> Resets the record to match the one in the store.

console.log(todo.description) // --> 'Do something!'
console.log(todoCopy.description) // --> 'Do something!'
```
