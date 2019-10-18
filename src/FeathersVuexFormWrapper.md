<!-- markdownlint-disable MD002 MD033 MD041 -->
# FeathersVuexFormWrapper

```html
<FeathersVuexFormWrapper :item="currentItem" watch>
  <template v-slot="{ clone, save, reset, remove }">
    <WrappedComponent
      :item="clone"
      @save="save()"
      @reset="reset"
      @remove="remove"
    ></WrappedComponent>
  </template>
</FeathersVuexFormWrapper>
```
