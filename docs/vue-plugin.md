---
title: Vue Plugin API
---

This `feathers-vuex` release includes a Vue plugin which gives all of your components easy access to the exciting new Models feature.  It also automatically registers the `feathers-vuex-data` component.  You can pass `components: false` in the options to not globally register the component.  Here's how to use the plugin:

```js
import Vue from 'vue'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'
import feathersClient from './feathers-client'

// Get a reference to the FeathersVuex plugin
const { service, auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })

// Register the plugin with Vue.
Vue.use(FeathersVuex)
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [
    service('todos')
  ]
})
```

Now, in your components, you'll have access to the `this.$FeathersVuex` object, which contains references to the Model classes, keyed by name.  The name of the model class is automatically inflected to singular, initial caps, based on the last section of the service path (split by `/`).  Here are some examples of what this looks like:

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

