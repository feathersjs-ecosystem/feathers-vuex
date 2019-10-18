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

```html
<FeathersVuexFormWrapper :item="currentItem" watch>
  <template v-slot="{ clone, save, reset, remove }">
    <SomeEditor
      :item="clone"
      @save="save"
      @reset="reset"
      @remove="remove"
    ></SomeEditor>
  </template>
</FeathersVuexFormWrapper>
```

### Props

- `item`: {Object} a model instance from the Vuex store.
- `watch`: {Boolean|Array} when enabled, if the original record is updated, the data will be re-cloned.  The newly-cloned data will overwrite the `clone` data (in the slot scope).  Default: `false`.
- `eager`: {Boolean} While this is enabled, using the `save` method will first commit the result to the store then it will send a network request.  The UI display will update immediately, without waiting for any response from the API server.  Default: `true`.

### Slot Scope

The default slot contains only four attributes.  The `clone` data can be passed to the child component.  The `save`, `reset`, and `remove` are meant to be bound to events emitted from the child component.

- `clone`: {Object} The cloned record.  Each record in the store can have a single clone.  The clones are stored on the service's model class, by default.
- `save`: {Function} When called, it commits the data and saves the record (with eager updating, by default.  See the `eager` prop.).
- `reset`: {Function} When called, the clone data will be reset back to the data that is currently found in the store for the same record.
- `remove`: {Function} When called, it removes the record from the API server and the Vuex store.