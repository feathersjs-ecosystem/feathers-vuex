---
title: Composition API
---

# FeathersVuex Composition API <Badge text="3.0.0+" />

In addition to the Renderless Components and the Mixins, Feathers-Vuex includes utilities that let you take advantage of the [Vue Composition API](https://github.com/vuejs/composition-api).

## Setup

Before you can use the `useFind` and `useGet` composition functions, you'll need to [install the Vue Composition API](https://github.com/vuejs/composition-api#Installation) plugin.

## useFind <Badge text="3.0.0+" />

The `useFind` utility reduces boilerplate for querying with fall-through cache and realtime updates.  To get started with it you provide a `model` class and a computed `params` object.  Let's use the example of creating a User Guide, where we need to pull in the various `Tutorial` records from our `tutorials` service.  We'll keep it simple in the template and just show a list of the names.  Assume that each `Tutorial` record has a `name` property.  We're not going to style any of this, so the `<style>` tags are removed from the examples.

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
    const { Tutorial } = context.root.$FeathersVuex.spark

    const tutorialsParams = computed(() => {
      return {
        query: { isComplete: false }
      }
    })
    const tutorialsData = useFind({ model: Tutorial, params: tutorialsParams })

    return {
      tutorials: tutorialsData.items
    }
  }
}
</script>
```

### Options

Let's look at the `UseFindOptions` TypeScript interface to see what else we can pass in the options.  If this is your first time, let's do a quick primer for the below interface as an alternative to reading the [TypeScript interface docs](https://www.typescriptlang.org/docs/handbook/interfaces.html):

- `UseFindOptions` is the name of the interface, similar to naming any other variable.
- Each line of the interface documents a property.
- The string before the `:` is the name of the property.
- Everything after the `:` describes what type of variable it is.
- You can look at any `|` after the `:` as a conditional "or"
- Any property not followed by a `?` is required.
- Any property followed by a `?` is optional.

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

Let's look at each one individually:

- `model` must be a Feathers-Vuex Model class. The Model's `find` and `findInStore` methods are used to query data.
- `params` is a FeathersJS Params object OR a Composition API `ref` (or `computed`, since they return a `ref` instance) which returns a Params object.
  - When provided alone (without the options `fetchParams`), this same query is used for both the local data store and the API requests.
  - Explicitly returning `null` will prevent an API request from being made.
  - You can use `params.qid` to dynamically specify the query identifier for any API request.
  - Set `params.paginate` to `true` to turn off realtime updates for the results and defer pagination to the API server.
  - Set `params.debounce` to an integer and the API requests will automatically be debounced by that many milliseconds.  For example, setting `debounce: 1000` will assure that the API request will be made at most every 1 second.
= `fetchParams` This is a separate set of params that, when provided, will become the params sent to the API server.  The `params` will then only be used to query data from the local data store.
  - Explicitly returning `null` will prevent an API request from being made.
- `queryWhen` must be a `computed` property which returns a `boolean`. It provides a logical separation for preventing API requests *outside* of the `params`.
- `qid` allows you to specify a query identifier (used in the pagination data in the store).  This can also be set dynamically by returning a `qid` in the params.
- `lazy`, which is `false` by default, determines if the internal `watch` should fire immediately.  Set `lazy: true` and the query will not fire immediately.  It will only fire on subsequent changes in the params.

### Returned Utilities

Notice the `tutorialsData` in the previous example.  You can see that there's an `items` property, which is returned from the `setup` method as the `tutorials`.  There are many more attributes available in the object returned from `useFind`. We can learn more about the return values by looking at its TypeScript interface, below.

```ts
interface UseFindData {
  items: Ref<any>
  servicePath: Ref<string>
  isFindPending: Ref<boolean>
  haveBeenRequestedOnce: Ref<boolean>
  haveLoadedOnce: Ref<boolean>
  isLocal: Ref<boolean>
  qid: Ref<string>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  paginationData: Ref<object>
  error: Ref<Error>
  find: Function
}
```

Let's look at at what functionality each provides:

- `items` is the list of results

### Renaming attributes

The `useFind` utility will always return an
They can be renamed in the same way that you would do it with any object.

### Compared to `makeFindMixin`
If you have already used the `makeFindMixin`, the `useFind` composition function will be very familiar, since it offers the same functionality in a more powerful way.  There are a few differences, though.

1. `useFind` is more TypeScript friendly. Since the mixins depended on adding dynamic attribute names that wouldn't overlap, TypeScript tooling and autocomplete weren't very effective.  The attributes returned from `useFind` are always consistent.
1. Instead of providing a service name, you provide a service Model from the `$FeathersVuex` Vue plugin.
1. The default behavior of `useFind` is to immediately query the API server. The `makeFindMixin`, by default, would wait until the watcher noticed the change.  This is to match the default behavior of `watch` in the Vue Composition API.  You can pass `{ lazy: true }` in the `useFind` options, which will be passed directly to the internal `watch` on the params.

Note that with the Vue Options API (aka the only way to write components in Vue 2.0) the models are found in `this.$FeathersVuex`.  With the Vue Composition API, this object is now at `context.root.$FeathersVuex`, as shown in the following example:

Notice in the above example that the params are provided as a computed property.  For long-term maintainability, this is the recommended practice.  It encourages you to think about your queries declaratively.  Think of a declarative query as having all of the instructions it needs to pull in data from whatever sources are required to build the query object. Declaratively written queries will likely assist you in avoiding conflicting code as conditions for making queries become more complex.

In contrast, an imperatively-written query would be a reactive object that you directly modify.  Think of imperative as pushing information into the query.  eg: `params.query.user = props.userId`.  When you have a lot of imperative code pushing parameters into the query, it's really easy to create conflicting logic.  So keep in mind that while Feathers-Vuex will definitely handle an imperative-style query, your code will probably be less maintainable over the long run.

## useGet <Badge text="3.0.0+" />

The `useGet` utility is still being built.  Docs will be written when it becomes more complete.