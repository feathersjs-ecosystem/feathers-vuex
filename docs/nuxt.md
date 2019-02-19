---
title: Nuxt
---

## Working with Auth & Nuxt

`feathers-vuex@1.0.0` ships with utilities that help with Nuxt auth related to JSON Web Tokens (JWT).  The most important utility is the `initAuth` utility.  It's for use during Nuxt's `nuxtServerInit` method, and sets up auth data automatically.  Here's an example store that uses it:

```js
import Vuex from 'vuex'
import feathersClient from './feathers-client'
import feathersVuex, { initAuth } from 'feathers-vuex'

const { service, auth } = feathersVuex(feathersClient)

const createStore = () => {
  return new Vuex.Store({
    state: {},
    mutations: {
      increment (state) {
        state.counter++
      }
    },
    actions: {
      nuxtServerInit ({ commit, dispatch }, { req }) {
        return initAuth({
          commit,
          dispatch,
          req,
          moduleName: 'auth',
          cookieName: 'feathers-jwt'
        })
      }
    },
    plugins: [
      service('courses'),
      auth({
        state: {
          publicPages: [
            'login',
            'signup'
          ]
        }
      })
    ]
  })
}

export default createStore
```

Notice in the above example, I've added a `publicPages` property to the auth state.  Let's now use this state to redirect the browser when it's not on a public page and there's no auth:

In your Nuxt project, create the file `/middleware/auth.js`.  Then edit the `nuxt.config.js` and add after the `head` property, add a string that references this routing middleware so it looks like this:

*// nuxt.config.js*
```js
router: {
  middleware: ['auth']
},
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

```
import { CookieStorage } from 'cookie-storage'

const feathersClient = feathers()
  .configure(auth({ storage: new CookieStorage() }))
```
