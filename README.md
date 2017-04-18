# feathers-vuex

[![Build Status](https://travis-ci.org/feathersjs/feathers-vuex.png?branch=master)](https://travis-ci.org/feathersjs/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

> Vuex (Vue.js) integrated as a Feathers Client plugin

## Installation

```
npm install feathers-vuex --save
```

## API Documentation

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
The `Service Module` automatically sets up newly-created services into the Vuex store.

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
- `find`: query an array of records from the server & add to Vuex store
- `get`: query a single record from the server & add to Vuex store
- `create`: create one (as an object) or multiple (as an array) records
- `update`: update (overwrite) a record
- `patch`: patch (merge in changes) one or more records
- `remove`: remove/delete the record

### Getters
Each service that is setup with Vuex will have the following getters:
- `find`: accepts a `params` object which allows you to use the [Feathers query syntax]() to query an array of records from the Vuex store.
- `get`: similar to `find`, but allows you to query a single record from the Vuex store.

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
