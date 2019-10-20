---
title: API Overview
sidebarDepth: 3
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
- [VuePress Dark Mode Support](https://tolking.github.io/vuepress-theme-default-prefers-color-scheme/) for the Docs **

`* Improved in v2.0.0`<br />
`** New in v2.0.0`

## Installation

```bash
npm install feathers-vuex --save
```

```bash
yarn add feathers-vuex
```

### With feathers-socketio

A realtime-transport like Socket.io or Primus is required in order to take advantage of the real-time socket events built into Feathers-Vuex. The `feathers-hooks-common` package, specified below, is not required to work with Feathers-Vuex.

```bash
npm i @feathersjs/feathers @feathersjs/socketio-client @feathersjs/authentication-client socket.io-client feathers-vuex feathers-hooks-common --save
```

```bash
yarn add @feathersjs/feathers @feathersjs/socketio-client @feathersjs/authentication-client socket.io-client feathers-vuex feathers-hooks-common
```

### With feathers-rest

Feathers-Vuex works with Feathers-Rest, but keep in mind that the `feathers-rest` client does not listen to socket events. The `feathers-hooks-common` package, specified below, is not required to work with Feathers-Vuex.

```bash
npm i @feathersjs/feathers @feathersjs/rest-client @feathersjs/authentication-client feathers-hooks-common feathers-vuex --save
```

```bash
yarn add @feathersjs/feathers @feathersjs/rest-client @feathersjs/authentication-client feathers-hooks-common feathers-vuex
```

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
    serverAlias: 'api', // optional for working with multiple APIs (this is the default value)
    idField: '_id', // Must match the id field in your database table/collection
    whitelist: ['$regex', '$options']
  }
)

export { makeAuthPlugin, makeServicePlugin, BaseModel, models }
```

### Service Plugins

The following example creates a User class and registers it with the new `makeServicePlugin` utility function.  This same file is also a great place to add your service-level hooks, so they're shown, too.

```js
// src/store/services/users.js
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

```js
// src/store/store.js
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

To see `feathers-vuex` in a working vue-cli application, check out [`feathers-chat-vuex`](https://github.com/feathers-plus/feathers-chat-vuex).

### Global Configuration

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

### Note about feathers-reactive

Previous versions of this plugin required both RxJS and `feathers-reactive` to receive realtime updates.  `feathers-vuex@1.0.0` has socket messaging support built in and takes advantage of Vuex reactivity, so RxJS and `feathers-reactive` are no longer required or supported.

Each service module can also be individually configured.

## License

Licensed under the [MIT license](LICENSE).

Feathers-Vuex is developed and maintained by [Marshall Thompson](https://www.github.com/marshallswain).

