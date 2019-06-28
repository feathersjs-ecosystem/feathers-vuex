---
title: Mixins
---

> Coming in Version 2.0: First Class pagination support!  Details coming soon.

FeathersVuex mixins provide quick and easy best practices directly inside a component's viewModel.  They are similar to [Renderless Data Components](./components.md), but are more powerful for two reasons.

1. You can do lots of them together. Handle multiple queries against multiple services at the same time.  The Renderless Data Components aren't capable of handling more than one query without doing ugly nesting.
2. They bring the data directly into the component's actual viewModel.  The Renderless Data Components only pull the data into the template scope, so the only clean way to get access to the data was by passing it to a component as props.  This is a great solution until you run into number 1, above.

Here's an example of how to use a mixin.

```html
<template>
  <div class="test-mixin">
    {{todos}}
  </div>
</template>

<script>
import { makeFindMixin } from 'feathers-vuex'

export default {
  name: 'test-mixins',
  mixins: [
    makeFindMixin({ service: 'todos' })
  ],
  computed: {
    // It's going to automatically look for a prop named `todosParams`
    // This is based on the camelCased service name
    todosParams () {
      return { query: {} }
    }
  }
}
</script>

<style lang="scss">
</style>
```

Notice in the above example that using the mixin automatically makes the `todos` available in the template.  The mixins automatically setup a few properties in the viewModel based on the camelCased name of the service.  You can also provide a `name` attribute.

## Options

### for `makeFindMixin` and `makeGetMixin`

The `makeFindMixin` and `makeGetMixin` utilities share the following options in common. Unique options are found further down.

- **service {String}** - **required** the service path. This must match a service that has already been registered with FeathersVuex.
- **name {String}** - The name to use in all of the dynamically-generated property names. See the section about Dynamically Generated Props
- **items {String}** - The attribute name to use for the records.

- **params {String|Function}** - One of two possible params attributes.  (The other is `fetchParams`)  When only `params` is provided, it will be used for both the `find` getter and the `find` action.  When using server-side pagination, use `fetchParams` for server communciation and the `params` prop for pulling data from the local store. If the params is `null` or `undefined`, the query against both the API will be skipped. The find getter will return an empty array. **Default {String}: `${camelCasedService}Params`** (So, by default, it will attempt to use the property on the component called serviceName + "Params")
  - **{String}** - The name of the attribute in the current component which holds or returns the query object.
  - **{Function}** - A provided function will become a computed property in the current component.

- **watch {String|Array}** - specifies the attributes of the `params` or `fetchParams` to watch.  When a watched prop changes, a new request will be made to the API server. Pass 'params' to watch the entire params object.  Pass 'params.query.name' to watch the 'name' property of the query. Watch is turned off by default, meaning only one initial request is made. **Default {String}: `${camelCasedService}Params`**

- **fetchParams {String|Function}** - when provided, the `fetchParams` serves as the params for the API server request. When `fetchParams` is used, the `param` attribute will be used against the service's local Vuex store. **Default: undefined**
  - **{String}** - The name of the attribute in the current component which holds or returns the params object.
  - **{Function}** - A provided function will become a computed property in the current component.

- **queryWhen {Boolean|String|Function}** - the query to the server will only be made when this evaluates to true.  **Default: true**
  - **{Boolean}** - As a boolean, the value provided determines whether this is on or off.
  - **{String}** - The name of the component's prop to use as the value.
  - **{Function}** - Any provided function will become a method in the component and will receive the current params object as an argument.

- **local {Boolean|String|Function}** - when true, will only use the `params` prop to pull data from the local Vuex store. It will disable queries to the API server. The value of `local` will override `queryWhen`. **Default:false**
  - **{Boolean}** - As a boolean, the value provided determines whether this is on or off.
  - **{String}** - The name of the component's prop to use as the value.
  - **{Function}** - Any provided function will become a computed property in the component and will be used to determine its value.

### Options for only `makeFindMixin`

The `makeFindMixin` has these unique options:

- **qid {String}** - The "query identifier" ("qid", for short) is used for storing pagination data in the Vuex store. See the service module docs to see what you'll find inside.  The `qid` and its accompanying pagination data from the store will eventually be used for cacheing and preventing duplicate queries to the API.

### Options for only `makeGetMixin`

The `makeGetMixin` has these unique options:

- **id {String|Function}** - when performing a `get` request, serves as the id for the request. This is automatically watched, so if the `id` changes, an API request will be made and the data will be updated.  If `undefined` or `null`, no request will be made.  **Default: undefined**
  - **{String}** - The name of the component's prop to use as the value.
  - **{Function}** - Any provided function will become a computed property in the component and will be used to determine its value.

## Dynamically Generated Props

Based on what options you provide to each mixin, some dynamically-generated props will be added to the current component.  Note that the example below only shows the return values from the computes, not the functions.

```js
makeFindMixin({ service: 'videos' }) = {
  data: () => ({
    isFindVideosPending: false,
    videosLocal: false,
    videosQid: 'default',
    videosQueryWhen: true,
    videosWatch: []
  }),
  // Only showing the return values, not the actual functions
  computed: {
    // pulled from the store using the find getter
    videos: [ /* results */ ],

    // The pagination data with matching qid from the store
    videosPaginationData: {
      queriedAt: 1539682100148, // the timestamp of the last query
      query: {}, // The last query used with this qid
      ids: [], // The ids of the records returned in the response
      limit: 20, // based on the response from the server
      skip: 0, // The value of the $skip param in the query
      total: 1 // The total as reported by the server.
    },

    // The mixin will expect to find this. This won't be created automatically.
    videosQuery () {}
  }
}
```

If you were to handle two queries from the same service, you would use the `name` attribute to rename one of them.  The results would be named accordingly.  Note that the example below only shows the return values from the computes, not the functions.

```js
makeFindMixin({ service: 'videos', name: 'myVideos' }) = {
  data: () => ({
    isFindMyVideosPending: false,
    myVideosLocal: false,
    myVideosQid: 'default',
    myVideosQueryWhen: true,
    myVideosWatch: []
  }),
  // Only showing the return values, not the actual functions
  computed: {
    // pulled from the store using the find getter
    myVideos: [ /* results */ ],

    // The pagination data with matching qid from the store
    myVideosPaginationData: {
      queriedAt: 1539682100148, // the timestamp of the last query
      query: {}, // The last query used with this qid
      ids: [], // The ids of the records returned in the response
      limit: 20, // based on the response from the server
      skip: 0, // The value of the $skip param in the query
      total: 1 // The total as reported by the server.
    },

    // The mixin will expect to find this. This won't be created automatically.
    myVideosQuery () {}
  }
}
```

## Using a dynamic service

It's possible to change the service name on the fly.  To do this, pass a function (which becomes a computed property) that returns another string property from the viewModel.  Below is an example of how to set that up.  The `serviceName` attribute is set to `"videos"`, initially.  The `setTimeout` in the `created` method changes the value to `"users"` after three seconds.  When the serviceName changes, the users service is queried automatically.  The `items` property will then update to be the newly fetched users instead of the video records that it contained before.  The `items` option is used to rename the items to something more generic.

```html
<template>
  <div>
    {{items}}
  </div>
</template>

<script>
import { makeFindMixin } from 'feathers-vuex'

export default {
  name: 'my-component',
  data: () => ({
    serviceName: 'videos'
  }),
  mixins: [
    makeFindMixin({
      service () { return this.serviceName },
      name: 'service', // the default value when `service` is a function.
      items: 'items' // the default value when `service` is a function.
    })
  ],
  computed: {
    serviceParams () {
      return { query: { $limit: 1 } }
    }
  },
  created () {
    setTimeout(() => {
      this.serviceName = 'users'
    }, 3000)
  }
}
</script>

<style lang="scss">
</style>
```

In the above example, the mixin data would look like this:

```js
const mixedInDataFromAboveExample = {
  data: () => ({
    isFindServicePending: false,
    serviceLocal: false,
    serviceQid: 'default',
    serviceQueryWhen: true,
    serviceWatch: []
  }),
  // Only showing the return values, not the actual functions
  computed: {
    items: [ /* results */ ],

    // The pagination data with matching qid from the store
    servicePaginationData: {},

    // The mixin will expect to find this. This won't be created automatically.
    serviceQuery () {}
  }
}
```
