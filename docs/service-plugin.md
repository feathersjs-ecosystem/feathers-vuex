---
title: Service Plugin
sidebarDepth: 3
---

# Service Plugin

<!-- markdownlint-disable MD002 MD033 MD041 -->

The `makeServicePlugin` method creates a vuex plugin which connects a Feathers service to the Vuex store.  Once you create a plugin, you must register it in the Vuex store's `plugins` section.

## Setup

See the [setup documentation](./getting-started.html#service-plugins) to learn the basics of setting up a Service Plugin.

## Configuration

The following options are supported on `makeServicePlugin`:

```js
import Model from "../users.model";

const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  // necesarry
  Model,
  service: feathersClient.service(servicePath),

  // optional and configurable also by global config
  idField: 'id',
  tempIdField: '__id',
  nameStyle: 'short',
  debug: false,
  addOnUpsert: false,
  autoRemove: false,
  preferUpdate: false,
  replaceItems: false,
  skipRequestIfExists: false,

  paramsForServer: ['$populateParams'],
  whitelist: [],

  enableEvents: true,
  handleEvents: {
    created: (item, { model, models }) => options.enableEvents,
    patched: (item, { model, models }) => options.enableEvents,
    updated: (item, { model, models }) => options.enableEvents,
    removed: (item, { model, models }) => options.enableEvents
  },

  // optional and only configurable per service
  servicePath: '',
  namespace: null,
  modelName: 'User',

  instanceDefaults: () => ({}),
  setupInstance: instance => instance,

  state: {},
  getters: {},
  mutations: {},
  actions: {},

  //...
});
```
The following options can also be configured in [Global Configuration](getting-started.html#global-configuration) for every service initialized using `feathers-client.js`:

- `idField {String}` - **Default:** `globalConfig: 'id'` - The field in each record that will contain the id
- `tempIdField {Boolean}` - **Default:** `globalConfig: '__id'` - The field in each temporary record that contains the id
- `nameStyle {'short'|'path'}` - **Default:** `globalConfig: 'short'` - Use the full service path as the Vuex module name, instead of just the last section.
- `debug {Boolean}` - **Default:** `globalConfig: false` - Enable some logging for debugging
- `addOnUpsert {Boolean}` - **Default:** `globalConfig: false` - If `true` add new records pushed by 'updated/patched' socketio events into store, instead of discarding them.
- `autoRemove {Boolean}` - **Default:** `globalConfig: false` - If `true` automatically remove records missing from responses (only use with feathers-rest)
- `preferUpdate {Boolean}` - **Default:** `globalConfig: false` - If `true`, calling `model.save()` will do an `update` instead of a `patch`.
- `replaceItems {Boolean}` - **Default:** `globalConfig: false` - If `true`, updates & patches replace the record in the store. Default is false, which merges in changes.
- `skipRequestIfExists {Boolean}` - **Default:** `globalConfig: false` - For get action, if `true` the record already exists in store, skip the remote request.
- `paramsForServer {Array}` - **Default:** `['$populateParams']` - Custom query operators that are ignored in the find getter, but will pass through to the server. It is preconfigured to work with the `$populateParams` custom operator from [feathers-graph-populate](https://feathers-graph-populate.netlify.app/).
- `whitelist {Array}` - Custom query operators that will be allowed in the find getter.
- `enableEvents {Boolean}` - **Default:** `globalConfig: true` - If `false` socket event listeners will be turned off
- `handleEvents {Object}`: For this to work `enableEvents` must be `true`
  - `created {Function}` - **Default:** `(item, { model, models }) => options.enableEvents` - handle `created` events, return true to add to the store
  - `patched {Function}` - **Default:** `(item, { model, models }) => options.enableEvents` - handle `created` events, return true to update in the store
  - `updated {Function}` - **Default:** `(item, { model, models }) => options.enableEvents` - handle `created` events, return true to update in the store
  - `removed {Function}` - **Default:** `(item, { model, models }) => options.enableEvents` - handle `removed` events, return true to remove from the store
  -

The following options can only configured individually per service plugin

- `servicePath {String}`- Not all Feathers service plugins expose the service path, so it can be manually specified when missing.
- `namespace {String}`, - **Default:** `nameStyle === 'short' ? ${afterLastSlashOfServicePath} : ${stripSlashesFromServicePath}` - Customize the Vuex module name. Overrides nameStyle.
- `modelName {String}` - **Default:** `${ServicePlugin.Model.modelName}`
- `instanceDefaults {Function}` - **Default:** `() => ({})` - Override this method to provide default data for new instances. If using Model classes, specify this as a static class property.
- `setupInstance {Function}` - **Default:** `instance => instance` - Override this method to setup data types or related data on an instance. If using Model classes, specify this as a static class property.

  - `state {Object}` - **Default:**: `null` - Pass custom `states` to the service plugin or modify existing ones
  - `getters {Object}` - **Default:** `null` - Pass custom `getters` to the service plugin or modify existing ones
  - `mutations {Object}` - **Default:** `null` - Pass custom `mutations` to the service plugin or modify existing ones
  - `actions {Object}` - **Default:** `null` - Pass custom `actions` to the service plugin or modify existing ones

## Realtime by Default

Service plugins automatically listen to all socket messages received by the Feathers Client.  This can be disabled by setting `enableEvents: false` in the options, as shown above.

## The FeathersClient Service

Once the service plugin has been registered with Vuex, the FeathersClient Service will have a new `service.FeathersVuexModel` property.  This provides access to the service's [Model class](./model-classes.html).

```js
import { models } from 'feathers-vuex'

feathersClient.service('todos').FeathersVuexModel === models.api.Todo // true
```

## Service State

Each service comes loaded with the following default state:

```js
{
    ids: [],
    idField: 'id',
    keyedById: {},
    tempsById: {},
    tempsByNewId: {},
    pagination: {
      defaultLimit: null,
      defaultSkip: null
    },
    servicePath: 'v1/todos'
    modelName: 'Todo',
    autoRemove: false,
    replaceItems: false,

    pagination: {
      ids: []
      limit: 0
      skip: 0
      ip: 0
      total: 0,
      mostRecent: any
    },

    paramsForServer: ['$populateParams'],
    whitelist: [],

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

- `ids {Array}` - an array of plain ids representing the ids that belong to each object in the `keyedById` map.
- `idField {String}` - the name of the field that holds each item's id. *Default: `'id'`*
- `keyedById {Object}` - a hash map keyed by the id of each item.
- `tempsById {Object}` - a hash map of temporary records, [keyed by tempIdField](./getting-started.html#global-configuration) of each item
- `tempsByNewId {Object}` - temporary storage for temps while getting transferred from tempsById to keyedById
- `servicePath {String}` - the full service path, even if you alias the namespace to something else.
- `modelName {String}` - the key in the $FeathersVuex plugin where the model will be found.
- `autoRemove {Boolean}` - indicates that this service will not automatically remove results missing from subsequent requests.  Only use with feathers-rest. Default is false.
- `replaceItems {Boolean}` - When set to true, updates and patches will replace the record in the store instead of merging changes.  Default is false

- `pagination {Object}` - provides informaiton about the last made queries

- `paramsForServer {Array}` - Custom query operators that are ignored in the find getter, but will pass through to the server.
- `whitelist {Array}` - Custom query operators that will be allowed in the find getter.

The following state attributes allow you to bind to the pending state of requests:

- `isFindPending {Boolean}` - `true` if there's a pending `find` request. `false` if not.
- `isGetPending {Boolean}` - `true` if there's a pending `get` request. `false` if not.
- `isCreatePending {Boolean}` - `true` if there's a pending `create` request. `false` if not.
- `isUpdatePending {Boolean}` - `true` if there's a pending `update` request. `false` if not.
- `isPatchPending {Boolean}` - `true` if there's a pending `patch` request. `false` if not.
- `isRemovePending {Boolean}` - `true` if there's a pending `remove` request. `false` if not.

The following state attribute will be populated with any request error, serialized as a plain object:

- `errorOnFind {Error}`
- `errorOnGet {Error}`
- `errorOnCreate {Error}`
- `errorOnUpdate {Error}`
- `errorOnPatch {Error}`
- `errorOnRemo {Error}`

## Service Getters

Service modules include the following getters:

- `list {Array}` - an array of items. The array form of `keyedById`  Read only.
- `find(params) {Function}` - a helper function that allows you to use the [Feathers Adapter Common API](https://docs.feathersjs.com/api/databases/common) and [Query API](https://docs.feathersjs.com/api/databases/querying) to pull data from the store.  This allows you to treat the store just like a local Feathers database adapter (but without hooks).
  - `params {Object}` - an object with a `query` object and optional properties. You can set the following  properties:
    - `params.query {Boolean}` - The `query` is in the FeathersJS query format.
    - `params.temps {Boolean}` - **Default:** `false` - if `true` also consider temporary records from `tempsById`
    - `params.copies {Boolean}` - **Default:** `false` - if `true`: first search for the regular records and then replace the records with the related copies from `copiesById`
- `count(params) {Function}` - a helper function that counts items in the store matching the provided query in the params and returns this number <Badge text="3.12.0+" />
  - `params {Object}` - an object with a `query` object and an optional `temps` boolean property.
- `get(id[, params]) {Function}` - a function that allows you to query the store for a single item, by id.  It works the same way as `get` requests in Feathers database adapters.
  - `id {Number|String}` - the id of the data to be retrieved by id from the store.
  - `params {Object}` - an object containing a Feathers `query` object.

## Service Mutations

The following mutations are included in each service module.
> **Note:** you would typically not call these directly, but instead with `store.commit('removeItem', 'itemId')`. Using vuex's mapMutations on a Vue component can simplify that to `this.removeItem('itemId')`

### `addItem(state, item)`

Adds a single item to the `keyedById` map.

- `item {Object}` - The item to be added to the store.

### `addItems(state, items)`

Adds an array of items to the `keyedById` map.

- `items {Array}` - the items to be added to the store.

### `updateItem(state, item)`

Updates an item in the store to match the passed in `item`.

- `item {Object}` the item, including `id`, to replace the currently-stored item.

### `updateItems(state, items)`

Updates multiple items in the store to match the passed in array of items.

- `items {Array}` - An array of items.

### `removeItem(state, item)`

Removes a single item.  `item` can be

- `item {Number|String|Object}` - The item or id of the item to be deleted.

### `removeTemps(state, tempIds)`

// Removes temp records. Also cleans up tempsByNewId

- `items {Array}` - An array of ids or of objects with tempIds that will be removed from the data store

### `removeItems(state, items)`

Removes the passed in items or ids from the store.

- `items {Array}` - An array of ids or of objects with ids that will be removed from the data store.

### `clearAll(state)`

Clears all data from `ids`, `keyedById`, and `currentId`

### Mutations for Managing Pending State

The following mutations are called automatically by the service actions, and will rarely, if ever, need to be used manually.

- `setPending(state, method)` - sets the `is${method}Pending` attribute to true
- `unsetPending(state, method)` - sets the `is${method}Pending` attribute to false

### Mutations for Managing Errors

The following mutations are called automatically by the service actions, and will rarely need to be used manually.

- `setError(state, { method, error })` - sets the `errorOn${method}` attribute to the error
- `clearError(state, method)` - sets the `errorOn${method}` attribute to `null`

## Service Actions

An action is included for each of the Feathers service interface methods.  These actions will affect changes in both the Feathers API server and the Vuex store.

All of the [Feathers Service Methods](https://docs.feathersjs.com/api/databases/common#service-methods) are supported.  Because Vuex only supports providing a single argument to actions, there is a slight change in syntax that works well.  If you need to pass multiple arguments to a service method, pass an array to the action with the order of the array elements matching the order of the arguments.  See each method for examples.

> Note: If you use the Feathers service methods, directly, the store will not change. Only the actions will cause store changes.

### `find(params)`

Query an array of records from the server & add to the Vuex store.

- `params {Object}` - An object containing a `query` object and an optional `paginate` boolean.  You can set `params.paginate` to `false` to disable pagination for a single request.

```js
let params = {query: {completed: true}}
store.dispatch('todos/find', params)
```

See the section about pagination, below, for more information that is applicable to the `find` action.  Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

### `afterFind(response)`

The `afterFind` action is called by the `find` action after a successful response is added to the store.  It is called with the current response.  By default, it is a no-op (it literally does nothing), and is just a placeholder for you to use when necessary.  See the sections on [customizing the default store](#Customizing-a-Service’s-Default-Store) and [Handling custom server responses](./common-patterns.html#Handling-custom-server-responses) for example usage.

### `count(params)` <Badge text="3.12.0+" />

Count items on the server matching the provided query.

- `params {Object}` - An object containing a `query` object. In the background `$limit: 0` will be added to the `query` to perform a (fast) counting query against the database.

> **Note:** it only works for services with enabled pagination!

```js
let params = {query: {completed: false}}
store.dispatch('todos/count', params)
```

This will run a (fast) counting query against the database and return a page object with the total and an empty data array.

### `get(id)` or `get([id, params])`

Query a single record from the server & add to Vuex store

- `id {Number|String}` - the `id` of the record being requested from the API server.
- `params {Object}` - An object containing a `query` object.

```js
store.dispatch('todos/get', 1)

// Use an array to pass params
let params = {}
store.dispatch('todos/get', [1, params])
```

Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

### `create(data|ParamArray)`

Create one or multiple records.  Note that the method is overloaded to accept two types of arguments.  If you want a consistent interface for creating single or multiple records, use the array syntax, described below.  Creating multiple records requires using the `paramArray` syntax.

- `data {Object|ParamArray}` - if an object is provided, a single record will be created.

```js
let newTodo = {description: 'write good tests'}
store.dispatch('todos/create', newTodo)
```

- `data {ParamArray}` - if an array is provided, it is assumed to have this structure:

- `ParamArray {Array}` - array containing the two parameters that Feathers' `service.create` method accepts.
  - `data {Object|Array}` - the data to create. Providing an object creates a single record. Providing an array of objects creates multiple records.
  - `params {Object}` - optional - an object containing a `query` object. Can be useful in rare situations.

Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

### `update(paramArray)`

Update (overwrite) a record.

- `paramArray {Array}` - array containing the three parameters update accepts.
  - `id {Number|String}` - the `id` of the existing record being requested from the API server.
  - `data {Object}` - the data that will overwrite the existing record
  - `params {Object}` - An object containing a `query` object.

```js
let data = {id: 5, description: 'write your tests', completed: true}
let params = {}
// Overwrite item 1 with the above data (FYI: Most databases won't let you change the id.)
store.dispatch('todos/update', [1, data, params])
```

Alternatively in a Vue component

```js
import { mapActions } from 'vuex'
export default {
  methods: {
    ...mapActions('todos', [ 'update' ]),
    addTodo () {
      let data = {id: 5, description: 'write your tests', completed: true}
      this.update([1, data, {}])
    }
  }
}
```

Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

### `patch(paramArray)`

Patch (merge in changes) one or more records

- `paramArray {Array}` - array containing the three parameters patch takes.
  - `id {Number|String}` - the `id` of the existing record being requested from the API server.
  - `data {Object}` - the data that will be merged into the existing record
  - `params {Object}` - An object containing a `query` object. If params.data is provided, it will be used as the patch data, providing a simple way to patch with partial data.

```js
let data = {description: 'write your tests', completed: true}
let params = {}
store.dispatch('todos/patch', [1, data, params])
```

Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

### `remove(id)`

Remove/delete the record with the given `id`.

- `id {Number|String}` - the `id` of the existing record being requested from the API server.

```js
store.dispatch('todos/remove', 1)
```

Make sure your returned records have a unique field that matches the `idField` option for the service plugin.

## Service Events

By default, the service plugin listens to all of the FeathersJS events:

- `created` events will add new record to the store.
- `patched` events will add (if new) or update (if present) the record in the store.
- `updated` events will add (if new) or update (if present) the record in the store.
- `removed` events will remove the record from the store, if present.

This behavior can be turned off completely by passing `enableEvents: false` in either the global Feathers-Vuex options or in the service plugin options.  If you configure this at the global level, the service plugin level will override it.  For example, if you turn off events at the global level, you can enable them for a specific service by setting `enableEvents: true` on that service's options.

### Custom Event Handlers <Badge text="3.1.0+" />

As of version 3.1, you can customize the behavior of the event handlers, or even perform side effects based on the event data.  This is handled through the new `handleEvents` option on the service plugin.  Here is an example of how you might use this:

```js
handleEvents: {
  created: (item, { model, models }) => {
    // Perform a side effect to remove any record with the same `name`
    const existing = Model.findInStore({ query: { name: item.name }}).data[0]
    if (existing) {
      existing.remove()
    }

    // Perform side effects with other models.
    const { SomeModel } = models.api
    new SomeModel({ /* some custom data */ }).save()

    // Access the store through model.store
    const modelState = model.store.state[model.namespace]
    if (modelState.keyedById[5]) {
      console.log('we accessed the vuex store')
    }

    // If true, the new item will be stored.
    return true
  },
  updated: () => false, // Ignore `updated` events.
  patched: item => item.hasPatchedAttribute && item.isWorthKeeping,
  removed: item => true // The default value, will remove the record from the store
}
```

As shown above, each handler has two possible uses:

1. Control the default behavior of the event by returning a boolean.
  - For `created`, `patched`, and `updated` a truthy return will add or update the item in the store.
  - For `removed` a truthy return will remove the item from the store, if present.
2. Perform side effects using the current service `model` or with other `models`.  The `models` object is the same as the `$FeathersVuex` object in the Vue plugin.

Each handler receives the following arguments:

- `item`: the record sent from the API server
- `utils`: an object containing the following properties
   - `model` The current service's Model class.
   - `models` The same as the `$FeathersVuex` object, gives you access to each api with their respective model classes.

You do not have to specify a handler for every event. Any that are not specified in your service-specific `handleEvents`, will fall back to using the `handleEvents` handler in your global options. If none are defined for the service or globally, the default behavior is controlled by the `enableEvents` option.

#### Handling complex events <Badge text="3.10.0+" />

If your application emits the standard Feathers service events inside a nested object with additional data, you can use `handleEvents` to tell FeathersVuex what part of that data is actually the model data that should be used to update the store.

To do this, use `handleEvents` as described before, but return a tuple `[affectsStore, modelData]` from your handler.

- `affectsStore` a truthy value indicates the event should update the store
- `modelData` is the model data used to update the store

For example, you've configured your Feathers API to emit `patched` events for your `Todos` service that include context about the event which look like

```json
{
  "$context": {
    "time": 1445411009000,
    "userId": 121,
    "deviceId": "Marty's iPhone"
  },
  "event": {
    "id": 88,
    "text": "Get back to the past",
    "done": true
  }
}
```

For this service to play nicely with FeathersVuex, you'll need to use `handleEvents`

```js
handleEvents: {
  patched: (item, { model, models }) => {
    // Perform any side effects...

    // If the first element is truthy, the item will update the store
    // The second element is the actual model data to add to the store
    return [true, item.event]
  }
}
```

The original event data is bubbled to [Model events](./model-classes.md#model-events) so listeners receive the full event context.

## Pagination and the `find` action

Both the `find` action and the `find` getter support pagination.  There are differences in how they work.

Important: For the built in pagination features to work, you must not directly manipulate the `context.params` object in any before hooks.  You can still use before hooks as long as you clone the params object, then make changes to the clone.

### The `find` action

The `find` action queries data from the remote server.  It returns a promise that resolves to the response from the server.  The presence of pagination data will be determined by the server.

`feathers-vuex@1.0.0` can store pagination data on a per-query basis.  The `pagination` store attribute maps queries to their most-recent pagination data.  The default pagination state looks like this:

```js
{
  pagination: {
    defaultLimit: null,
    defaultSkip: null
  }
}
```

You should never manually change these values.  They are managed internally.

There's not a lot going on, by default.  The `defaultLimit` and `defaultSkip` properties are null until a query is made on the service without `$limit` or `$skip`.  In other words, they remain `null` until an empty query comes through, like the this one:

**`params = { query: {} }`**

```js
{
  pagination : {
    defaultLimit: 25,
    defaultSkip: 0,
    default: {
      mostRecent: {
        query: {},
        queryId: '{}',
        queryParams: {},
        pageId: '{$limit:25,$skip:0}',
        pageParams: { $limit: 25, $skip: 0 },
        queriedAt: 1538594642481
      },
      '{}': {
        total: 155,
        queryParams: {},
        '{$limit:25,$skip:0}': {
          pageParams: { $limit: 25, $skip: 0 },
          ids: [ 1, 2, 3, 4, '...etc', 25 ],
          queriedAt: 1538594642481
        }
      }
    }
  }
}
```

It looks like a lot just happened, so let's walk through it.  First, notice that we have values for `defaultLimit` and `defaultSkip`.  These come in handy for the `find` getter, which will be covered later.

### The `qid`

The state now also contains a property called `default`.  This is the default `qid`, which is a "query identifier" that you choose.  Unless you're building a small demo, your app will require to storing pagination information for more than one query.  For example, two components could make two distinct queries against this service.  You can use the `params.qid` (query identifier) property to assignn identifier to the query.  If you set a `qid` of `mainListView`, for example, the pagination for this query will show up under `pagination.mainListView`.  The `pagination.default` property will be used any time a `params.qid` is not provided.  Here's an example of what this might look like:

**`params = { query: {}, qid: 'mainListView' }`**

```js
// Data in the store
{
  pagination : {
    defaultLimit: 25,
    defaultSkip: 0,
    mainListView: {
      mostRecent: {
        query: {},
        queryId: '{}',
        queryParams: {},
        pageId: '{$limit:25,$skip:0}',
        pageParams: { $limit: 25, $skip: 0 },
        queriedAt: 1538594642481
      },
      '{}': {
        total: 155,
        queryParams: {},
        '{$limit:25,$skip:0}': {
          pageParams: { $limit: 25, $skip: 0 },
          ids: [ 1, 2, 3, 4, '...etc', 25 ],
          queriedAt: 1538594642481
        }
      }
    }
  }
}
```

The above example is almost exactly the same as the previous one.  The only difference is that the `default` key is now called `mainListView`.  This is because we provided that value as the `qid` in the params.  Let's move on to the properties under the `qid`.

### The `mostRecent` object

The `mostRecent` propery contains information about the most recent query.  These properties provide insight into how pagination works.  The two most important properties are the `queryId` and the `pageId`.

- The `queryId` describes the set of data we're querying.  It's a stable, stringified version of all of the query params **except** for `$limit` and `$skip`.
- The `pageId` holds information about the current "page" (as in "page-ination").  A page is described using `$limit` and `$skip`.

The `queryParams` and `pageParams` are the non-stringified `queryId` and `pageId`.  The `query` attribute is the original query that was provided in the request params.  Finally, the `queriedAt` is a timestamp of when the query was performed.

### The `queryId` and `pageId` tree

The rest of the `qid` object is keyed by `queryId` strings.  Currently, we only have a single `queryId` of `'{}'`.  In the `queryId` object we have the `total` numer of records (as reported by the server) and the `pageId` of `'{$limit:25,$skip:0}'`

```js
'{}': { // queryId
  total: 155,
  queryParams: {},
  '{$limit:25,$skip:0}': { // pageId
    pageParams: { $limit: 25, $skip: 0 },
    ids: [ 1, 2, 3, 4, '...etc', 25 ],
    queriedAt: 1538594642481
  }
}
```

The `pageId` object contains the `queriedAt` timestamp of when we last queried this page of data.  It also contains an array of `ids`, holding only the `ids` of the records returned from the server.

### Additional Queries and Pages

As more queries are made, the pagination data will grow to represent what we have in the store.  In the following example, we've made an additional query for sorted data in the `mainListView` `qid`.  We haven't filtered the list down any, so the `total` is the same as before.  We have sorted the data by the `isComplete` attribute, which changes the `queryId`.  You can see the second `queryId` object added to the `mainListView` `qid`:

**`params = { query: {}, qid: 'mainListView' }`**<br/>
**`params = { query: { $limit: 10, $sort: { isCompleted: 1 } }, qid: 'mainListView' }`**

```js
// Data in the store
{
  pagination : {
    defaultLimit: 25,
    defaultSkip: 0,
    mainListView: {
      mostRecent: {
        query: { $sort: { isCompleted: 1 } },
        queryId: '{$sort:{isCompleted:1}}',
        queryParams: { $sort: { isCompleted: 1 } },
        pageId: '{$limit:10,$skip:0}',
        pageParams: { $limit: 10, $skip: 0 },
        queriedAt: 1538595856481
      },
      '{}': {
        total: 155,
        queryParams: {},
        '{$limit:25,$skip:0}': {
          pageParams: { $limit: 25, $skip: 0 },
          ids: [ 1, 2, 3, 4, '...etc', 25 ],
          queriedAt: 1538594642481
        }
      },
      '{$sort:{isCompleted:1}}': {
        total: 155,
        queryParams: {},
        '{$limit:10,$skip:0}': {
          pageParams: { $limit: 10, $skip: 0 },
          ids: [ 4, 21, 19, 29, 1, 95, 62, 21, 67, 125 ],
          queriedAt: 1538594642481
        }
      }
    }
  }
}
```

In summary, any time a query param other than `$limit` and `$skip` changes, we get a new `queryId`.  Whenever `$limit` and `$skip` change, we get a new `pageId` inside the current `queryId`.

### Why use this pagination structure

Now that we've reviewed how pagination tracking works under the hood, you might be asking "Why?"  There are a few reasons:

1. Improve performance with cacheing.  It's now possible to skip making a query if we already have valid data for the current query.  The [`makeFindMixin`](./mixins.html) mixin makes this very easy with its built-in `queryWhen` feature.
2. Allow fall-through cacheing of paginated data.  A common challenge occurs when you provide the same query params to the `find` action and the `find` getter.  As you'll learn in the next section, the `find` getter allows you to make queries against the Vuex store as though it were a Feathers database adapter.  But what happens when you pass `{ $limit: 10, $skip: 10 }` to the action and getter?<br/>
First, lets review what happens with the `find` action.  The database is aware of all 155 records, so it skips the first 10 and returns the next 10 records.  Those records get populated in the store, so the store now has 10 records.  Now we pass the query to the `find` getter and tell it to `$skip: 10`.  It skips the only 10 records that are in the store and returns an empty array!  That's definitely not what we wanted.<br/>
Since we're now storing this pagination structure, we can build a utility around the `find` getter which will allow us to return the same data with the same query.  The data is still reactive and will automatically update when a record changes.

There's one limitation to this solution.  What happens when you add a new record that matches the current query?  Depending on where the new record would be sorted into the current query, part or all of the cache is no longer valid.  It will stay this way until a new query is made.  To get live (reactive) lists, you have to use the `find` getter with its own distinct query, removing the `$limit` and `$skip` values.  This way, when a new record is created, it will automatically get added to the array in the proper place.

## Pagination and the `find` getter

The `find` getter queries data from the local store using the same Feathers query syntax as on the server.  It is synchronous and returns the results of the query with pagination.  Pagination cannot be disabled.  It accepts a params object with a `query` attribute.  It does not use any other special attributes.  The returned object looks just like a paginated result that you would receive from the server:

**`params = { query: {} }`**

```js
// The returned results object
{
  data: [{ _id: 1, ...etc }, ...etc],
  limit: 0,
  skip: 0,
  total: 3
}
```

## Customizing a Service's Default Store

As shown in the example below, the service module allows you to customize its store:

```js
// src/store/services/users.js
import feathersClient, { makeServicePlugin, BaseModel } from '../../feathers-client'

class Asset extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'Asset'
  // Define default properties here
  static instanceDefaults() {
    return {
      email: '',
      password: ''
    }
  }
}

const servicePath = 'assets'
const servicePlugin = makeServicePlugin({
  Model: Asset,
  service: feathersClient.service(servicePath),
  servicePath,
  state: {
    test: true
  },
  getters: {
    getSomeData () {
      return 'some data'
    }
  },
  mutations: {
    setTest (state, val) {
      state.test = val;
    },
  },
  actions: {
    // Overwriting the built-in `afterFind` action.
    afterFind ({ commit, dispatch, getters, state }, response) {
      // Do something with the response.
      // Keep in mind that the data is already in the store.
    },
    asyncStuff ({ state, getters, commit, dispatch }, args) {
      commit('setTestToTrue')
      return new Promise.resolve("")
    }
  }
})

export default servicePlugin
```
