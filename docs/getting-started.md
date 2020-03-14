---
title: Getting Started
sidebarDepth: 3
---

# Getting Started with Feathers-Vuex

## Installation

```bash
npm install feathers-vuex @vue/composition-api --save
```

```bash
yarn add feathers-vuex @vue/composition-api
```

IMPORTANT: Feathers-Vuex is (and requires to be) published in ES6 format for full compatibility with JS classes.  If your project uses Babel, it must be configured properly.  See the [Project Configuration](#projectconfiguration) section for more information.

### With feathers-socketio

A realtime-transport like Socket.io or Primus is required in order to take advantage of the real-time socket events built into Feathers-Vuex. The `feathers-hooks-common` package, specified below, is not required to work with Feathers-Vuex.

```bash
npm i @feathersjs/feathers @feathersjs/socketio-client @feathersjs/authentication-client socket.io-client @vue/composition-api feathers-vuex feathers-hooks-common --save
```

```bash
yarn add @feathersjs/feathers @feathersjs/socketio-client @feathersjs/authentication-client socket.io-client @vue/composition-api feathers-vuex feathers-hooks-common
```

### With feathers-rest

Feathers-Vuex works with Feathers-Rest, but keep in mind that the `feathers-rest` client does not listen to socket events. The `feathers-hooks-common` package, specified below, is not required to work with Feathers-Vuex.

```bash
npm i @feathersjs/feathers @feathersjs/rest-client @feathersjs/authentication-client @vue/composition-api feathers-hooks-common feathers-vuex --save
```

```bash
yarn add @feathersjs/feathers @feathersjs/rest-client @feathersjs/authentication-client @vue/composition-api feathers-hooks-common feathers-vuex
```

## Project Configuration

### Vue-CLI

If your project runs on Vue-CLI, add the following to your `vue.config.js` file:

```js
module.exports = {
  transpileDependencies: ['feathers-vuex']
}
```

### Quasar

For Quasar apps, `transpileDependencies` can be updated in `quasar.conf.js` under build as

```
build: {
  transpileDependencies: ['feathers-vuex']
}
```

### Nuxt

If your project uses Nuxt, add the following to your `nuxt.config.js` file:

```
build: {
  transpile: ['feathers-vuex'],
}
```

### Resolving Build Issues

If you have issues with sub-dependencies not loading correctly, you may want to check out [this GitHub issue](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/399).  One of the suggestions is likely to fix the issue.


Be sure to read the section of the docs dedicated to [Working With Nuxt](./nuxt.md).

## Vue DevTools

Since Feathers-Vuex extensively uses Vuex under the hood, you'll want to make sure your VueJS developer tools are up to date AND setup properly.  Specifically, the "New Vuex Backend" needs to be enabled.  To setup the devtools

1. Open the Vue tab of the developer tools while viewing your Vue project in the browser.
1. Go to the Settings panel.
1. Enable the new Vuex backend:

![New Vuex Backend in Vue DevTools](/img/devtools.jpg)

When the above setting is not enabled, the Vue Devtools will likely hang when you start working on a large project.

## Setup

Using Feathers-Vuex happens in these steps:

1. [Setup the Feathers client and Feathers-Vuex](#setup-the-feathers-client-and-feathers-vuex)
2. [Define a Model class and service plugin for each service](#setup-one-or-more-service-plugins)
3. [Setup the auth plugin](#setup-the-auth-plugin), if required.
4. Register the plugins with the Vuex store.

### Feathers Client & Feathers-Vuex

To setup `feathers-vuex`, we first need to setup the latest Feathers client.  We can also setup feathers-vuex in the same file.  Depending on your requirements, you'll need to install the feathers-client dependencies, as shown, above.

Note that this example includes an app-level hook that removes attributes for handling temporary (local-only) records.

```js
// src/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex from 'feathers-vuex'

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
const { makeServicePlugin, makeAuthPlugin, BaseModel, models, FeathersVuex } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api', // optional for working with multiple APIs (this is the default value)
    idField: '_id', // Must match the id field in your database table/collection
    whitelist: ['$regex', '$options']
  }
)

export { makeAuthPlugin, makeServicePlugin, BaseModel, models, FeathersVuex }
```

### Service Plugins

The following example creates a User class and registers it with the new `makeServicePlugin` utility function.  This same file is also a great place to add your service-level hooks, so they're shown, too.

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

### Auth Plugin

If your application uses authentication, the Auth Plugin will probably come in handy.  It's a couple of lines to setup:

```js
// src/store/store.auth.js
import { makeAuthPlugin } from '../feathers-client'

export default makeAuthPlugin({ userService: 'users' })
```

[Read more about the Auth Plugin](/auth-plugin.html).

### Vuex store

This example uses Webpack's `require.context` feature.  If you're not using Webpack, you'll need to manually import each module and list them in the `plugins` array.

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

## Begin Using Feathers-Vuex

There are a couple of ways to use Feathers-Vuex.  Version 2.0 heavily focuses on abstracting away the Vuex syntax in favor of using [Model classes](/model-classes.html).  The Model classes are a layer on top of the Vuex getters, mutations, and actions. You can, of course, also directly use the [service plugin's getters, mutations, and actions](/service-plugin.html).

There are two plugins included:

1. The [Service Plugin](./service-plugin.md) adds a Vuex store for new services.
2. The [Auth Plugin](./auth-plugin.md) sets up the Vuex store for authentication / logout.

To see `feathers-vuex` in a working vue-cli application, check out [`feathers-chat-vuex`](https://github.com/feathersjs-ecosystem/feathers-chat-vuex).

### Global Configuration

The following default options are available for configuration:

```js
const defaultOptions = {
  // configured globally
  serverAlias: 'api',
  keepCopiesInStore: false,
  paramsForServer: [],
  whitelist: []

  // also configurable per service
  idField: 'id',
  tempIdField: '__id',
  debug: false,
  addOnUpsert: false,
  autoRemove: false,
  enableEvents: true,
  preferUpdate: false,
  replaceItems: false,
  skipRequestIfExists: false,
  nameStyle: 'short',
}
```
- `serverAlias` - **Default:** `api` - Models are keyed by `serverAlias`. Access the `$FeathersVuex` Plugin and its models in your components by `this.$FeathersVuex.api.${Model}`
- `keepCopiesInStore` - **Default:** `false` - Set to true to store cloned copies in the store instead of on the Model. <Badge text="deprecated" type="warning" />
- `paramsForServer {Array}` - **Default:** `[]` - Custom query operators that are ignored in the find getter, but will pass through to the server.
- `whitelist {Array}` - **Default:** `[]` - Custom query operators that will be allowed in the find getter.

- `idField {String}` - **Default:** `'id'` - The field in each record that will contain the id
- `tempIdField {Boolean}` - **Default:** `'__id'` - The field in each temporary record that contains the id
- `debug {Boolean}` - **Default:** `false` - Enable some logging for debugging
- `addOnUpsert {Boolean}` - **Default:** `false` - If `true` add new records pushed by 'updated/patched' socketio events into store, instead of discarding them.
- `autoRemove {Boolean}` - **Default:** `false` - If `true` automatically remove records missing from responses (only use with feathers-rest)
- `enableEvents {Boolean}` - **Default:** `true` - If `false` socket event listeners will be turned off. See the services [handleEvents API](/service-plugin.html#configuration)
- `preferUpdate {Boolean}` - **Default:** `false` - If `true`, calling `model.save()` will do an `update` instead of a `patch`.
- `replaceItems {Boolean}` - **Default:** `false` - If `true`, updates & patches replace the record in the store. Default is false, which merges in changes.
- `skipRequestIfExists {Boolean}` - **Default:** `false` - For get action, if `true` the record already exists in store, skip the remote request.
- `nameStyle {'short'|'path'}` - **Default:** `'short'` - Use the full service path as the Vuex module name, instead of just the last section.

Also see the [Configs per Service](/service-plugin.html#configuration)

### Note about feathers-reactive

Previous versions of this plugin required both RxJS and `feathers-reactive` to receive realtime updates.  `feathers-vuex@1.0.0` has socket messaging support built in and takes advantage of Vuex reactivity, so RxJS and `feathers-reactive` are no longer required or supported.

Each service module can also be individually configured.
