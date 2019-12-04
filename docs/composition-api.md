---
title: Composition API
---

# FeathersVuex Composition API <Badge text="3.0.0+" />

In addition to the Renderless Components and the Mixins, Feathers-Vuex includes utilities that let you take advantage of the [Vue Composition API](https://github.com/vuejs/composition-api).

## Setup

Before you can use the `useFind` and `useGet` composition functions, you'll need to [install the Vue Composition API](https://github.com/vuejs/composition-api#Installation) plugin.

## useFind <Badge text="3.0.0+" />

If you have already used the `makeFindMixin`, the `useFind` composition function will be very familiar, since it offers the same functionality in a more powerful way.  The main difference is that instead of providing a service name, you provide a service Model from the `$FeathersVuex` Vue plugin.  Note that when using the component object syntax (aka the way components are made with Vue 2.0) the models are found in `this.$FeathersVuex`.  When using the Vue composition API, this object is now found in `context.root.$FeathersVuex`, as shown in the following example:

```html
<template>
  <div>
    <pre> {{ todos }} </pre>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import { useFind } from 'feathers-vuex'

export default {
  name: 'UserGuide',
  setup(props, context) {
    // Get a reference to the desired Model class.
    const { Todo } = context.root.$FeathersVuex.spark

    // Setup params with a query
    const todosParams = computed(() => {
      return {
        query: { isComplete: false }
      }
    })

    // Provide the model and params to the useFind utility
    const { todos } = useFind({ model: Todo, params: todosParams })

    return { todos }
  }
}
</script>

<style lang="postcss"></style>
```

Notice in the above example that the params are provided as a computed property.  For long-term maintainability, this is the recommended practice.  It encourages you to think about your queries declaratively.  Think of a declarative query as having all of the instructions it needs to pull in data from whatever sources are required to build the query object. Declaratively written queries will likely assist you in avoiding conflicting code as conditions for making queries become more complex.

In contrast, an imperatively-written query would be a reactive object that you directly modify.  Think of imperative as pushing information into the query.  eg: `params.query.user = props.userId`.  When you have a lot of imperative code pushing parameters into the query, it's really easy to create conflicting logic.  So keep in mind that while Feathers-Vuex will definitely handle an imperative-style query, your code will probably be less maintainable over the long run.

## useGet <Badge text="3.0.0+" />

The `useGet` utility is still being built.  Docs will be written when it becomes more complete.