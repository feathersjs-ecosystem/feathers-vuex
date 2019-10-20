---
title: Vue Plugin
---

# The Vue Plugin

This `feathers-vuex` release includes a Vue plugin which gives all of your components easy access to the  data modeling classes.  It also automatically registers the included components.  The below example is based on the [setup instructions in the API overview](/api-overview.html#setup).

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

## Using the Vue Plugin

Once registered, you'll have access to the `this.$FeathersVuex` object, which contains references to the Model classes, keyed by name.  The name of the model class is automatically inflected to singular, initial caps, based on the last section of the service path (split by `/`).  Here are some examples of what this looks like:

| Service Name              | Model Name in `$FeathersVuex` |
| ------------------------- | ----------------------------- |
| /cart                     | Cart                          |
| /todos                    | Todo                          |
| /v1/districts             | District                      |
| /some/deeply/nested/items | Item                          |

The `$FeathersVuex` object is available on the Vue object, directly at `Vue.$FeathersVuex`, as well as on the prototype, making it available in components:

```js
// In your Vue component
created () {
  const todo = new this.$FeathersVuex.Todo({ description: 'Do something!' })
  // `todo` is now a model instance
}
```

## Included Components

When you register the Vue Plugin, a few components are automatically globally registered:

- The [Renderless Data components](/data-components.html)
- The [`FeathersVuexFormWrapper` component](/feathers-vuex-form-wrapper.html)

You can pass `components: false` in the options to not globally register the component:

```js
Vue.use(FeathersVuex, { components: false })
```