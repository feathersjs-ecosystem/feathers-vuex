# feathers-vuex

[![Build Status](https://travis-ci.org/feathers-plus/feathers-vuex.png?branch=master)](https://travis-ci.org/feathers-plus/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathers-plus/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathers-plus/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

![feathers-vuex service logo](./service-logo.png)

> Integrate the Feathers Client into Vuex

`feathers-vuex` is a first class integration of the Feathers Client and Vuex.  It implements many Redux best practices under the hood, eliminates *a lot* of boilerplate code, and still allows you to easily customize the Vuex store.


___________________________________

> NOTICE: this module is almost (but not quite) fully compatible with Feathers V4.  The authentication module is written for Feathers V3.  If you're going to use Feathers V4, please search the [GitHub issues](https://github.com/feathers-plus/feathers-vuex/issues) for "feathers crow authentication" for workarounds you can implement until this module is properly updated.
>
> IN THE MEANTIME, it is highly recommended that you use the [pre-release version](https://github.com/feathers-plus/feathers-vuex/pull/216), which is production ready for Feathers V4.  A proper migration guide and updated documentation are currently in progress.

___________________________________



## Features

- Fully powered by Vuex & Feathers
- Realtime By Default
- Actions With Reactive Data
- Local Queries
- Fall-Through Caching
- Feathers Query Syntax
- $FeathersVuex Vue Plugin
- Live Queries
- Per-Service Data Modeling
- Clone & Commit
- Vuex Strict Mode
- Per-Record Defaults
- Data Level Computes
- Relation Support

## Demo & Documentation

[Demo](https://codesandbox.io/s/xk52mqm7o)

See [https://feathers-vuex.feathers-plus.com/index.html](https://feathers-vuex.feathers-plus.com/index.html) for full documentation.

## Installation

```console
npm install feathers-vuex --save
```

## Basic Examples

To setup `feathers-vuex`, we first need to setup a Feathers Client.  Here's an example using the latest `@feathersjs` npm packages.

**feathers-client.js:**

```js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'

const socket = io('http://localhost:3030', {transports: ['websocket']})

const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))

export default feathersClient
```

And here's how you would integrate the Feathers Client into the Vuex store:

**store/index.js:**

```js
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
      autoRemove: true, // Automatically remove records missing from responses (only use with feathers-rest)
      enableEvents: false, // Turn off socket event listeners. It's true by default
      addOnUpsert: true, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them. It's false by default
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

## Contributing

`feathers-vuex` tests run using StealJS, which is a 100% browser-based bundler.

Once you’ve installed all of the npm packages, start an `http-server` in the root folder:

`cd feathers-vuex`

`npm i -g http-server`

`http-server`

Then open the resulting page in your browser and navigate to the test folder to run the tests.

## License

Copyright (c) Forever and Ever, or at least the current year.

Licensed under the [MIT license](LICENSE).
