# feathers-vuex

[![Build Status](https://travis-ci.org/feathersjs/feathers-vuex.png?branch=master)](https://travis-ci.org/feathersjs/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

> Vuex (Vue.js) integrated as a Feathers Client plugin

## Installation

```
npm install feathers-vuex --save
```

## Use
Use `feathers-vuex` the same as any other FeathersJS plugin. The only prerequisite is that you have Vuex configured in your Vue app.  Suppose you have the following Vuex store:

**store/index.js:**
```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {}
})
```

And here's how you would configure the plugin with your Feathers Client setup:

**feathers-client.js:**
```js
import feathers from 'feathers'
import hooks from 'feathers-hooks'
import socketio from 'feathers-socketio'
import auth from 'feathers-authentication-client'
import io from 'socket.io-client'
import feathersVuex from 'feathers-vuex'
import store from '@/store/'
import rx from 'feathers-reactive'
import RxJS from 'rxjs'

const socket = io('http://localhost:3030', {transports: ['websocket']})

const feathersClient = feathers()
  .configure(hooks())
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))
  .configure(rx(RxJS, {idField: '_id'}))
  // Register feathers-vuex by passing the store and options
  .configure(feathersVuex(store, {
    idField: '_id',
    auth: {
      userService: '/users'
    }
  }))

// For every service created, a Vuex store module will be created.
feathersClient.service('/users')
feathersClient.service('/messages')

export default feathersClient
```

To see `feathers-vuex` in a working vue-cli application, check out [`feathers-chat-vuex`](https://github.com/feathersjs/feathers-chat-vuex).

## API Documentation

### Global Configuration

The following default options are available for configuration:

```js
const defaultOptions = {
  idField: 'id', // The field in each record that will contain the id
  auto: true, // automatically setup a store for each service.
  autoRemove: false, // automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  feathers: {
    namespace: 'feathers'
  },
  auth: {
    namespace: 'auth',
    userService: '', // Set this to automatically populate the user on login success.
    state: {}, // add custom state to the auth module
    getters: {}, // add custom getters to the auth module
    mutations: {}, // add custom mutations to the auth module
    actions: {} // add custom actions to the auth module
  }
}
```

Each service module can also be individually configured.

### The Vuex modules

There are three modules included:
1. The Feathers module keeps a list of all services with vuex stores attached.
2. The Service module adds a Vuex store for new services.
3. The Auth module sets up the Vuex store for authentication / logout.

## Feathers Module
The `Feathers Module` allows your application to peer into how the Feathers client services are setup. It includes the following state:
```js
{
  services: {
    all: {}, // The same as feathersClient.services, keyed by path name.
    vuex: {} // All services that have been integrated into Vuex, keyed by path name
  }
}
```

## Service Module
The `Service Module` automatically sets up newly-created services into the Vuex store.  Each service will have the below default state in its store. The service will also have a `vuex` method that will allow you to add custom `state`, `getters`, `mutations`, and `actions` to an individual service's store.

### Service State
Each service comes loaded with the following default state:
```js
{
    ids: [],
    keyedById: {}, // A hash map, keyed by id of each item
    currentId: undefined, // The id of the item marked as current
    copy: undefined, // A deep copy of the current item
    service, // the FeathersService
    idField: 'id',

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnfind: undefined,
    errorOnGet: undefined,
    errorOnCreate: undefined,
    errorOnUpdate: undefined,
    errorOnPatch: undefined,
    errorOnRemove: undefined
  }
```

The following attributes are available in each service module's state:

- `ids {Array}` - an array of plain ids representing the ids that belong to each object in the `keyedById` map.
- `keyedById {Object}` - a hash map keyed by the id of each item.
- `currentId {Number|String}` - the id of the item marked as current.
- `copy {Object}` - a deep copy of the current item at the moment it was marked as current. You can make changes to the copy without modifying the `current`.  You can then use the `commitCopy` mutation to save the changes as the `current` or `rejectCopy` to revert `copy` to once again match `current`.
- `service {FeathersService}` - the Feathers service object
- `idField {String}` - the name of the field that holds each item's id. *Default: `'id'`*

The following state attributes allow you to bind to the pending state of requests:
- `isFindPending {Boolean}` - `true` if there's a pending `find` request.  `false` if not.
- `isGetPending {Boolean}` - `true` if there's a pending `get` request.  `false` if not.
- `isCreatePending {Boolean}` - `true` if there's a pending `create` request.  `false` if not.
- `isUpdatePending {Boolean}` - `true` if there's a pending `update` request.  `false` if not.
- `isPatchPending {Boolean}` - `true` if there's a pending `patch` request.  `false` if not.
- `isRemovePending {Boolean}` - `true` if there's a pending `remove` request.  `false` if not.

The following state attribute will be populated with any request error, serialized as a plain object:
- `errorOnFind {Error}`
- `errorOnGet {Error}`
- `errorOnCreate {Error}`
- `errorOnUpdate {Error}`
- `errorOnPatch {Error}`
- `errorOnRemo {Error}`

### Service Getters
Service modules include the following getters:
- `list {Array}` - an array of items. The array form of `keyedById`  Read only.
- `find(params) {Function}` - a helper function that allows you to use the [Feathers Adapter Common API](https://docs.feathersjs.com/api/databases/common.html) and [Query API](https://docs.feathersjs.com/api/databases/querying.html) to pull data from the store.  This allows you to treat the store just like a local Feathers database adapter (but without hooks).
  - `params {Object}` - an object with a `query` object. The `query` is in the FeathersJS query format.
- `get(id[, params]) {Function}` - a function that allows you to query the store for a single item, by id.  It works the same way as `get` requests in Feathers database adapters.
  - `id {Number|String}` - the id of the data to be retrieved by id from the store.
  - `params {Object}` - an object containing a Feathers `query` object.
- `current {Object}` - the object representing the `currentId`. It's pulled from the `keyedById` state.

### Service Mutations
The following mutations are included in each service module.

#### `addItem(state, item)`
Adds a single item to the `keyedById` map.
- `item {Object}` - The item to be added to the store.

#### `addItems(state, items)`
Adds an array of items to the `keyedById` map.
- `items {Array}` - the items to be added to the store.

#### `updateItem(state, item)`
Updates an item in the store to match the passed in `item`.
- `item {Object}` the item, including `id`, to replace the currently-stored item.

#### `updateItems(state, items)`
Updates multiple items in the store to match the passed in array of items.
- `items {Array}` - An array of items.

#### `removeItem(state, item)`
Removes a single item.  `item` can be
- `item {Number|String|Object}` - The item or id of the item to be deleted.

#### `removeItems(state, items)`
Removes the passed in items or ids from the store.
- `items {Array}` - An array of ids or of objects with ids that will be removed from the data store.

#### `setCurrent(state, item)`
- `item {Number|String|Object}` - the object with id to be set as the current item, or the id of the object in the store that should become the `current` item.  Setting the `current` item or id also create the deep-cloned `copy`.

#### `commitCopy(state)`
Saves changes from the `copy` to the `current` item.

#### `rejectCopy(state)`
Re-copies the data from `current` to `copy`, restoring the original copy.

#### `clearCurrent(state)`
Clears the `current` item, which also clears the copy.

#### `clearList(state)`
Clears the `list`, excepting the `current` item.

#### `clearAll(state)`
Clears all data from `ids`, `keyedById`, and `currentId`

#### Mutations for Managing Pending State
The following mutations are called automatically by the service actions, and will rarely, if ever, need to be used manually.
- `setFindPending(state)` - sets `isFindPending` to `true`
- `unsetFindPending(state)` - sets `isFindPending` to `false`
- `setGetPending(state)` - sets `isGetPending` to `true`
- `unsetGetPending(state)` - sets `isGetPending` to `false`
- `setCreatePending(state)` - sets `isCreatePending` to `true`
- `unsetCreatePending(state)` - sets `isCreatePending` to `false`
- `setUpdatePending(state)` - sets `isUpdatePending` to `true`
- `unsetUpdatePending(state)` - sets `isUpdatePending` to `false`
- `setPatchPending(state)` - sets `isPatchPending` to `true`
- `unsetPatchPending(state)` - sets `isPatchPending` to `false`
- `setRemovePending(state)` - sets `isRemovePending` to `true`
- `unsetRemovePending(state)` - sets `isRemovePending` to `false`

#### Mutations for Managing Errors
The following mutations are called automatically by the service actions, and will rarely need to be used manually.
- `setFindError(state, error)`
- `clearFindError(state)`
- `setGetError(state, error)`
- `clearGetError(state)`
- `setCreateError(state, error)`
- `clearCreateError(state)`
- `setUpdateError(state, error)`
- `clearUpdateError(state)`
- `setPatchError(state, error)`
- `clearPatchError(state)`
- `setRemoveError(state, error)`
- `clearRemoveError(state)`

### Service Actions
An action is included for each of the Feathers service interface methods.  These actions will affect changes in both the Feathers API server and the Vuex store.

All of the [Feathers Service Methods](https://docs.feathersjs.com/api/databases/common.html#service-methods) are supported.  Because Vuex only supports providing a single argument to actions, there is a slight change in syntax that works well.  If you need to pass multiple arguments to a service method, pass an array to the action with the order of the array elements matching the order of the arguments.  See each method for examples.

> Note: If you use the Feathers service methods, directly, the store will not change. Only the actions will cause store changes.

#### `find(params)`
Query an array of records from the server & add to the Vuex store.
- `params {Object}` - An object containing a `query` object.

```js
let params = {query: {completed: true}}
store.dispatch('todos/find', params)
```

#### `get(id)` or `get([id, params])`
Query a single record from the server & add to Vuex store
- `id {Number|String}` - the `id` of the record being requested from the API server.
- `params {Object}` - An object containing a `query` object.

```js
store.dispatch('todos/get', 1)

// Use an array to pass params
let params = {}
store.dispatch('todos/get', [1, params])
```

#### `create(data)`
Create one or multiple records.
- `data {Object|Array}` - if an object is provided, a single record will be created. If an array of objects is provided, multiple records will be created.

```js
let newTodo = {description: 'write good tests'}
store.dispatch('todos/create', newTodo)
```


#### `update([id, data, params])`
Update (overwrite) a record.
- `id {Number|String}` - the `id` of the existing record being requested from the API server.
- `data {Object}` - the data that will overwrite the existing record
- `params {Object}` - An object containing a `query` object.

```js
let data = {id: 5, description: 'write your tests', completed: true}
let params = {}
// Overwrite item 1 with the above data (FYI: Most databases won't let you change the id.)
store.dispatch('todos/update', [1, data, params])
```

#### `patch([id, data, params])`
Patch (merge in changes) one or more records
- `id {Number|String}` - the `id` of the existing record being requested from the API server.
- `data {Object}` - the data that will be merged into the existing record
- `params {Object}` - An object containing a `query` object.

```js
let data = {description: 'write your tests', completed: true}
let params = {}
store.dispatch('todos/update', [1, data, params])
```


#### `remove(id)`
Remove/delete the record with the given `id`.
- `id {Number|String}` - the `id` of the existing record being requested from the API server.

```js
store.dispatch('todos/remove', 1)
```

## Customizing a Service's Default Store

Each registered service will have a `vuex` method that allows you to customize its store:

```js
app.service('todos').vuex({
  state: {
    isCompleted: false
  },
  getters: {
    oneTwoThree (state) {
      return 123
    }
  },
  mutations: {
    setToTrue (state) {
      state.isCompleted = true
    }
  },
  actions: {
    triggerSetToTrue (context) {
      context.commit('setToTrue')
    }
  }
})

assert(store.getters['todos/oneTwoThree'] === 123, 'the custom getter was available')
store.dispatch('todos/trigger')
assert(store.state.todos.isTrue === true, 'the custom action was run')
```

## Auth Module
The Auth module helps setup your app for login / logout.  It includes the following state by default:
```js
{
  accessToken: undefined
}
```

### Actions
The following actions are included in the `auth` module:
- `authenticate`: Same as `feathersClient.authenticate()`
- `logout`: Same as `feathersClient.logout()`

### Configuration
You can provide an `auth.userService` in the feathersVuex options to automatically populate the user upon successful login.

## Handling Realtime Events
This plugin works perfectly with the [`feathers-reactive`](https://github.com/feathersjs/feathers-reactive) plugin.  Realtime events are handled in that plugin, allowing this plugin to stay lean and focused.  See the example below for how to add support for Feathers realtime events using `feathers-reactive`.


## Complete Example

Here's an example of a Feathers server that uses `feathers-vuex`.

```js
const feathers = require('feathers/client');
const socketio = require('feathers-socketio/client');
const auth = require('feathers-authentication-client');
const reactive = require('feathers-reactive')
const RxJS = require('rxjs');
const hooks = require('feathers-hooks');
const feathersVuex = require('feathers-vuex');

// Bring in your Vuex store
const store = require('/path/to/vuex/store');

// Initialize the application
const feathersClient = feathers()
  .configure(rest())
  .configure(hooks())
  .configure(auth())
  .configure(reactive(RxJS))
  // Initialize feathersVuex with the Vuex store
  .configure(feathersVuex(store));

// Automatically setup Vuex with a todos module
app.service('todos')
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
