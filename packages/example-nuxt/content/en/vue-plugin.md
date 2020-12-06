---
title: Vue Plugin
description: ''
position: 2
---

# The Vue Plugin

This `feathers-vuex` release includes a Vue plugin which gives all of your components easy access to the data modeling classes. It also automatically registers the included components. The below example is based on the [setup instructions in the API overview](/api-overview.html#setup).

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
const servicePlugins = requireModule.keys().map(modulePath => requireModule(modulePath).default)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  plugins: [...servicePlugins, auth],
})
```

## Using the Vue Plugin

Once registered, you'll have access to the `this.$FeathersVuex` object. _In version 2.0, there is a breaking change to this object's structure._ Instead of directly containing references to the Model classes, the top level is keyed by `serverAlias`. Each `serverAlias` then contains the Models, keyed by name. This allows Feathers-Vuex 2.0 to support multiple FeathersJS servers in the same app. This new API means that the following change is required wherever you reference a Model class:

```js
// 1.x way
new this.$FeathersVuex.User({})

// 2.x way
new this.$FeathersVuex.api.User({}) // Assuming default serverAlias of `api`.
new this.$FeathersVuex.myApi.user({}) // If you customized the serverAlias to be `myApi`.
```

The name of the model class is automatically inflected to singular, initial caps, based on the last section of the service path (split by `/`). Here are some examples of what this looks like:

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

## New in 2.0

In Feathers-Vuex 2.0, the \$FeathersVuex object is available as the 'models' export in the global package scope. This means you can do the following anywhere in your app:

```js
import { models } from 'feathers-vuex'

const user = new models.api.User({
  email: 'test@test.com',
})
```

## Included Components

When you register the Vue Plugin, a few components are automatically globally registered:

- The [Renderless Data components](/data-components.html)
- The [`FeathersVuexFormWrapper` component](/feathers-vuex-forms.html#feathersvuexformwrapper)
- The [`FeathersVuexInputWrapper` component](/feathers-vuex-forms.html#feathersvuexinputwrapper)
- The [`FeathersVuexPagination` component](/composition-api.html#feathersvuexpagination)

You can pass `components: false` in the options to not globally register the component:

```js
Vue.use(FeathersVuex, { components: false })
```
