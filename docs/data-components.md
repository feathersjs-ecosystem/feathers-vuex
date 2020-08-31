---
title: Renderless Data Components
sidebarDepth: 3
---

# Renderless Data Components

There are two new renderless data provider components: `<FeathersVuexFind>` and `<FeathersVuexGet>`. They simplify performing queries against the store and/or the API server. They make the data available inside each component's default slot.

To see why you might want to use these components, below are two example components that are functionally equivalent.

Here's what it looks like to use the new component:

```html
<template>
  <FeathersVuexFind v-slot="{ items: categories }" service="categories" :params="{ query: {} }" watch="params">
    <section class="admin-categories">
      {{categories}}
    </section>
  </FeathersVuexFind>
</template>

<script>
export default {
  name: 'admin-categories'
}
</script>
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
```

> To level up your skills, consider this content by Adam Wathan.  He wrote a terrific *free* article about [Renderless Components in Vue.js](https://adamwathan.me/renderless-components-in-vuejs/). I highly recommend you read it. He also created the *paid/premium* [Advanced Vue Component Design](https://adamwathan.me/advanced-vue-component-design/) course. His material influenced the creation of this component.

## FeathersVuexFind

The `FeathersVuexFind` component retrieves data from the API server, puts it in the Vuex store, then transparently retrieves the live, reactive data from the store and displays it to the user.

### Example

```vue
<FeathersVuexFind v-slot="{ items: users }" service="users" :params="{ query: {} }" watch="query">
  <section>
    {{users}}
  </section>
</FeathersVuexFind>
```

### Props

- `service {String}` - **required** the service path. This must match a service that has already been registered with FeathersVuex.
- `query {Object}` <Badge text="deprecated" type="warning"/> **use `params` instead** - the query object. If only the `query` attribute is provided, the same query will be used for both the `find` getter and the `find` action. See the `fetchQuery` attribute for more information. When using server-side pagination, use the `fetchQuery` prop and the `query` prop for querying data from the local store. If the query is `null` or `undefined`, the query against both the API and store will be skipped. The find getter will return an empty array.
- `watch {String|Array}` - specify the attributes of the `params` or `fetchParams` to watch. Pass 'params' to watch the entire params object. Pass 'params.query.name' to watch the 'name' property of the query. Watch is turned off by default, so the API server will only be queried once, by default. **Default: []**
- `fetchQuery {Object}` <Badge text="deprecated" type="warning"/> **use `fetchParams` instead** - when provided, the `fetchQuery` serves as the query for the API server. The `query` param will be used against the service's local Vuex store. **Default: undefined**
- `params {Object}` - the params object. If only the `params` attribute is provided, te same params will be used for both the `find` getter and the `find` action. See the `fetchParams` attribute for more information. <Badge text="3.11.0+" />
- `fetchParams {Object}` - when provided, the `fetchParams` servers as the params for the API server. The `params` will be used against the service's local Vuex store. <Badge text="3.11.0+" />
- `queryWhen {Boolean|Function}` - the query to the server will only be made when this evaluates to true.  **Default: true**
- `local {Boolean}` - when set to true, will only use the `query` prop to get data from the local Vuex store. It will disable queries to the API server. **Default:false**
- `editScope {Function}` - a utility function that allows you to modify the scope data, and even add attributes to it, before providing it to the default slot. You can also use it to pull data into the current component's data (though that may be less recommended, it can come in handy).  See the "Scope Data" section to learn more about what props are available in the scope object. **Default: scope => scope**
- `temps {Boolean}` <Badge text="deprecated" type="warning"/> **use `params: { query: {}, temps: true }` instead** - Enable `temps` to include temporary records (from `state.tempsById`) in the find getter results. **Default: false**
- `qid {String}` - The query identifier used for storing pagination data in the Vuex store. See the service module docs to see what you'll find inside. The default value is a random 10-character string. This means that by default, in theory, no two components will share the same pagination data, nor will they overwrite each other's pagination data. You can, of course, force them to use the same pagination data by giving them both the same `qid`, if there's a use case for that. **Default: randomString(10)**

### Scope Data

- `items {Array}` - The resulting array of records for find operations.
- `isFindPending {Boolean}` - When there's an active request to the API server, this will be `true`.  This is not the same as the `isFindPending` from the Vuex state.  The value in the Vuex state is `true` whenever **any** component is querying data from that same service.  This `isFindPending` attribute is specific to each component instance.
- `pagination {Object}` - pagination data from the Vuex store, keyed by the `qid` attribute.  By default, this will be specific to this component instance. (If you find a use case for sharing pagination between component instances, you can give both components the same `qid` string as a prop.)
- `queryInfo {Object}` - the queryInfo for the `pagination` object. Includes the `total` prop for server side pagination
- `pageInfo {Object}` - the pageInfo includes the queried ids and is necessary for server side pagination

## FeathersVuexGet

The `FeathersVuexGet` component allows fetching data from directly inside a template.  It makes the slot scope available to the child components.  Note that in `feathers-vuex@3.3.0` the component now includes support for `params` and `fetchParams` props.  These are meant to replace the `query` and `fetchQuery` props.  The `params` allow you, for example, to configure a project to pass custom params to the server.  This would require use of custom hooks.

### Example

```html
<template>
  <FeathersVuexGet v-slot="{ item: user }" service="users" :id="id" :params="params" :watch="[id, params]">
      {{ user }}
  </FeathersVuexGet>
</template>

<script>
export default {
  name: 'UserProfile',
  computed: {
    id() {
      return this.$route.params.id
    },
    params() {
      return {
        $populateParams: {
          name: 'withFollowers'
        }
      }
    }
  }
}
</script>
```

### Props

- `service {String}` - **required** the service path. This must match a service that has already been registered with FeathersVuex.
- `id {Number|String}` - when performing a `get` request, serves as the id for the request. This is automatically watched, so if the `id` changes, an API request will be made and the data will be updated.  **Default: undefined**
- `query {Object}` <Badge text="deprecated" type="warning"/> **use `params` instead** - the query object. If only the `query` attribute is provided, the same query will be used for both the `get` getter and the `get` action. See the `fetchQuery` attribute for more information. When using server-side pagination, use the `fetchQuery` prop and the `query` prop for querying data from the local store. If the query is `null` or `undefined`, the query against both the API and store will be skipped. The find getter will return an empty array.
- `watch {String|Array}` - specify the attributes of the `params` or `fetchParams` to watch. Pass 'params' to watch the entire params object. Pass 'params.query.name' to watch the 'name' property of the query. Watch is turned off by default, so the API server will only be queried once, by default.  The only exception is for the `id` prop.  The `id` prop in the `FeathersVuexGet` component is always watched.  **Default: []**
- `fetchQuery {Object}` <Badge text="deprecated" type="warning"/> **use `fetchParams` instead** - when provided, the `fetchQuery` serves as the query for the API server. The `query` param will be used against the service's local Vuex store. **Default: undefined**
- `params {Object}` - the params object. If only the `params` attribute is provided, te same params will be used for both the `get` getter and the `get` action. See the `fetchParams` attribute for more information.
- `fetchParams {Object}` - when provided, the `fetchParams` servers as the params for the API server. The `params` will be used against the service's local Vuex store.
- `queryWhen {Boolean|Function}` - the query to the server will only be made when this evaluates to true.  **Default: true**
- `local {Boolean}`: when set to true, will only use the `params` prop to get data from the local Vuex store. It will disable queries to the API server. **Default:false**
- `editScope {Function}` - a utility function that allows you to modify the scope data, and even add attributes to it, before providing it to the default slot. You can also use it to pull data into the current component's data (though that may be less recommended, it can come in handy).  See the "Scope Data" section to learn more about what props are available in the scope object. **Default: scope => scope**

### Scope Data

- `item {Object}` - The resulting record for the get operation.
- `isGetPending {Boolean}` - When there's an active request to the API server, this will be `true`.  This is not the same as the `isGetPending` from the Vuex state.  The value in the Vuex state is `true` whenever **any** component is querying data from that same service.  This `isGetPending` attribute is specific to each component instance.

## FeathersVuexCount <Badge text="3.11.0+" />

The `FeathersVuexCount` component allows displaying a count of records. It makes the slot scope available to the child components. It adds `$limit: 0` to the passed params in the background. This will only run a (fast) counting query against the database.

> **Note:** it only works for services with enabled pagination!

```vue
<FeathersVuexCount v-slot="{ total }" service="users">
  <section>
    {{users}}
  </section>
</FeathersVuexCount>
```

### Props

- `service {String}` - The path of the service
- `params {Object}` - The params object passed to the `count` getter/action.
- `fetchParams {Object}` - A seperate params object for the `count` action
- `queryWhen {Boolean|Function(params)}` - the query to the server will only be made when this evaluates to true.  **Default: true**
- `watch {String|Array}` - specify the attributes of the `params` or `fetchParams` to watch. Pass 'params' to watch the entire params object. Pass 'params.query.name' to watch the 'name' property of the query. Watch is turned off by default, so the API server will only be queried once, by default. **Default: []**
- `local {Boolean}`: when set to true, will only use the `params` prop to get data from the local Vuex store. It will disable queries to the API server. **Default:false**

### Scope Data

- `total {Number}` - The number of found records.
- `isCountPending {Boolean}` - When there's an active request to the API server, this will be `true`.

## A note about the internal architecture

These components use Vuex getters (to query data from the local store) and actions (to query data from the API server).  When a `params` or `id` is provided, the components pull data from the API server and put it into the store. That same `params` or `id` is then used to pull data from the local Vuex store. Keep this in mind, especially when attempting to use server-side pagination. To use server-side pagination, use the `params` prop for pulling data from the local vuex store, then use the `fetchParams` prop to retrieve data from the API server.

## Registering the components

These components are automatically registered globally when using the Feathers-Vuex Vue plugin.

If you prefer to manually register the component, pass `{ components: false }` as options when using the FeathersVuex Vue plugin, then do the following:

```js
import { FeathersVuexFind, FeathersVuexGet, FeathersVuexCount } from 'feathers-vuex'

// in your component
components: {
  FeathersVuexFind,
  FeathersVuexGet,
  FeathersVuexCount
}

// or globally registered
Vue.component('FeathersVuexFind', FeathersVuexFind)
Vue.component('FeathersVuexGet', FeathersVuexGet)
Vue.component('FeathersVuexCount', FeathersVuexCount)
```

## Scope Data

When using these components, the scope data will become available to the `FeathersVuexFind` or `FeathersVuexGet` tags. It's accessible using the `v-slot="props"` attribute:

```html
<FeathersVuexFind v-slot="props" service="categories" :params="{ query: {} }">
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

By default, the following props are available in the scope data:

It's also possible to modify the scope data by passing a function as the `edit-scope` prop. See the example for [modifying scope data](#Modify-the-scope-data)

### Destructuring props

Use the object destructuring syntax to pull specific variables out of the `v-slot` object.  In the following example, instead of using `v-slot="props"`, it directly accesses the `items` prop through destructuring:

```html
<FeathersVuexFind v-slot="{ items }" service="categories" :params="{ query: {} }">
  <div>
    {{items}}
  </div>
</FeathersVuexFind>
```

### Renaming props with destructuring

You can also rename scope props through the Object destructuring syntax.  The  `v-slot` in the next example shows how to give the items a more-descriptive name:

```html
<FeathersVuexFind v-slot="{ items: categories } service="categories" :params="{ query: {} }"">
  <div>
    {{categories}}
  </div>
</FeathersVuexFind>
```

## Usage Examples

### A basic find all

In this example, only the `service` attribute is provided. There is no `query` nor `id` provided, so no queries are made. So `props.items` in this example returns an empty array.

```html
<FeathersVuexFind v-slot="props" service="todos">
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

### Fetch data from the API and the same data from the Vuex store

This example fetches data from the API server because a query was provided.  Internally, this same `query` is used for both the `find` action and the `find` getter.  Read other examples to see how to use distinct queries.  Be aware that if you use pagination directives like `$skip` or `$limit`, you must use two queries to get the records you desire.

```html
<FeathersVuexFind v-slot="props" service="todos" :params="{ query: {} }">
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

### Only get data from the local Vuex store

If you've already pulled a bunch of data from the server, you can use the `local` prop to only query the local data:

```html
<FeathersVuexFind v-slot="props" service="todos" :params="{ query: {} }" local>
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

### Watch the query and re-fetch from the API

Sometimes you want to query new data from the server whenever the query changes.  Pass an array of attribute names to the `watch` attribute re-query whenever upon change.  This example watches the entire query object:

```html
<FeathersVuexFind
  v-slot="props"
  service="todos"
  :params="{ query: { isComplete: true } }"
  watch="params"
>
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

This next example watches a single prop from the query:

```html
<FeathersVuexFind
  v-slot="props"
  service="todos"
  :params="{ query: { isComplete: true, dueDate: 'today' } }"
  watch="params.query.dueDate"
>
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

You can also provide an array of strings to watch multiple properties:

```html
<FeathersVuexFind
  v-slot="props"
  service="dogs"
  :params="{ query: { breed: 'mixed', bites: true, hasWorms: false }}"
  :watch="['params.query.breed', 'params.query.bites']"
>
  <div>
    {{props.items}}
  </div>
</FeathersVuexFind>
```

### Use a distinct `params` and `fetchParams`

In this scenario, the `fetchParams` is be used to grab a larger dataset from the API server (all todos with a matching `userId`). The `params` is used by the `find` getter to display a subset of this data from the store.  If the `isComplete` attribute gets set to `true`, only completed todos will be displayed.  Since a `fetchParams` is provided, the `watch` strings will be modified internally to watch the `fetchParams` object.  This means if you are watching `params.query.userId` and you add a `fetchParams`, the component is smart enough to know you meant `fetchParams.query.userId`. You don't have to rewrite your `watch` attribute after adding a `fetchParams` prop.

```html
<template>
  <FeathersVuexFind
    v-slot="{ items: todos }"
    service="todos"
    :params="{ query: { isComplete } }"
    :fetch-params="{ query: { userId } }"
    watch="params.query.userId"
  >
    <div>
      {{todos}}
    </div>
  </FeathersVuexFind>
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
  <FeathersVuexFind
    v-slot="{ parentCategories, categoriesByParent }"
    service="categories"
    :params="{ query: {} }"
    :edit-scope="prepareCategories"
  >
    <ul>
      <li v-for="parent in parentCategories" :key="parent._id">
        <p>{{parent.name}}</p>
        <ul>
          <li v-for="child in categoriesByParent[parent.path]" :key="child._id">
            {{child.name}}
          </li>
        </ul>
      </li>
    </ul>
  </FeathersVuexFind>
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

### server-side pagination

When you want to use server-side pagination you need to pass the ids from the server to vuex. It can be done by a combination of `params`, `fetchParams` and `editScope` as described below. The `fetchParams`-prop is only computed after items from the server arrived. The ids for the `find` getter as well as the total amount of available values `total` are extracted by the `edit-scope` function and stored in `data`:

```html
<template>
  <FeathersVuexFind
    v-slot="{ items: todos }"
    :service="service"
    :params="internalParams"
    :fetch-params="fetchParams"
    :edit-scope="getPaginationInfo"
  >
    <div>
      {{todos}}
    </div>
  </FeathersVuexFind>
</template>

<script>
export default {
  data() {
    return {
      service: 'users',
      ids: [],
      params: {
        query: {
          isComplete: true
        },
      },
      total: 0,
      limit: 10,
      skip: 0
    };
  },
  computed: {
    internalParams() {
      const { idField } = this.$store.state[this.service];
      return {
        query: {
          [idField]: {
            $in: this.ids
          }
        }
      };
    },
    fetchParams() {
      const query = Object.assign({}, this.params.query, { $limit: this.limit, $skip: this.skip });

      return Object.assign({}, this.params, { query });
    }
  },
  methods: {
    getPaginationInfo (scope) {
      const { queryInfo, pageInfo } = scope;

      this.total = queryInfo.total;
      if (pageInfo && pageInfo.ids) {
        this.ids = pageInfo.ids;
      }
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

    <FeathersVuexFind
      v-slot="{ items: users, isFindPending: areUsersLoading }"
      service="users"
      :params="usersParams"
      watch="params"
      :queryWhen="userSearch.length > 2"
    >
      <ul :class="[ areUsersLoading && 'is-loading' ]">
        <li v-for="user in users" :key="user._id">
          {{user.email}}
        </li>
      </ul>
    </FeathersVuexFind>
  </div>
</template>

<script>
export default {
  data: () => ({
    userSearch: ''
  }),
  computed: {
    usersParams () {
      return {
        query: {
          email: { $regex: this.userSearch, $options: 'igm' },
          $sort: { email: 1 }
        }
      }
    }
  }
}
</script>
```

### Use a get request

You can perform `get` requests with the `FeathersVuexGet` component and its `id` property.  In the next example, when the `selectedUserId` changes, a get request will automatically fetch and display the matching user record.  It also shows how to use the `isGetPending` prop to update the UI

```html
<FeathersVuexGet
  v-slot="{ item: currentUser, isGetPending }"
  service="todos"
  :id="selectedUserId"
>
  <div>
    <div v-if="isGetPending" class="loading"> loading... </div>
    {{currentUser}}
  </div>
</FeathersVuexGet>
```
