---
title: Auth Module API
---

The Auth module helps setup your app for login / logout.  It includes the following state by default:
```js
{
  accessToken: undefined, // The JWT
  payload: undefined, // The JWT payload

  // entityIdField is only in v1.7.0-pre.41 or later
  entityIdField: 'userId', // The property in the payload storing the user id

  isAuthenticatePending: false,
  isLogoutPending: false,

  errorOnAuthenticate: undefined,
  errorOnLogout: undefined
}
```

### Actions
The following actions are included in the `auth` module:
- `authenticate`: use instead of `feathersClient.authenticate()`
- `logout`: use instead of `feathersClient.logout()`
The Vuex auth store may not update if you use the feathers client version.


### Configuration
You can provide a `userService` in the auth plugin's options to automatically populate the user upon successful login.

```js
import Vuex from 'vuex'
import feathersClient from './feathers-client'
import feathersVuex from 'feathers-vuex'

const { auth } = feathersVuex(feathersClient, { idField: '_id' })

const store = new Vuex.Store({
  plugins: [
    auth({ userService: 'users' }) // if your user service endpoint is named 'users'
  ]
})
```
