---
title: Mixins
---

> Coming in Version 2.0: First Class pagination support!  Details coming soon.

FeathersVuex mixins provide quick and easy best practices directly inside a component's viewModel.  They are similar to [Renderless Data Components](./components.md), but are more powerful for two reasons.

1. You can do lots of them together. Handle multiple queries against multiple services at the same time.  The Renderless Data Components aren't capable of handling more than one query without doing ugly nesting.
2. They bring the data directly into the component's actual viewModel.  The Renderless Data Components only pull the data into the template scope, so the only clean way to get access to the data was by passing it to a component as props.  This is a great solution until you run into number 1, above.

  Here are the steps to using it:

1. Import the `makeFindMixin` utility from FeathersVuex.
2. Register it in a component's mixins once for each query to be made in the component.
3. Provide a set of params in a computed property (getter only)
4. Iterate over the computed "items" prop named after the service.

```vue
<script>
import { makeFindMixin } from 'feathers-vuex' // Step 1

export default {
  name: 'ServerTaskList',
  mixins: [ makeFindMixin({ service: 'server-tasks' })], // Step 2
  computed: {
    serverTasksParams() {
      return { query: {} } // Step 3
    }
  }
}
</script>

<template>
  <div>
    <ul>
      <!-- Step 4 -->
      <li v-for="task in serverTasks" :key="task._id">
        {{task.name}}
      </li>
    </ul>
  </div>
</template>
```

In the above example, any records returned from the server will automatically show up when they become available.  It also automatically responds to realtime events when you're using one of FeathersJS's realtime transports, like Socket.io.

Notice in the above example that using the mixin automatically makes the `serverTasks` available in the template.  The mixins automatically setup a few properties in the viewModel based on the camelCased name of the service.  You can also provide a `name` attribute to override the defaults:

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

## Pagination with fall-through cacheing

The `makeFindMixin` in `feathers-vuex@2.x` features a great new, high performance, fall-through cacheing feature, which only uses a single query!  Read the service module documentation for details of how it works under the hood.  It really makes easy work of high-performance pagination.  To use the pagination, provide `$limit` and `$skip` attributes in `params.query`.  This is exactly the same way you would normally do with any FeathersJS query.  So this is completely transparent to how you'd normally do it.

Let's extend the first example on this page to support pagination.  We'll do the following:

1. Setup the `makeFindMixin` to use the `watch` property.
2. Add a `data` attribute to the component with `limit` and `skip` properties.
3. Reference the `limit` and `skip` in `params.query`.
4. Add methods for `previousPage` and `nextPage`
5. Create buttons for changing the limit and skip.

```vue
<script>
import { makeFindMixin } from 'feathers-vuex'

export default {
  name: 'ServerTaskList',
  mixins: [ makeFindMixin({ service: 'server-tasks', watch: true })], // Step 1
  data: () => ({ // Step 2
    limit: 5,
    skip: 0
  }),
  computed: {
    serverTasksParams() {
      return { query: { $limit: this.limit, $skip: this.skip } } // Step 3
    }
  },
  methods: { // Step 4
    previousPage() {
      this.skip = this.skip - this.limit
    },
    nextPage() {
      this.skip = this.skip + this.limit
    }
  }
}
</script>

<template>
  <div>
    <ul>
      <li v-for="task in serverTasks" :key="task._id">
        {{task.name}}
      </li>
    </ul>
    <!-- Step 5 -->
    <button @click="previousPage">Previous Page</button>
    <button @click="">Next Page</button>
  </div>
</template>
```

In the above example, since we've enabled the `watch` attribute on the makeFindMixin, every time the params change, the query will run again.  `feathers-vuex` will keep track of the queries and the pages that are visited, noting which records are returned on each page.  When a page is revisited, the data in the store will *immedately* display to the user.  The query will (by default) go out to the API server, and data will be updated in the background when the response arrives.

## Debouncing requests

What happens when a query with a watcher is attached to an attribute that might change rapidly?  A lot of API requests can get sent in succession.  If too many are sent, some of them will start to fail (a.k.a. bounce).  The `makeFindMixin` has a built-in utility for debouncing requests.  Enabling it makes it so requests only are sent after a specific amount of time has passed.  To enable it, pass a `debounce` attribute in the `params`, as shown in the next example.

Let's build on our previous example by adding a `search` feature where the user can type some input.  Here are the steps:

1. Add an attribute to the data to which we will bind user input. We'll call it `search`.
2. Modify params to include the `search` attribute in a supportive way.
3. Enable the the debounce feature.
4. Add an `input:text` to the template which binds to the attribute in step 1.

```vue
<script>
import { makeFindMixin } from 'feathers-vuex'

export default {
  name: 'ServerTaskList',
  mixins: [ makeFindMixin({ service: 'server-tasks', watch: true })],
  data: () => ({
    limit: 5,
    skip: 0,
    search: '' // Step 1
  }),
  computed: {
    serverTasksParams() {
      return {
        query: {
          $limit: this.limit,
          $skip: this.skip,
          name: { $regex: this.search, $options: 'igm' } // Step 2
        },
        debounce: 500 // Step 3
      }
    }
  },
  methods: {
    previousPage() {
      this.skip = this.skip - this.limit
    },
    nextPage() {
      this.skip = this.skip + this.limit
    }
  }
}
</script>

<template>
  <div>
    <!-- Step 4 -->
    <label for="server-task-search">
      Search Server Tasks by Name
    </label>
    <input
      v-model="search"
      id="server-task-search"
      type="text"
      placeholder="Enter a task name"
    />

    <ul>
      <li v-for="task in serverTasks" :key="task._id">
        {{task.name}}
      </li>
    </ul>
    <button @click="previousPage">Previous Page</button>
    <button @click="">Next Page</button>
  </div>
</template>
```

Notice a couple of things in the above example.  We enabled the internal `debounce` feature by simply adding `debounce: 500` to the params (outside the query).  This means that as the user types, requests will be queued inside a 500 ms interval.  The request will be sent as soon as the user stops typing for 500 milliseconds.  For example, if the user types a single character, waits ~400ms, then types a second character, the first request will be cancelled and another request will be sent 500ms after typing the second character.  It's more likely that these requests will not bounce. :)

We also added a `$regex` search to the params.  This is a MongoDB feature, which naturally also works with Mongoose services (since Mongoose is a tool built for MongoDB).  If you're using another type of service, you will need to come up with a solution for performing searches safely.  The solution will vary depending on the database used.

Feel free to make a PR for using something else that could be useful to the community!  We love those!

## Enabling live lists with pagination

The new fall-through cacheing pagination does not currently support live sorting of lists.  This means that when a new record arrives from the database, it doesn't automatically get sorted into the correct page and shuffle the other records around it.  The lists will update as the user navigates to previous/next pages.  Fixing this will be a top priority after 2.x ships.

If you would like to enable live lists again, it requires manual setup, meaning the way it has always been done in `1.x`: Use the `find` getter and pass a query to it.  To accomplish this goal, we'll override the items property in the component in order to

1. Provide a new query without the pagination properties.
2. Create a new query just for the local records.
3. Use the new `find&lt;Resource&gt;InStore` method (where Resource is the PascalCased name of the items)

```vue
<script>
import { makeFindMixin } from 'feathers-vuex'

export default {
  name: 'ServerTaskList',
  mixins: [ makeFindMixin({ service: 'server-tasks', watch: true })],
  data: () => ({
    limit: 5,
    skip: 0
  }),
  computed: {
    serverTasks() { // Step 1
      const query = { $sort: { name: 1 } }
      return this.findServerTasksInStore({ query })
    },
    serverTasksParams() {
      return { query: { $limit: this.limit, $skip: this.skip } }
    }
  },
  methods: { // Step 4
    previousPage() {
      this.skip = this.skip - this.limit
    },
    nextPage() {
      this.skip = this.skip + this.limit
    }
  }
}
</script>

<template>
  <div>
    <ul>
      <li v-for="task in serverTasks" :key="task._id">
        {{task.name}}
      </li>
    </ul>
    <button @click="previousPage">Previous Page</button>
    <button @click="">Next Page</button>
  </div>
</template>
```

In the above example, since we provided the `serverTasks` attribute, the `makeFindMixin` will not set one up to overwrite it.  This allows us to create our own query and call the alias for the `find` getter.  When we create this new query, let's remember to not use the same `$skip` and `$sort` as the API query. Otherwise, it's likely that no records from the Vuex store will show.

## Debugging the makeFindMixin

**Important: For the built in pagination features to work, you must not directly manipulate the `context.params` object in any hooks.**

If the makeFindMixin is not returning any results, but you can see the results coming in across the websocket  or rest transport, make sure you're not directly modifying the `context.params` object in a hook, as mentioned in bold, above. ;)  The best place to debug if this is your issue is in `make-find-mixin` in the `[ITEMS]` computed property.  Set a breakpoint at `const items = getItemsFromQueryInfo(pagination, queryInfo, keyedById)`.  Maybe even make it a conditional breakpoint around the `serviceName` variable: `serviceName === 'assets' && Object.keys(keyedById).length > 0`.

When you hit the above breakpoint, check the `keyedById` variable.  If it has records, but the `items` is an empty array, there may be a problem with the `queryInfo` not matching from the `context.params` getting modified.
