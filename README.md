# feathers-vuex

[![Build Status](https://travis-ci.org/feathersjs/feathers-vuex.png?branch=master)](https://travis-ci.org/feathersjs/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

> Vuex (Vue.js) integrated as a Feathers Client plugin

## Installation

```
npm install feathers-vuex --save
```

## Documentation

There are three modules included:
1. The Feathers module keeps a list of all services with vuex stores attached.
2. The Service module adds a Vuex store for new services.
3. The Auth module sets up the Vuex store for authentication / logout.

## Feathers Module
Includes the following state
```js
{
  services: {
    all: {}, // The same as feathersClient.services, keyed by path name.
    vuex: {} // All services that have been integrated into Vuex, keyed by path name
  }
}
```

## Service Module
Automatically sets up newly-created services into the Vuex store.

### Actions
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
