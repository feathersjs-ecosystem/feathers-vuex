---
title: Renderless Data Components
---

Currently in `feathers-vuex@next`, a set of new, renderless data provider components -- `<feathers-vuex-find>` and `<feathers-vuex-get>` -- simplify performing queries against the store and/or the API server. They make the data available inside the component's default slot.

This first version does not assist with server-side pagination, but you can use it with your own pagination logic using the `query` or `fetchQuery` attributes, described later. To see why you might want to use these components, here are two example components that are functionally equivalent.

Here's what it looks like to use the new component:

```html
<template>
  <feathers-vuex-find service="categories" :query="{}" watch="query">
    <section class="admin-categories" slot-scope="{ items: categories }">
      {{categories}}
    </section>
  </feathers-vuex-find>
</template>

<script>
export default {
  name: 'admin-categories'
}
</script>

<style lang="scss">
</style>
```

The above example is functionally equivalent to this much longer example which doesn't use the new component:

```html
<template>
  <section class="admin-categories">
    {{categories}}
  </section>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'admin-categories',
  computed: {
    ...mapState('categories', { areCategoriesLoading: 'isFindPending' }),
    ...mapGetters('categories', { findCategoriesInStore: 'find' }),
    query () {
      return {}
    },
    categories () {
      return this.findCategoriesInStore({ query: this.query }).data
    }
  },
  methods: {
    ...mapActions('categories', { findCategories: 'find' })
  },
  created () {
    this.findCategories({ query: this.query })
  }
}
</script>

<style lang="scss">
</style>
```

> To level up your skills, consider this content by Adam Wathan.  He wrote a terrific *free* article about [Renderless Components in Vue.js](https://adamwathan.me/renderless-components-in-vuejs/). I highly recommend you read it. He also created the *paid/premium* [Advanced Vue Component Design](https://adamwathan.me/advanced-vue-component-design/) course. His material influenced the creation of this component.

## A note about the internal architecture

These components use Vuex getters (to query data from the local store) and actions (to query data from the API server).  When a `query` or `id` is provided, the components pull data from the API server and put it into the store.  That same `query` or `id` is then used to pull data from the local Vuex store.  Keep this in mind, especially when attempting to use server-side pagination.  To use server-side pagination, use the `query` prop for pulling data from the local vuex store, then use the `fetchQuery` prop to retrieve data from the API server.

## Registering the components

These components are automatically registered globally when using the FeathersVuex Vue plugin.

If you prefer to manually register the component, pass `{ components: false }` as options when using the FeathersVuex Vue plugin, then do the following:

```js
import { FeathersVuexFind, FeathersVuexGet } from 'feathers-vuex'

// in your component
components: {
  FeathersVuexData,
  FeathersVuexGet
}

// or globally registered
Vue.component('feathers-vuex-find', FeathersVuexFind)
Vue.component('feathers-vuex-get', FeathersVuexGet)
```

## Props for both components

The `<feathers-vuex-find>` and `feathers-vuex-get>` components share the following props in common. Unique props are found below.

- **service {String}** - **required** the service path. This must match a service that has already been registered with FeathersVuex.
- **query {Object}** - the query object. If only the `query` attribute is provided, the same query will be used for both the `find` getter and the `find` action. See the `fetchQuery` attribute for more information. When using server-side pagination, use the `fetchQuery` prop and the `query` prop for querying data from the local store. If the query is `null` or `undefined`, the query against both the API and store will be skipped. The find getter will return an empty array.
- **watch {String|Array}** - specify the attributes of the `query` or `fetchQuery` to watch. Pass 'query' to watch the entire query object.  Pass 'query.name' to watch the 'name' property of the query. Watch is turned off by default, so the API server will only be queried once, by default.  The only exception is for the `id` prop.  The `id` prop in the `feathers-vuex-get` component is always watched.  **Default: []**
- **fetchQuery {Object}** - when provided, the `fetchQuery` serves as the query for the API server. The `query` param will be used against the service's local Vuex store. **Default: undefined**
- **queryWhen {Boolean|Function}** - the query to the server will only be made when this evaluates to true.  **Default: true**
- **local {Boolean}** - when set to true, will only use the `query` prop to get data from the local Vuex store. It will disable queries to the API server. **Default:false**
- **editScope {Function}** - a utility function that allows you to modify the scope data, and even add attributes to it, before providing it to the default slot. You can also use it to pull data into the current component's data (though that may be less recommended, it can come in handy).  See the "Scope Data" section to learn more about what props are available in the scope object. **Default: scope => scope**

## Props unique to `<feathers-vuex-find>`
- **qid {String}** - The query identifier used for storing pagination data in the Vuex store. See the service module docs to see what you'll find inside.  The default value is a random 10-character string.  This means that by default, in theory, no two components will share the same pagination data, nor will they overwrite each other's pagination data.  You can, of course, force them to use the same pagination data by giving them both the same `qid`, if there's a use case for that.  **Default: randomString(10)**


## Props for `<feathers-vuex-get>`
The `<feathers-vuex-get>` component has these unique props.

- **id {Number|String}** - when performing a `get` request, serves as the id for the request. This is automatically watched, so if the `id` changes, an API request will be made and the data will be updated.  **Default: undefined**

## Scope Data

When using these components, the scope data will become available to the first element nested inside the `feathers-vuex-find` or `feathers-vuex-get` tags.  It's accessible using the `scope-data="props"` attribute:

```html
<feathers-vuex-find service="categories" :query="{}">
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

By default, the following props are available in the scope data:

**feathers-vuex-find**
- **items {Array}** The resulting array of records for find operations.
- **isFindPending {Boolean}** When there's an active request to the API server, this will be `true`.  This is not the same as the `isFindPending` from the Vuex state.  The value in the Vuex state is `true` whenever **any** component is querying data from that same service.  This `isFindPending` attribute is specific to each component instance.
- **pagination {Object}** pagination data from the Vuex store, keyed by the `qid` attribute.  By default, this will be specific to this component instance. (If you find a use case for sharing pagination between component instances, you can give both components the same `qid` string as a prop.)

**feathers-vuex-get**
- **item {Object}**  The resulting object for `get` operations
- **isGetPending {Boolean}** The same as the `isFindPending`, but for `get` requests.

It's also possible to modify the scope data by passing a function as the `edit-scope` prop.  See the example for [modifying scope data](#Modify-the-scope-data)

### Destructuring props

Use the object destructuring syntax to pull specific variables out of the `slot-scope` object.  In the following example, instead of using `slot-scope="props"`, it directly accesses the `items` prop through destructuring:

```html
<feathers-vuex-find service="categories" :query="{}">
  <div slot-scope="{ items }">
    {{items}}
  </div>
</feathers-vuex-find>
```

### Renaming props with destructuring

You can also rename scope props through the Object destructuring syntax.  The  `slot-scope` in the next example shows how to give the items a more-descriptive name:

```html
<feathers-vuex-find service="categories" :query="{}">
  <div slot-scope="{ items: categories }">
    {{categories}}
  </div>
</feathers-vuex-find>
```

## Usage Examples

### A basic find all

In this example, only the `service` attribute is provided. There is no `query` nor `id` provided, so no queries are made. So `props.items` in this example returns an empty array.

```html
<feathers-vuex-find service="todos">
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

### Fetch data from the API and the same data from the Vuex store

This example fetches data from the API server because a query was provided.  Internally, this same `query` is used for both the `find` action and the `find` getter.  Read other examples to see how to use distinct queries.  Be aware that if you use pagination directives like `$skip` or `$limit`, you must use two queries to get the records you desire.

```html
<feathers-vuex-find service="todos" :query="{}">
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

### Only get data from the local Vuex store

If you've already pulled a bunch of data from the server, you can use the `local` prop to only query the local data:

```html
<feathers-vuex-find service="todos" :query="{}" local>
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

### Watch the query and re-fetch from the API

Sometimes you want to query new data from the server whenever the query changes.  Pass an array of attribute names to the `watch` attribute re-query whenever upon change.  This example watches the entire query object:

```html
<feathers-vuex-find
  service="todos"
  :query="{ isComplete: true }"
  watch="query"
>
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```


This next example watches a single prop from the query:

```html
<feathers-vuex-find
  service="todos"
  :query="{ isComplete: true, dueDate: 'today' }"
  watch="query.dueDate"
>
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

You can also provide an array of strings to watch multiple properties:

```html
<feathers-vuex-find
  service="dogs"
  :query="{ breed: 'mixed', bites: true, hasWorms: false }"
  :watch="['query.breed', 'query.bites']"
>
  <div slot-scope="props">
    {{props.items}}
  </div>
</feathers-vuex-find>
```

### Use a distinct `query` and `fetchQuery`

In this scenario, the `fetchQuery` is be used to grab a larger dataset from the API server (all todos with a matching `userId`). The `query` is used by the `find` getter to display a subset of this data from the store.  If the `isComplete` attribute gets set to `true`, only completed todos will be displayed.  Since a `fetchQuery` is provided, the `watch` strings will be modified internally to watch the `fetchQuery` object.  This means if you are watching `query.userId` and you add a `fetchQuery`, the component is smart enough to know you meant `fetchQuery.userId`. You don't have to rewrite your `watch` attribute after adding a `fetchQuery` prop.

```html
<template>
  <feathers-vuex-find
    service="todos"
    :query="{ isComplete }"
    :fetchQuery="{ userId }"
    watch="query.userId"
  >
    <div slot-scope="{ items: todos }">
      {{todos}}
    </div>
  </feathers-vuex-find>
</template>

<script>
export default {
  data: () => ({
    isComplete: false,
    userId: 1
  })
}
</script>
```

### Modify the scope data

The `edit-scope` function allows you to modify the scope before passing it down to the default slot.  This feature can be super useful for preparing the data for the template.  The `prepareCategories` method in this next example adds two properties to the scope data, which are used to create a nested category structure:

```html
<template>
  <feathers-vuex-find
    service="categories"
    :query="{}"
    :edit-scope="prepareCategories"
  >
    <ul slot-scope="{ parentCategories, categoriesByParent }">
      <li v-for="parent in parentCategories" :key="parent._id">
        <p>{{parent.name}}</p>
        <ul>
          <li v-for="child in categoriesByParent[parent.path]" :key="child._id">
            {{child.name}}
          </li>
        </ul>
      </li>
    </ul>
  </feathers-vuex-find>
</template>

<script>
export default {
  methods: {
    prepareCategories (scope) {
      scope.parentCategories = scope.items.filter(cat => !cat.path.includes('/'))
      scope.categoriesByParent = scope.parentCategories.reduce((acc, parentCat) => {
        acc[parentCat.path] = scope.items.filter(cat => {
          return cat.path.includes(parentCat.path) && cat.path !== parentCat.path
        })
        return acc
      }, {})
    }
  }
}
</script>
```

### Query when certain conditions are met

Sometimes you only want to query the API server when certain conditions are met.  This example shows how to query the API server when the `userSearch` has as least three characters.  This property does not affect the internal `find` getter, so the `items` will still update when the `userSearch` property has fewer than three characters, just no API request will be made.  The `isFindPending` attribute is used to indicate when data is being loaded from the server.

```html
<template>
  <div>
    <input type="text" v-model="userSearch"/>

    <feathers-vuex-find
      service="users"
      :query="usersQuery"
      watch="query"
      :queryWhen="userSearch.length > 2"
    >
      <ul
        slot-scope="{ items: users, isFindPending: areUsersLoading }"
        :class="[ areUsersLoading && 'is-loading' ]"
      >
        <li v-for="user in users" :key="user._id">
          {{user.email}}
        </li>
      </ul>
    </feathers-vuex-find>
  </div>
</template>

<script>
export default {
  data: () => ({
    userSearch: ''
  }),
  computed: {
    usersQuery () {
      return {
        email: { $regex: this.userSearch, $options: 'igm' },
        $sort: { email: 1 }
      }
    }
  }
}
</script>
```

### Use a get request

You can perform `get` requests with the `feathers-vuex-get` component and its `id` property.  In the next example, when the `selectedUserId` changes, a get request will automatically fetch and display the matching user record.  It also shows how to use the `isGetPending` prop to update the UI

```html
<feathers-vuex-get
  service="todos"
  :id="selectedUserId"
>
  <div slot-scope="{ item: currentUser, isGetPending }">
    <div v-if="isGetPending" class="loading"> loading... </div>
    {{currentUser}}
  </div>
</feathers-vuex-get>
```

