---
title: API Overview
---

<!--- Usage ------------------------------------------------------------------------------------ -->
[![Build Status](https://travis-ci.org/feathers-plus/feathers-vuex.png?branch=master)](https://travis-ci.org/feathers-plus/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathers-plus/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathers-plus/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

![feathers-vuex service logo](https://github.com/feathers-plus/feathers-vuex/raw/master/service-logo.png)

> Integrate the Feathers Client into Vuex

`feathers-vuex` is a first class integration of the Feathers Client and Vuex.  It implements many Redux best practices under the hood, eliminates *a lot* of boilerplate code, and still allows you to easily customize the Vuex store.

These docs are for version 2.x.  For feathers-vuex@1.x, please go to [https://feathers-vuex-v1.netlify.com](feathers-vuex-v1.netlify.com).

## Features

- Fully powered by Vuex & Feathers
- Realtime By Default
- Actions With Reactive Data
- Local Queries
- Live Queries
- Feathers Query Syntax
- Vuex Strict Mode Support
- Client-Side Pagination Support
- Fall-Through Caching *
- [`$FeathersVuex` Plugin for Vue](./vue-plugin.md) *
- [Per-Service Data Modeling](./common-patterns.md#Basic-Data-Modeling-with-instanceDefaults) *
- Clone & Commit *
- Simplified Auth *
- Per-Record Defaults *
- Data Level Computed Properties *
- Improved Relation Support *
- Powerful Mixins *
- Renderless Data Components *
- Renderless Form Component **
- Temporary (Local-only) Record Support **
- Server-Powered Pagination Support **

`* Improved in v2.0.0`<br />
`** New in v2.0.0`

## Installation

```bash
npm install feathers-vuex --save
```

## Use

Using Feathers-Vuex happens in these steps:

1. Setup the Feathers client and Feathers-Vuex.
2. Define a Model class and service plugin for each service.
3. Register the plugins with the Vuex store.

### Setup the Feathers Client and Feathers-Vuex

To setup `feathers-vuex`, we first need to setup the latest Feathers client.  We can also setup feathers-vuex in the same file.

Note that this example includes an app-level hook that removes attributes for handling temporary (local-only) records.

```js
// feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff } from 'feathers-hooks-common'

const socket = io('http://localhost:3030', {transports: ['websocket']})

const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))
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
const { makeServicePlugin, makeAuthPlugin, BaseModel, models } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api',
    idField: '_id',
    whitelist: ['$regex', '$options']
  }
)

export { makeAuthPlugin, makeServicePlugin, BaseModel, models }
```

### Setup one or more service plugins

The following example creates a User class and registers it with the new `makeServicePlugin` utility function.

```js
// services/users.js
import { makeServicePlugin, BaseModel } from '../feathers-client'

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

This same file is also a great place to add your service-level hooks, so append the following.

```js
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


```js
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'
import feathersClient from '../feathers-client'

const { service, auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })

Vue.use(Vuex)
Vue.use(FeathersVuex)

export default new Vuex.Store({
  plugins: [
    service('todos'),

    // Specify custom options per service
    service('/v1/tasks', {
      idField: '_id', // The field in each record that will contain the id
      nameStyle: 'path', // Use the full service path as the Vuex module name, instead of just the last section
      namespace: 'custom-namespace', // Customize the Vuex module name.  Overrides nameStyle.
      debug: true, // Enable some logging for debugging
      autoRemove: true, // Automatically remove records missing from responses (only use with feathers-rest)
      enableEvents: false, // Turn off socket event listeners. It's true by default
      addOnUpsert: true, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them. It's false by default
      replaceItems: true, // If true, updates & patches replace the record in the store. Default is false, which merges in changes
      skipRequestIfExists: true, // For get action, if the record already exists in store, skip the remote request. It's false by default
      modelName: 'OldTask' // Default modelName would have been 'Task'
    })

    // Add custom state, getters, mutations, or actions, if needed.  See example in another section, below.
    service('things', {
      state: {},
      getters: {},
      mutations: {},
      actions: {}
    })

    // Setup a service with defaults for Model instances
    service('manufacturers', {
      instanceDefaults: {
        name: ''
      }
    })
    // Setup a service with light-weight relational data
    service('models', {
      instanceDefaults: {
        name: '',
        manufacturerId: '',
        manufacturer: 'Manufacturer' // Refers to data (populated on the server) that gets put in the `manufacturers` vuex store.
      }
    })

    // Setup the auth plugin.
    auth({ userService: 'users' })
  ]
})
```

The new `feathers-vuex` API is more Vuex-like.  All of the functionality remains the same, but it is no longer configured like a FeathersJS plugin.  While the previous functionality was nice for prototyping, it didn't work well in SSR scenarios, like with Nuxt.

To see `feathers-vuex` in a working vue-cli application, check out [`feathers-chat-vuex`](https://github.com/feathers-plus/feathers-chat-vuex).

## Note about feathers-reactive

Previous versions of this plugin required both RxJS and `feathers-reactive` to receive realtime updates.  `feathers-vuex@1.0.0` has socket messaging support built in and takes advantage of Vuex reactivity, so RxJS and `feathers-reactive` are no longer required or supported.

## Global Configuration

The following default options are available for configuration:

```js
const defaultOptions = {
  idField: 'id', // The field in each record that will contain the id
  autoRemove: false, // automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short', // Determines the source of the module name. 'short' or 'path'
  enableEvents: true, // Set to false to explicitly disable socket event handlers.
  preferUpdate: false, // When true, calling modelInstance.save() will do an update instead of a patch.
}
```

Each service module can also be individually configured.

## The Vuex modules

There are two modules included:

1. The [Service module](./service-module.md) adds a Vuex store for new services.
2. The [Auth module](./auth-module.md) sets up the Vuex store for authentication / logout.

## License

Copyright (c) Forever and Ever, or at least the current year.

Licensed under the [MIT license](LICENSE).
