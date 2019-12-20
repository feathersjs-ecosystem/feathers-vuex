---
title: Composition API
sidebarDepth: 3
---

# Feathers-Vuex Composition API <Badge text="3.0.0+" />

In addition to the Renderless Components and the Mixins, Feathers-Vuex includes utilities that let you take advantage of the [Vue Composition API](https://github.com/vuejs/composition-api).

## Setup

Before you can use the `useFind` and `useGet` composition functions, you'll need to [install the Vue Composition API](https://github.com/vuejs/composition-api#Installation) plugin.

## Detour: Reading a TypeScript interface

The next few sections show various TypeScript interfaces, which are basically shorthand descriptions of the types of data that make up a variable.  In this case, they're used to show the `options` object which can be passed to each of the composition api utilities.  If this is your first time with interfaces, here's a quick primer as an alternative to reading the [TypeScript interface docs](https://www.typescriptlang.org/docs/handbook/interfaces.html):

- In the [first interface example](#options), below, `UseFindOptions` is the name of the interface, similar to naming any other variable.  When using TypeScript, you can import and pass them around like variables.
- Each line of the interface describes a property.
- The part before the `:` is the name of the property.
- The part after the `:` describes what type of variable it can be.
- You can look at any `|` after the `:` as a conditional "or"
- Any property followed by a `?` is optional.
- Any property not followed by a `?` is required.

## useFind <Badge text="3.0.0+" />

The `useFind` utility reduces boilerplate for querying with fall-through cache and realtime updates.  To get started with it you provide a `model` class and a computed `params` object.

Let's use the example of creating a User Guide, where we need to pull in the various `Tutorial` records from our `tutorials` service.  We'll keep it simple in the template and just show a list of the names.

```html
<template>
  <div>
    <li v-for="tutorial in tutorials" :key="tutorial._id">
      {{ tutorial.name }}
    </li>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind } from 'feathers-vuex'

export default {
  name: 'UserGuide',
  setup(props, context) {
    // 1. Get a reference to the model class
    const { Tutorial } = context.root.$FeathersVuex.api

    // 2. Create a computed property for the params
    const tutorialsParams = computed(() => {
      return {
        query: {}
      }
    })
    // 3. Provide the model and params in the options
    const tutorialsData = useFind({ model: Tutorial, params: tutorialsParams })

    // 4. Return the data, named as you prefer
    return {
      tutorials: tutorialsData.items
    }
  }
}
</script>
```

Let's review each of the numbered comments, above:

1. Get a reference to the model class.  With the Vue Composition API, there's no `this` object.  It has been replaced by the context object.  So, only when using the composition API, the `$FeathersVuex` object is found at `context.root.$FeathersVuex`
2. Create a computed property for the params. Return an object with a `query` object.

### Options

Since we learned earlier [how to read a TypeScript interface](#detour-reading-a-typescript-interface), let's look at the TypeScript definition for the `UseFindOptions` interface.

```ts
interface UseFindOptions {
  model: Function
  params: Params | Ref<Params>
  fetchParams?: Params | Ref<Params>
  queryWhen?: Ref<Function>
  qid?: string
  lazy?: boolean
}
```

And here's a look at each individual property:

- `model` must be a Feathers-Vuex Model class. The Model's `find` and `findInStore` methods are used to query data.
- `params` is a FeathersJS Params object OR a Composition API `ref` (or `computed`, since they return a `ref` instance) which returns a Params object.
  - When provided alone (without the optional `fetchParams`), this same query is used for both the local data store and the API requests.
  - Explicitly returning `null` will prevent an API request from being made.
  - You can use `params.qid` to dynamically specify the query identifier for any API request. The `qid` is used for tracking pagination data and enabling the fall-through cache across multiple queries.
  - Set `params.paginate` to `true` to turn off realtime updates for the results and defer pagination to the API server.  Pagination works the same as for the [makeFindMixin pagination](./mixins.html#pagination-with-fall-through-cacheing).
  - Set `params.debounce` to an integer and the API requests will automatically be debounced by that many milliseconds.  For example, setting `debounce: 1000` will assure that the API request will be made at most every 1 second.
  - Set `params.temps` to `true` to include temporary (local-only) items in the results. Temporary records are instances that have been created but not yet saved to the database.
- `fetchParams` This is a separate set of params that, when provided, will become the params sent to the API server.  The `params` will then only be used to query data from the local data store.
  - Explicitly returning `null` will prevent an API request from being made.
- `queryWhen` must be a `computed` property which returns a `boolean`. It provides a logical separation for preventing API requests *outside* of the `params`.
- `qid` allows you to specify a query identifier (used in the pagination data in the store).  This can also be set dynamically by returning a `qid` in the params.
- `lazy`, which is `false` by default, determines if the internal `watch` should fire immediately.  Set `lazy: true` and the query will not fire immediately.  It will only fire on subsequent changes to the params.

### Returned Attributes

Notice the `tutorialsData` in the previous example.  You can see that there's an `items` property, which is returned from the `setup` method as the `tutorials`.  There are many more attributes available in the object returned from `useFind`. We can learn more about the return values by looking at its TypeScript interface, below.

```ts
interface UseFindData {
  items: Ref<any>
  servicePath: Ref<string>
  isFindPending: Ref<boolean>
  haveBeenRequestedOnce: Ref<boolean>
  haveLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  qid: Ref<string>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  paginationData: Ref<object>
  error: Ref<Error>
  find: Function
}
```

Let's look at the functionality that each one provides:

- `items` is the list of results. By default, this list will be reactive, so if new items are created which match the query, they will show up in this list automagically.
- `servicePath` is the FeathersJS service path that is used by the current model. This is mostly only useful for debugging.
- `isFindPending` is a boolean that indicates if there is an active query.  It is set to `true` just before each outgoing request.  It is set to `false` after the response returns.  Bind to it in the UI to show an activity indicator to the user.
- `haveBeenRequestedOnce` is a boolean that is set to `true` immediately before the first query is sent out.  It remains true throughout the life of the component.  This comes in handy for first-load scenarios in the UI.
- `haveLoaded` is a boolean that is set to true after the first API response.  It remains `true` for the life of the component. This also comes in handy for first-load scenarios in the UI.
- `isLocal` is a boolean that is set to true if this data is local only.
- `qid` is currently the primary `qid` provided in params.  It might become more useful in the future.
- `debounceTime` is the current number of milliseconds used as the debounce interval.
- `latestQuery` is an object that holds the latest query information.  It populates after each successful API response. The information it contains can be used to pull data from the `paginationData`.
- `paginationData` is an object containing all of the pagination data for the current service.
- `error` is null until an API error occurs. The error object will be serialized into a plain object and available here.
- `find` is the find method used internally.  You can manually make API requests.  This is most useful for when you have `paginate: true` in the params.  You can manually query refreshed data from the server, when desired.

### Working with Refs

Pay special attention to the properties of type `Ref`, in the TypeScript interface, above.  Those properties are Vue Composition API `ref` instances.  This means that you need to reference their value by using `.value`.  In the next example the `completeTodos` and `incompleteTodos` are derived from the `todos`, using `todos.value`

```html
<template>
  <div>
    <li v-for="tutorial in tutorials" :key="tutorial._id">
      {{ tutorial.name }}
    </li>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind } from 'feathers-vuex'

export default {
  name: 'UserGuide',
  setup(props, context) {
    const { Todo } = context.root.$FeathersVuex.api

    const todosParams = computed(() => {
      return {
        query: {}
      }
    })
    const { items: todos } = useFind({ model: Todo, params: todosParams })
    // Notice the "todos.value"
    const completeTodos = todos.value.filter(todo => todo.isComplete)
    const incompleteTodos = todos.value.filter(todo => !todo.isComplete)

    return {
      todos,
      completeTodos,
      incompleteTodos
    }
  }
}
</script>
```

### Comparison to `makeFindMixin`
If you have already used the `makeFindMixin`, the `useFind` composition function will be very familiar, since it offers the same functionality in a more powerful way.  There are a few differences, though.

1. `useFind` is more TypeScript friendly. Since the mixins depended on adding dynamic attribute names that wouldn't overlap, TypeScript tooling and autocomplete weren't very effective.  The attributes returned from `useFind` are always consistent.
1. Instead of providing a service name, you provide a service Model from the `$FeathersVuex` Vue plugin.
1. The default behavior of `useFind` is to immediately query the API server. The `makeFindMixin`, by default, would wait until the watcher noticed the change.  This is to match the default behavior of `watch` in the Vue Composition API.  You can pass `{ lazy: true }` in the `useFind` options, which will be passed directly to the internal `watch` on the params.

Note that with the Vue Options API (aka the only way to write components in Vue 2.0) the models are found in `this.$FeathersVuex`.  With the Vue Composition API, this object is now at `context.root.$FeathersVuex`.

## useGet <Badge text="3.0.0+" />

The `useGet` Composition API utility provides the same fall-through cache functionality as `useFind`.  It has a slightly simpler API, only requiring a `model` and `id` instead of the `params` object.  Still, the `params` object can be used to send along additional query parameters in the request.  Below is an example of how you might use the `useGet` utility.

```html
<template>
  <div>
    <div v-if="post">{{ post.body }}</div>
    <div v-else-if="isPending">Loading</div>
    <div v-else>Post not found.</div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'BlogPostView',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Post } = context.root.$FeathersVuex.api

    // Get the patient record
    const { item: post, isPending } = useGet({
      model: Post,
      id: props.id
    })

    return {
      post,
      isPending
    }
  }
}
<script>
```

See the [Routing with useGet](#routing-with-useget) portion of the patterns section, below, to see how to hook up the above component to vue-router.

### Options

We learned earlier [how to read a TypeScript interface](#detour-reading-a-typescript-interface), so let's look at the TypeScript interface for the `UseGetOptions`.

```ts
interface UseGetOptions {
  model: Function
  id: null | string | number | Ref<null> | Ref<string> | Ref<number>
  params?: Params | Ref<Params>
  queryWhen?: Ref<Function>
  local?: boolean
  lazy?: boolean
}
```

And here's a look at each individual property:

- `model` must be a Feathers-Vuex Model class. The Model's `get` and `getFromStore` methods are used to query data.
- `id` must be a record's unique identifier (`id` or `_id`, usually) or a ref or computed property which returns one.
  - When the `id` changes, the API will be queried for the new record (unless `queryWhen` evaluates to `false`).
  - If the `id` is `null`, no query will be made.
- `params` is a FeathersJS Params object OR a Composition API `ref` (or `computed`, since they return a `ref` instance) which returns a Params object.
  - Unlike the `useFind` utility, `useGet` does not currently have built-in debouncing.
- `queryWhen` must be a `computed` property which returns a `boolean`. It provides a logical separation for preventing API requests apart from `null` in the `id`.
- `lazy`, which is `false` by default, determines if the internal `watch` should fire immediately.  Set `lazy: true` and the query will not fire immediately.  It will only fire on subsequent changes to the `id` or `params`.

### Returned Attributes

```ts
interface UseGetData {
  item: Ref<any>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  error: Ref<Error>
  get: Function
}
```

## Patterns & Examples

### Server-Side Pagination

Similar to what was introduced with the `makeFindMixin` in Feathers-Vuex 2.0, the `useFind` API supports server-side pagination.  It is enabled by passing `paginate: true` in the `params` (or the `fetchParams` if you're using separate queries).  For an overview of how it works, refer to the [makeFindMixin pagination docs](./mixins.html#pagination-with-fall-through-cacheing).

### Simultaneous Queries

Let's look at an example where we have two separate tables and we want live-queried lists for both of them.  This example will show a component for a doctor's office that pulls up a patient by `id` using `useGet` then retrieves all of the patient's `appointments` using `useFind`.

```html
<template>
  <div>
    <div>{{ patient.name }}</div>

    <li v-for="appointment in appointments" :key="appointment._id">
      {{ appointment.date }}
    </li>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'PatientAppointments',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Patient, Appointment } = context.root.$FeathersVuex.api

    // Get the patient record
    const { item: patient } = useGet({ model: Patient, id: props.id })

    // Get all of the appointments belonging to the current patient
    const appointmentsParams = computed(() => {
      return {
        query: {
          userId: props.id,
          $sort: { date: -1 }
        }
      }
    })
    const { items: appointments } = useFind({
      model: Appointment,
      params: appointmentsParams
    })

    return {
      patient,
      appointments
    }
  }
}
</script>
```

### Deferring Queries

In the previous example, the requests for the `patient` and `appointments` are made at the same time because the user's `id` is available, already.  What if we were required to load `appointments` after the `patient` record finished loading?  We could change the `appointmentsParams` to return `null` until the `patient` record becomes available, as shown in the following example:

```html
<template>
  <div>
    <div>{{ patient.name }}</div>

    <li v-for="appointment in appointments" :key="appointment._id">
      {{ appointment.date }}
    </li>

    <div v-if="!appointments.length && haveLoaded">
      No appointments have been scheduled for this patient.
    </div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'PatientAppointments',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Patient, Appointment } = context.root.$FeathersVuex.api

    // Get the patient record
    const { item: patient } = useGet({ model: Patient, id: props.id })

    // Get all of the appointments belonging to the current patient
    const appointmentsParams = computed(() => {
      // (1)
      if (!patient.value) {
        return null
      }
      // (2)
      return {
        query: {
          userId: patient.value._id,
          $sort: { date: -1 }
        }
      }
    })
    const { items: appointments, haveLoaded } = useFind({
      model: Appointment,
      params: appointmentsParams
    })

    return {
      patient,
      appointments,
      haveLoaded
    }
  }
}
</script>
```

Reviewing the above snippet, while there is no `patient` record, the `appointmentsParams` computed property returns `null` at comment `(1)`.  This will prevent any query from going out to the API server.

Once the `patient` has loaded, the full params object is returned at comment `(2)`.  This allows the `useFind` utility to make the request.

### Showing Loading State

This next example builds on the previous one and adds loading state for both the `patient` and the `appointments`.

```html
<template>
  <div>
    <div v-if="isPatientLoading">Loading</div>
    <div v-else>{{ patient.name }}</div>

    <li v-for="appointment in appointments" :key="appointment._id">
      {{ appointment.date }}
    </li>

    <div v-if="!appointments.length && haveLoaded">
      No appointments have been scheduled for this patient.
    </div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'PatientAppointments',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Patient, Appointment } = context.root.$FeathersVuex.api

    const {
      item: patient,
      isPending: isPatientLoading
    } = useGet({ model: Patient, id: props.id })

    const appointmentsParams = computed(() => {
      if (!patient.value) {
        return null
      }
      return {
        query: {
          userId: patient.value._id,
          $sort: { date: -1 }
        }
      }
    })
    const { items: appointments, haveLoaded } = useFind({
      model: Appointment,
      params: appointmentsParams
    })

    return {
      patient,
      isPatientLoading,
      appointments,
      haveLoaded
    }
  }
}
</script>
```

### Using queryWhen

The `queryWhen` option for both `useFind` and `useGet` comes in handy when you want to conditional prevent API queries.  One use case for this is to prevent extra queries by checking if an item already exists in the vuex store.  This next example shows how to stop the `get` request if you already have a patient record with the current `id`.

```html
<template>
  <div>
    <div v-if="isPatientLoading">Loading</div>
    <div v-else>{{ patient.name }}</div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'PatientInfo',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Patient } = context.root.$FeathersVuex.api

    const patientQueryWhen = computed(() => {
      return !Patient.getFromStore(props.id)
    })
    const { item: patient, isPending: isPatientLoading } = useGet({
      model: Patient,
      id: props.id,
      queryWhen: patientQueryWhen
    })

    return {
      patient,
      isPatientLoading
    }
  }
}
</script>
```

In the above example, the `patientQueryWhen` computed property will return `true` if we don't already have a `Patient` record in the store with the current `props.id`.  While you could also achieve similar results by performing this logic inside of a `params` computed property, the `queryWhen` option works great as a "master override" to prevent unneeded queries.

### Routing with useGet

Apps will commonly have one or more routes with an `:id` param.  This might be for viewing or editing data.  Vue Router has a feature that makes it easy to write reusable components without having to directly reference the `$route` object.  The key is to set the `props` attribute in a route definition to `true`.  Here's an example route:

```js
// router.js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      name: 'Post View',
      path: '/posts/:id',
      component: () =>
        import(/* webpackChunkName: "posts" */ './views/Post.vue'),
      props: true
    }
  ]
})
```

Now, the `Post.vue` file only requires to have a `prop` named `id`.  Vue Router will pass the params from the route as props to the component.  See the [first useGet example](#useget) for a component that would work with the above route.  The vue-router documentation has more information about [Passing Props to Route Components](https://router.vuejs.org/guide/essentials/passing-props.html#passing-props-to-route-components)

## Conventions for Development

### Params are Computed

You might notice throughout these docs that the params are consistently shown as `computed` properties.  For long-term maintainability, this is the recommended practice.

Computed properties are read-only, so you can't push changes into them. This encourages declarative programming.  Think of a declarative query as having all of the instructions it needs to pull in data from whatever sources are required to build the query object. Writing declarative params will assist you in avoiding complex conditional conflicts as queries become more complex.

In contrast, an imperatively-written query would be a reactive object that you directly modify.  Think of imperative as pushing information into the query.  eg: `params.query.user = props.userId`.  When you have a lot of imperative code pushing parameters into the query, it's really easy to create conflicting logic.  So, keep in mind that while Feathers-Vuex will definitely handle an imperative-style query, your code will likely be less maintainable over the long run.

### Naming Variables

Having a variable naming convention can really assist the developer onboarding process and long run ease of use.  Here are some guidelines that could prove useful while using the composition API utilities:

- Params for `useFind` result in a list of records, and should therefore indicate plurality.
- When used, params for `useGet` result in a single record, and should indicate singularity.

```js
import { computed } from '@vue/composition-api'
import { useFind, useGet } from 'feathers-vuex'

export default {
  name: 'MyComponent',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props, context) {
    const { Comment } = context.root.$FeathersVuex.api

    // Plural "comments" in the params for useFind
    const commentsParams = computed(() => {
      return { query: {} }
    })
    const commentsData = useFind({
      model: Comment,
      params: commentsParams
    })
    const { items: comments } = commentsData

    // Singular "comment" in the params for useGet
    const commentParams = computed(() => {
      return { query: {} }
    })
    const commentData = useGet({
      model: Comment,
      id: props.id,
      params: commentParams
    })
    const { item: comment } = commentData

    return {
      comments,
      comment
    }
  }
}
```

Variable naming becomes even more important when one service consumes the results of a previous service to make a query.

Note: the destructuring of `commentsData` and `commentData`, above, could happen on the same line as `useFind` and `useGet`, but it's a bit more clear in the example to split it into separate steps.  For users who are accustomed to destructuring, it makes perfect sense to do so:

```js
// Destructure and rename "item" to "comment" in the same line as the call to `useGet`
const { item: comment } = useGet({
  model: Comment,
  id: props.id,
  params: commentParams
})

return { comment }
```
