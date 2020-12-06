---
title: Vue CLI
description: ''
position: 1
category: Setup
---

## Setup

Using Feathers-Vuex happens in these steps:

1. [Setup the Feathers client and Feathers-Vuex](#setup-the-feathers-client-and-feathers-vuex)
2. [Define a Model class and service plugin for each service](#setup-one-or-more-service-plugins)
3. [Setup the auth plugin](#setup-the-auth-plugin), if required.
4. Register the plugins with the Vuex store.

### Feathers Client & Feathers-Vuex

To setup `feathers-vuex`, we first need to setup the latest Feathers client. We can also setup feathers-vuex in the same file. Depending on your requirements, you'll need to install the feathers-client dependencies, as shown, above.

Note that this example includes an app-level hook that removes attributes for handling temporary (local-only) records.

```js
// src/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex from 'feathers-vuex'

const socket = io('http://localhost:3030', { transports: ['websocket'] })

const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))
  .hooks({
    before: {
      all: [
        iff(
          context => ['create', 'update', 'patch'].includes(context.method),
          discard('__id', '__isTemp')
        ),
      ],
    },
  })

export default feathersClient

// Setting up feathers-vuex
const { makeServicePlugin, makeAuthPlugin, BaseModel, models, FeathersVuex } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api', // optional for working with multiple APIs (this is the default value)
    idField: '_id', // Must match the id field in your database table/collection
    whitelist: ['$regex', '$options'],
  }
)

export { makeAuthPlugin, makeServicePlugin, BaseModel, models, FeathersVuex }
```

### Service Plugins

The following example creates a User class and registers it with the new `makeServicePlugin` utility function. This same file is also a great place to add your service-level hooks, so they're shown, too.

```js
// src/store/services/users.js
import feathersClient, { makeServicePlugin, BaseModel } from '../../feathers-client'

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
    }
  }
}
const servicePath = 'users'
const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service(servicePath),
  servicePath,
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
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
})

export default servicePlugin
```

### Auth Plugin

If your application uses authentication, the Auth Plugin will probably come in handy. It's a couple of lines to setup:

```js
// src/store/store.auth.js
import { makeAuthPlugin } from '../feathers-client'

export default makeAuthPlugin({ userService: 'users' })
```

[Read more about the Auth Plugin](/auth-plugin.html).

### Vuex store

This example uses Webpack's `require.context` feature. If you're not using Webpack, you'll need to manually import each module and list them in the `plugins` array.

```js
// src/store/index.js
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
  /\.js$/
)
const servicePlugins = requireModule.keys().map(modulePath => requireModule(modulePath).default)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  plugins: [...servicePlugins, auth],
})
```
