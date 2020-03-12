---
title: Nuxt
---

# Nuxt

### Access `$FeathersVuex` models in Nuxt `asyncData`

In `feathers-vuex@2.x`, you can get access to the `$FeathersVuex` object by importing the `models` object from the main export:

```
import { models } from 'feathers-vuex'
```

The `models` and `$FeathersVuex` variables are the same object.

## Preventing Memory Leaks

The default settings of Feathers-Vuex include having realtime events enabled by default.  This will result in increased memory usage over time on the SSR server.  It can be turned off when you configure `feathers-vuex`.  The example below has been modified from the example of [Setting up the Feathers Client & Feathers-Vuex](./getting-started.html#feathers-client-feathers-vuex).  Look specifically at the `enableEvents` option.

```js
const { makeServicePlugin, makeAuthPlugin, BaseModel, models, FeathersVuex } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api',
    idField: '_id',
    whitelist: ['$regex', '$options'],
    enableEvents: process.client // No events for SSR server
  }
)
```

## Working with Auth & Nuxt

`feathers-vuex@1.0.0^` ships with utilities that help with Nuxt auth related to JSON Web Tokens (JWT).  The most important utility is the `initAuth` utility.  It's for use during Nuxt's `nuxtServerInit` method, and sets up auth data automatically.

`initAuth` will do the following:
1. Get the accessToken from the `req` passed in
2. Get the payload from the token
3. commit the token and payload to the store with `setAccessToken` and `setPayload`
4. Set the access token on the feathers client instance so that the next time authenticate is called, it will have the JWT from the `req` to authenticate with the server.

Here's an example store that uses it:

```js
// ~/plugins/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex, { initAuth } from 'feathers-vuex'

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
    whitelist: ['$regex', '$options'],
    enableEvents: process.client // No events for SSR server
  }
)

export { makeAuthPlugin, makeServicePlugin, initAuth, BaseModel, models, FeathersVuex }
```

```js
// ~/store/index.js
import { makeAuthPlugin, initAuth, models } from '~/plugins/feathers'
const auth = makeAuthPlugin({
  userService: 'users',
  state: {
    publicPages: [
      'login',
      'signup'
    ]
  }
})

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

export const state = () => ({
  // Your custom state
})

export const mutations = {
  // Your custom mutations
}

export const actions = {
  nuxtServerInit ({ commit, dispatch }, { req }) {
    return initAuth({
      commit,
      dispatch,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
  }
}

export const getters = {
  // Your custom getters
}

export const plugins = [ ...servicePlugins, auth ]
```

Notice in the above example, I've added a `publicPages` property to the auth state.  Let's now use this state to redirect the browser when it's not on a public page and there's no auth:

In your Nuxt project, create the file `/middleware/auth.js`.  Then edit the `nuxt.config.js` and add after the `head` property, add a string that references this routing middleware so it looks like this:

```js
// nuxt.config.js
router: {
  middleware: ['auth']
}
```

Now open the middleware and paste the following content.  All it does is redirect the page if there's no auth data in the store.

```js
// If it's a private page and there's no payload, redirect.
export default function (context) {
  const { store, redirect, route } = context
  const { auth } = store.state

  if (!auth.publicPages.includes(route.name) && !auth.payload) {
    return redirect('/login')
  }
}
```

For a summary, the `initAuth` function will make auth available in the state without much configuration.

## Authentication storage with Nuxt

Since Nuxt is running both client- and server side, it has limits on the availability of certain browser specific variables like `window`. Because of that, trying to configure the feathers client to use `window.localStorage` will result in an error or unexpected / not working behaviour. There's a simple solution though:

When you configure the auth module in your feathers-client, use [cookie-storage](https://www.npmjs.com/package/cookie-storage) instead of `window.localStorage` to store the authentication data inside a cookie.

```js
import { CookieStorage } from 'cookie-storage'

const feathersClient = feathers()
  .configure(auth({ storage: new CookieStorage() }))
```

## Server and Client in different end points

If you have your feathersjs server in a different end point from your client (Ex. api.yourdomain.com - feathers / yourdomain.com - vue) your cookies wont be shared beetween server and client so you will have to authenticate your client manualy.

The best solution is to use [nuxt-client-init-module](https://www.npmjs.com/package/nuxt-client-init-module).

First we add it to our app using `npm install nuxt-client-init-module` or `yarn add nuxt-client-init-module`, and add it to our `nuxt.config.js` modules:

```js
export default {
  ...
  modules: [
    'nuxt-client-init-module'
  ],
}
```

Now, based on the auth example above, we will edit our `~/store/index.js` file.

```js
// ~/store/index.js
import { makeAuthPlugin, initAuth, models } from '~/plugins/feathers'
const auth = makeAuthPlugin({
  userService: 'users',
  state: {
    publicPages: []
  },
  actions: {
    // Handles initial authentication
    onInitAuth ({ state, dispatch }, payload) {
      if (payload) {
        dispatch('authenticate', { strategy: 'jwt', accessToken: state.accessToken })
          .then((result) => {
            // handle success like a boss
            console.log('loged in')
          })
          .catch((error) => {
            // handle error like a boss
            console.log(error)
          })
      }
    }
  }
})

...

export const actions = {
  nuxtServerInit ({ commit, dispatch }, { req }) {
    return initAuth({
      commit,
      dispatch,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
  },
  nuxtClientInit ({ state, dispatch, commit }, context) {
    // Run the authentication with the access token hydrated from the server store
    if (state.auth.accessToken) {
      return dispatch('auth/onInitAuth', state.auth.payload)
    }
  }
}

...

```

## Server side hydration <Badge text="3.0.0+" />

When using nuxt SSR and you make requests in the server, using `fetch` or `asyncData`, nuxt will send this data and hydrate the store on client init.

Because this hydration is done by nuxt, the documents do not inherit from their right classes and all documents are created as simple javascript objects.

`feathers-vuex@3.x.x^` ships with the `hydrateApi` utility for this use case.

We only have to pass the api's that we need to hydarate on client start to the `nuxtClientInit`.

```js
// ~/plugins/feathers-client.js
import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex, { initAuth, hydrateApi } from 'feathers-vuex'

...

export { makeAuthPlugin, makeServicePlugin, initAuth, hydrateApi, BaseModel, models, FeathersVuex }
```

```js
// ~/store/index.js
import { makeAuthPlugin, initAuth, hydrateApi, models } from '~/plugins/feathers'

...

export const actions = {
  nuxtServerInit ({ commit, dispatch }, { req }) {
    return initAuth({
      commit,
      dispatch,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
  },
  nuxtClientInit ({ state, dispatch, commit }, context) {
    hydrateApi({ api: models.api })
    // Call once for each API to be updated
    hydrateApi({ api: models.otherApi })
    // Run the authentication with the access token hydrated from the server store
    if (state.auth.accessToken) {
      return dispatch('auth/onInitAuth', state.auth.payload)
    }
  }
}

...

```

## Full nuxt configuration example

[Check a full nuxt exemple in the common patterns section](./common-patterns.md#full-nuxt-example)
