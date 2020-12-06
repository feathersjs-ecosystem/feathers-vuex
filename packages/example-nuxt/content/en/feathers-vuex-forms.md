---
title: Working with Forms
description: ''
position: 2
---

# Working with Forms

The `FeathersVuexFormWrapper` and `FeathersVuexInputWrapper` are renderless components which assist in connecting your feathers-vuex data to a form. The next two sections review why they exist by looking at a couple of common patterns. Proceed to the [FeathersVuexFormWrapper](#feathersvuexformwrapper) or [FeathersVuexInputWrapper](#feathersvuexinputwrapper) sections to learn how to implement.

## The Mutation Multiplicity (anti) Pattern

When working with Vuex, it's considered an anti-pattern to modify store data directly. Turn on Vuex strict mode, and it will throw an error every time you modify store data outside of a mutation. In my experience, the most common (anti)pattern that beginners use to work around this "limitation" is to

1. Read data from the store and use it for display in the UI.
2. Create custom mutations intended to modify the data in specific ways.
3. Use the mutations wherever they apply (usually implemented as one mutation per form).

There are times when defining custom mutations is the most supportive pattern for the task, but I consider them to be more rare. The above pattern can result in a huge number of mutations, extra lines of code, and increased long-term maintenance costs.

## The Clone and Commit Pattern

The "Clone and Commit" pattern provides an alternative to using a lot of mutations. This patterns looks more like this:

1. Read data from the store and use it for display in the UI. (Same as above)
2. Create and modify a clone of the data.
3. Use a single mutation to commit the changes back to the original record in the store.

Sending most edits through a single mutation can really simplify the way you work with Vuex data. The Feathers-Vuex `BaseModel` class has `clone` and `commit` instance methods. These methods provide a clean API for working with items in the Vuex store and supporting Vuex strict mode:

```js
import { models } from 'feathers-vuex'

export default {
  name: 'MyComponent',
  created() {
    const { Todo } = models.api

    const todo = new Todo({
      description: 'Plant the garden',
      isComplete: false
    })

    const todoClone = todo.clone()
    todoClone.description = 'Plant half of the garden."
    todoClone.commit()
  }
}
```

In the example above, modifying the `todo` variable would directly modify part of the Vuex store outside of a mutation (also known as a reducer in Redux), which is a generally unsupportive practice. Calling `todo.clone()` returns a reactive clone of the instance and keeps it outside the Vuex store. This means you can make changes to it all you want without causing any trouble with Vuex. You can then call `todoClone.commit()` to update the original record in the store.

The `clone` and `commit` methods are used inside the FeathersVuexFormWrapper component.

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
      required: true,
    },
  },
  methods: {
    handleSaveReponse(savedItem) {
      console.log(savedItem) // The item returned from the API call
    },
  },
}
</script>
```

Here's another example of how you could use the form wrapper to both save the form and close a modal at the same time. (The modal is not shown in the template markup.) Notice how the `@save` handler is an inline function that sets `isModalVisible` to false, then on a new line it calls save. This is handled perfectly by Vue.

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
      required: true,
    },
  },
  data: () => ({
    isModalVisible: true,
  }),
  methods: {
    handleSaveReponse(savedItem) {
      console.log(savedItem) // The item returned from the API call
    },
  },
}
</script>
```

### Props

- `item`: {Object} a model instance from the Vuex store.
- `watch`: {Boolean|Array} when enabled, if the original record is updated, the data will be re-cloned. The newly-cloned data will overwrite the `clone` data (in the slot scope). Default: `false`.
- `eager`: {Boolean} While this is enabled, using the `save` method will first commit the result to the store then it will send a network request. The UI display will update immediately, without waiting for any response from the API server. Default: `true`.

### Slot Scope

The default slot contains only four attributes. The `clone` data can be passed to the child component. The `save`, `reset`, and `remove` are meant to be bound to events emitted from the child component.

- `clone`: {Object} The cloned record. Each record in the store can have a single clone. The clones are stored on the service's model class, by default.
- `save`: {Function} When called, it commits the data and saves the record (with eager updating, by default. See the `eager` prop.) The save method calls `instance.save()`, internally, so you can pass a params object, if needed.
- `reset`: {Function} When called, the clone data will be reset back to the data that is currently found in the store for the same record.
- `remove`: {Function} When called, it removes the record from the API server and the Vuex store.

### Usage with `diffOnPatch`

If you plan to use the `diffOnPatch` static Model method together with the `FeathersVuexFormWrapper`, be sure to set the `eager` prop to `false`. See [this GitHub issue](https://github.com/feathersjs-ecosystem/feathers-vuex/issues/520) for more details.

## FormWrapper Example: CRUD Form

### TodoView

It's a pretty common scenario to have the same form handle editing and creating data. Below is a basic example of how you could use the FeathersVuexFormWrapper for this. A few things to notice about the example:

1. It uses a `Todo` Model class to create and edit todos. The `$FeathersVuex` object is available on `this` only when the [Feathers-Vuex Vue plugin](./vue-plugin.md) is used.
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
    TodoEditor,
  },
  props: {
    currentItem: {
      type: Object,
      required: true,
    },
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
      immediate: true,
    },
  },
  methods: {
    handleSaveReponse(savedTodo) {
      // Redirect to the newly-saved item
      if (this.id === 'new') {
        this.$router.push({ params: { id: savedTodo._id } })
      }
    },
  },
}
</script>
```

### TodoEditor

Next let's look at a minimal example of a 'TodoEditor' component which is a child of the `FeathersVuexFormWrapper` in the above example. A few things to notice about the below `TodoEditor` component:

1. It's minimal on purpose to show you the important parts of working with the `FeathersVuexFormWrapper`.
1. It emits the `save`, `reset`, and `remove` events, which are connected to the `FeathersVuexFormWrapper` in the above code snippet.
1. It's not styled to keep it simple. You'll probably want to add some styles. ;)
1. The Delete button immediately emits remove, so the instance will be deleted immediately. You probably want, instead, to show a prompt or confirmation dialog to ask the user to confirm deletion.
1. This is HTML, so the button `type` is important. If you forget to add `type="button"` to a button, it will default to `type="submit"`. Clicking the button would submit the form and call the `@submit.prevent` handler on the `<form>` element. This even applies to buttons inside child components of the form. You definitely want to remember to put `type` attributes on all of your buttons.

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input type="checkbox" v-model="item.isComplete" />
    <input type="text" v-model="item.description" />

    <!-- Submits the form, see the @submit handler, above -->
    <button type="submit">Save</button>

    <!-- Emitting reset will restore the item back to the stored version. -->
    <button type="button" @click="$emit('reset')">Reset</button>

    <!-- Delete's the instance -->
    <button type="button" @click="$emit('remove')">Delete</button>
  </form>
</template>

<script>
export default {
  name: 'TodoEditor',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  setup(props, context) {
    function handleSubmit() {
      // This is a placeholder for checking form validity, (with Vuelidate, for example)
      const isValid = true || false

      if (formIsValid) {
        context.emit('save')
      } else {
        // Show any form errors in the UI.
      }
    }
    return { handleSubmit }
  },
}
</script>
```

### Vuelidate 2 Example

Here's an example of how you might use the upcoming Vuelidate 2 (which is being rewritten to work with the Vue Composition API) to do form validation. Just to be clear, the validation library you use doesn't change how FeathersVuex will work. Since Vuelidate is likely the most popular validation library, this is an example to get you started. There may be some things to figure out to implement your use case. First, you'll need to install these dependencies:

```json
{
  "dependencies": {
    "@vuelidate/core": "^2.0.0-alpha.0",
    "@vuelidate/validators": "^2.0.0-alpha.0"
  }
}
```

Here's the full example, complete with TailwindCSS styles.

```html
<template>
  <div class="permission-creator flex flex-row items-end">
    <!-- Org Selector -->
    <label class="block w-full">
      <span class="select-label text-gray-700">Add Organization</span>
      <XSelect
        v-model="selectedOrg"
        :items="filteredOrgs"
        :label="makeOrgLabel"
        clearable
        placeholder="Select an Organization"
        class="block"
        :input-class="[
          'x-select-button px-2 py-2 border rounded bg-white',
          $v.org.$dirty && $v.org.$invalid
            ? 'border-red-400'
            : 'border-gray-400'
        ]"
        @click="$v.org.$touch"
      />
    </label>

    <!-- Permission Selector -->
    <label class="block ml-0.5">
      <span class="select-label text-gray-700">Permission</span>
      <PermissionSelect v-model="selectedAccessType" />
    </label>

    <button class="form-button primary ml-0.5" :disabled="$v.$invalid" @click="validateAndCreate">
      Add
    </button>
  </div>
</template>

<script>
  import { XSelect } from '@rovit/x-select'
  import PermissionSelect from '../PermissionSelect/PermissionSelect'
  import { models, useFind } from 'feathers-vuex'
  import { computed, ref } from '@vue/composition-api'
  import keyBy from 'lodash/keyBy'
  import capitalize from 'voca/capitalize'
  import useVuelidate from '@vuelidate/core'
  import { required } from '@vuelidate/validators'

  export default {
    name: 'PermissionCreatorOrg',
    components: {
      XSelect,
      PermissionSelect,
    },
    props: {
      excludeIds: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, context) {
      const { Org } = models.api

      const selectedOrg = ref(null)
      const selectedAccessType = ref('view')

      // Fetch orgs
      const orgsParams = computed(() => {
        return { query: {} }
      })
      const { items: orgs } = useFind({ model: Org, params: orgsParams })

      const filteredOrgs = computed(() => {
        const excludeIds = keyBy(props.excludeIds)
        return orgs.value.filter(org => {
          return !excludeIds[org._id]
        })
      })

      const $v = useVuelidate(
        {
          org: { required, $autoDirty: true },
          accessType: { required, $autoDirty: true },
        },
        { org: selectedOrg, accessType: selectedAccessType }
      )

      function validateAndCreate() {
        const org = selectedOrg.value
        const accessType = selectedAccessType.value

        if (!$v.$invalid) context.emit('create', { org, accessType })

        selectedOrg.value = null
        selectedAccessType.value = 'view'

        // Not currently working, so the org select turns red after removal
        $v.org.$reset()
      }

      function makeOrgLabel(org) {
        let label = `${org.name}`
        if (org.nameOfOwner) {
          label += ` (${org.nameOfOwner})`
        }
        return label
      }

      return {
        selectedOrg,
        selectedAccessType,
        filteredOrgs,
        validateAndCreate,
        capitalize,
        $v,
        makeOrgLabel,
      }
    },
  }
</script>

<style lang="postcss"></style>
```

## FeathersVuexInputWrapper

Building on the same ideas as the FeathersVuexFormWrapper, the FeathersVuexInputWrapper reduces boilerplate for working with the clone and commit pattern on a single input. One use case for this component is implementing an "edit-in-place" workflow. The following example shows how to use the FeathersVuexInputWrapper to automatically save a record upon `blur` on a text input:

```html
<template>
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @focus="createClone"
          @blur="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <!-- Simple readout to show that it's working. -->
    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
</template>

<script>
  export default {
    name: 'InputWrapperExample',
    methods: {
      // Optionally make the event handler async.
      async save({ event, clone, prop, data }) {
        const user = clone.commit()
        return user.patch({ data })
      },
    },
  }
</script>
```

Notice that in the `save` handler in the above example, the `.patch` method is called on the user, passing in the data. Because the data contains only the user property which changed, the patch request will only send the data which has changed, saving precious bandwidth.

### Props

The `FeathersVuexInputWrapper` has two props, both of which are required:

- `item`: The original (non-cloned) model instance.
- `prop`: The property name on the model instance to be edited.

### Default Slot Scope

Only the default slot is used. The following props are available in the slot scope:

- `current {clone|instance}`: returns the clone if it exists, or the original record. `current = clone || item`
- `clone { clone }`: the internal clone. This is exposed for debugging purposes.
- `prop {String}`: the value of the `prop` prop. If you have the prop stored in a variable in the outer scope, this is redundant and not needed. You could just use this from the outer scope. It mostly comes in handy when you are manually specifying the `prop` name on the component.
- `createClone {Function}`: sets up the internal clone. Meant to be used as an event handler.
- `handler {Function}`: has the signature `handler(event, callback)`. It prepared data before calling the callback function that must be provided from the outer scope.

### The Callback Function

The `handler` function in the slot scope requires the use of a callback function as its second argument. Here's an example callback function followed by an explanation of its properties:

```js
myCallback({ event, clone, prop, data }) {
  clone.commit()
}
```

- `event {Event}`: the event which triggered the `handler` function in the slot scope.
- `clone {clone}`: the cloned version of the `item` instance that was provided as a prop.
- `prop {String}`: the name of the `prop` that is being edited (will always match the `prop` prop.)
- `data {Object}`: An object containing the changes that were made to the object. Useful for calling `.patch({ data })` on the original instance.

This callback needs to be customized to fit your business logic. You might patch the changes right away, as shown in this example callback function.

```js
async save({ event, clone, prop, data }) {
  const user = clone.commit()
  return user.patch({ data })
}
```

Notice in the example above that the `save` function is `async`. This means that it returns a promise, which in this case is the `user.patch` request. Internally, the `handler` method will automatically set the internal `clone` object to `null`, which will cause the `current` computed property to return the original instance.

Note that some types of HTML input elements will call `handler` repeatedly, so the handler needs to be debounced. See an example, below.

## InputWrapper Examples

### Text Input

With a text input, you can use the `focus` and `blur` events

```html
<template>
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @focus="createClone"
          @blur="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <!-- Simple readout to show that it's working. -->
    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
</template>

<script>
  export default {
    name: 'InputWrapperExample',
    props: {
      user: {
        type: Object,
        required: true,
      },
    },
    methods: {
      // The callback can be async
      async save({ event, clone, prop, data }) {
        const user = clone.commit()
        return user.patch({ data })
      },
    },
  }
</script>
```

### Color Input

Here is an example of using the FeathersVuexInputWrapper on a color input. Color inputs emit a lot of `input` and `change` events, so you'll probably want to debounce the callback function if you are going to immediately save changes. The example after this one shows how you might debounce.

```html
<template>
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @click="createClone"
          @change="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <!-- Simple readout to show that it's working. -->
    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
</template>

<script>
  export default {
    name: 'InputWrapperExample',
    props: {
      user: {
        type: Object,
        required: true,
      },
    },
    methods: {
      // The callback can be async
      async save({ event, clone, prop, data }) {
        const user = clone.commit()
        return user.patch({ data })
      },
    },
  }
</script>
```

### Color Input with Debounce

Here is an example of using the FeathersVuexInputWrapper on a color input. Notice how the debounced callback function is provided to the `handler`. This is because color inputs trigger a `change` event every time their value changes. To prevent sending thousands of patch requests as the user changes colors, we use the debounced function to only send a request after 100ms of inactivity.

Notice also that this example uses the Vue Composition API because creating a debounced function is much cleaner this way.

```vue
<template>
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @click="createClone"
          @change="e => handler(e, debouncedSave)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <!-- Simple readout to show that it's working. -->
    <pre class="bg-black text-white text-xs mt-2 p-1">{{ user }}</pre>
  </div>
</template>

<script>
import _debounce from 'lodash/debounce'

export default {
  name: 'InputWrapperExample',
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  setup() {
    // The original, non-debounced save function
    async function save({ event, clone, prop, data }) {
      const user = clone.commit()
      return user.patch({ data })
    }
    // The debounced wrapper around the save function
    const debouncedSave = _debounce(save, 100)

    // We only really need to provide the debouncedSave to the template.
    return { debouncedSave }
  },
}
</script>
```
