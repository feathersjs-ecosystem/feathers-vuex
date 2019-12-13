---
title: Working with Forms
sidebarDepth: 3
---

# Working with Forms

The `FeathersVuexFormWrapper` is a renderless component which assists in connecting your feathers-vuex data to a form.  The next two sections review why it exists by looking at a couple of common patterns.  Proceed to the [FeathersVuexFormWrapper](#feathersvuexformwrapper) section to learn how to implement.

## The Mutation Multiplicity (anti) Pattern

When working with Vuex, it's considered an anti-pattern to modify store data directly.  Turn on Vuex strict mode, and it will throw an error every time you modify store data outside of a mutation.  In my experience, the most common (anti)pattern that beginners use to work around this "limitation" is to

1. Read data from the store and use it for display in the UI.
2. Create custom mutations intended to modify the data in specific ways.
3. Use the mutations wherever they apply (usually implemented as one mutation per form).

There are times when defining custom mutations is the most supportive pattern for the task, but I consider them to be more rare.  The above pattern can result in a huge number of mutations, extra lines of code, and increased long-term maintenance costs.

## The Clone and Commit Pattern

The "Clone and Commit" pattern provides an alternative to using a lot of mutations. This patterns looks more like this:

1. Read data from the store and use it for display in the UI.  (Same as above)
2. Create and modify a clone of the data.
3. Use a single mutation to commit the changes back to the original record in the store.

Send most edits through a single mutation can really simplify the way you work with Vuex data.  The Feathers-Vuex `BaseModel` class has `clone` and `commit` instance methods.  Those methods are used inside the FeathersVuexFormWrapper component.

## FeathersVuexFormWrapper

The `FeathersVuexFormWrapper` component uses the "clone and commit" pattern to connect a single record to a child form within its default slot.

```vue
<template>
  <FeathersVuexFormWrapper :item="currentItem" watch>
    <template v-slot="{ clone, save, reset, remove }">
      <SomeEditor
        :item="clone"
        @save="save().then(handleSaveResponse)"
        @reset="reset"
        @remove="remove"
      ></SomeEditor>
    </template>
  </FeathersVuexFormWrapper>
</template>

<script>

import { FeathersVuexFormWrapper } from 'feathers-vuex'

export default {
  name: 'MyComponent',
  components: { FeathersVuexFormWrapper },
  props: {
    currentItem: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleSaveReponse(savedItem) {
      console.log(savedItem) // The item returned from the API call
    }
  }
}
</script>
```

Here's another example of how you could use the form wrapper to both save the form and close a modal at the same time.  (The modal is not shown in the template markup.) Notice how the `@save` handler is an inline function that sets `isModalVisible` to false, then on a new line it calls save. This is handled perfectly by Vue.

```vue
<template>
  <FeathersVuexFormWrapper :item="currentItem" watch>
    <template v-slot="{ clone, save, reset, remove }">
      <SomeEditor
        :item="clone"
        @save="
          () => {
            isModalVisible = false
            save({ populateParams: {} })
          }
        "
        @reset="reset"
        @remove="remove"
      ></SomeEditor>
    </template>
  </FeathersVuexFormWrapper>
</template>

<script>

import { FeathersVuexFormWrapper } from 'feathers-vuex'

export default {
  name: 'MyComponent',
  components: { FeathersVuexFormWrapper },
  props: {
    currentItem: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    isModalVisible: true
  }),
  methods: {
    handleSaveReponse(savedItem) {
      console.log(savedItem) // The item returned from the API call
    }
  }
}
</script>
```
### Props

- `item`: {Object} a model instance from the Vuex store.
- `watch`: {Boolean|Array} when enabled, if the original record is updated, the data will be re-cloned.  The newly-cloned data will overwrite the `clone` data (in the slot scope).  Default: `false`.
- `eager`: {Boolean} While this is enabled, using the `save` method will first commit the result to the store then it will send a network request.  The UI display will update immediately, without waiting for any response from the API server.  Default: `true`.

### Slot Scope

The default slot contains only four attributes.  The `clone` data can be passed to the child component.  The `save`, `reset`, and `remove` are meant to be bound to events emitted from the child component.

- `clone`: {Object} The cloned record.  Each record in the store can have a single clone.  The clones are stored on the service's model class, by default.
- `save`: {Function} When called, it commits the data and saves the record (with eager updating, by default.  See the `eager` prop.)  The save method calls `instance.save()`, internally, so you can pass a params object, if needed.
- `reset`: {Function} When called, the clone data will be reset back to the data that is currently found in the store for the same record.
- `remove`: {Function} When called, it removes the record from the API server and the Vuex store.

## Example Usage: CRUD Form

### TodoView

It's a pretty common scenario to have the same form handle editing and creating data.  Below is a basic example of how you could use the FeathersVuexFormWrapper for this.  A few things to notice about the example:

1. It uses a `Todo` Model class to create and edit todos.  The `$FeathersVuex` object is available on `this` only when the [Feathers-Vuex Vue plugin](./vue-plugin.md) is used.
2. It assumes that you have a route setup with an `:id` parameter.
3. It assumes that the data has a MongoDB-style `_id` property, where an SQL-based service would probably use `id`.

```vue
<template>
  <FeathersVuexFormWrapper :item="item" watch>
    <template v-slot="{ clone, save, reset, remove }">
      <TodoEditor
        :item="clone"
        @save="save().then(handleSaveResponse)"
        @reset="reset"
        @remove="remove"
      ></TodoEditor>
    </template>
  </FeathersVuexFormWrapper>
</template>

<script>
import { FeathersVuexFormWrapper } from 'feathers-vuex'
import TodoEditor from './TodoEditor.vue'

export default {
  name: 'TodoView',
  components: {
    FeathersVuexFormWrapper,
    TodoEditor
  },
  props: {
    currentItem: {
      type: Object,
      required: true
    }
  },
  computed: {
    id() {
      return this.$route.params.id
    },
    // Returns a new Todo if the route `id` is 'new', or returns an existing Todo.
    item() {
      const { Todo } = this.$FeathersVuex.api

      return this.id === 'new' ? new Todo() : Todo.getFromStore(this.id)
    },
  },
  watch: {
    id: {
      handler(val) {
        // Early return if the route `:id` is 'new'
        if (val === 'new') {
          return
        }
        const { Todo } = this.$FeathersVuex.api
        const existingRecord = Todo.getFromStore(val)

        // If the record doesn't exist, fetch it from the API server
        // The `item` getter will automatically update after the data arrives.
        if (!existingRecord) {
          Todo.get(val)
        }
      },
      // We want the above handler handler to run immediately when the component is created.
      immediate: true
    }
  },
  methods: {
    handleSaveReponse(savedTodo) {
      // Redirect to the newly-saved item
      if (this.id === 'new') {
        this.$router.push({ params: { id: savedTodo._id } })
      }
    }
  }
}
</script>
```


### TodoEditor

Next let's look at a minimal example of a 'TodoEditor' component which is a child of the `FeathersVuexFormWrapper` in the above example.  A few things to notice about the below `TodoEditor` component:

1. It's minimal on purpose to show you the important parts of working with the `FeathersVuexFormWrapper`.
1. It emits the `save`, `reset`, and `remove` events, which are connected to the `FeathersVuexFormWrapper` in the above code snippet.
1. It's not styled to keep it simple.  You'll probably want to add some styles.  ;)
1. The Delete button immediately emits remove, so the instance will be deleted immediately.  You probably want, instead, to show a prompt or confirmation dialog to ask the user to confirm deletion.
1. This is HTML, so the button `type` is important.  If you forget to add `type="button"` to a button, it will default to `type="submit"`.  Clicking the button would submit the form and call the `@submit.prevent` handler on the `<form>` element.  This even applies to buttons inside child components of the form.  You definitely want to remember to put `type` attributes on all of your buttons.

```vue
<template>
  <form @submit.prevent="$emit('save')">
    <input type="checkbox" v-model="item.isComplete" />
    <input type="text" v-model="item.description" />

    <!-- Submits the form, see the @submit handler, above -->
    <button type="submit">Save</button>

    <!-- Emitting reset will restore the item back to the stored version. -->
    <button type="button" @click="$emit('reset')>Reset</button>

    <!-- Delete's the instance -->
    <button type="button" @click="$emit('remove')>Delete</button>
  </form>
</template>

<script>
export default {
  name: 'TodoEditor',
  props: {
    item: {
      type: Object,
      required: true
    }
  }
}
</script>
```
