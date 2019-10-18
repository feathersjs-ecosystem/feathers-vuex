<!-- markdownlint-disable MD002 MD033 MD041 -->
# FeathersVuexFormWrapper

The `FeathersVuexFormWrapper` is a renderless component which assists in connecting your feathers-vuex data to a form.  Let's review why it exists by looking at a couple of common patterns.

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

## Usage

The `FeathersVuexFormWrapper` component uses the "clone and commit" pattern to connect a single record to a child form within its default slot.

```html
<FeathersVuexFormWrapper :item="currentItem" watch>
  <template v-slot="{ clone, save, reset, remove }">
    <SomeEditor
      :item="clone"
      @save="save()"
      @reset="reset"
      @remove="remove"
    ></SomeEditor>
  </template>
</FeathersVuexFormWrapper>
```
