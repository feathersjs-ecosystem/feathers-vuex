# Using Vuejs 3 setup()
Vuejs 3 introduced a new way of passing data from a parent to its child. This is valuable if the child is deep down the hierarchy chain. We want to include `FeathersVuex` in many child components. Through [Inject/Provide](https://v3.vuejs.org/guide/component-provide-inject.html#working-with-reactivity) we now have the ability to `inject` the `FeathersVuex`.`api` into our setup method.


## Setup() method
The context is no longer passed into the setup() as a parameter:

```
setup(props, context) {
    // old way
    const { User } = root.$FeathersVuex.api
}
```

We now must `inject` it into setup():

```
export default defineComponent({
    import { inject } from 'vue';

    setup() {
        // both $FeatherVuex and $fv work here
        const models: any = inject('$FeathersVuex')
        const newUser = new models.api.User()

        return {
            newUser
        }
    }
})
```

If an custom alias is desired, pass the `alias` into the module install as detailed [here](https://github.com/feathersjs-ecosystem/feathers-vuex/blob/vue-demi/packages/feathers-vuex-vue3/src/app-plugin.ts).

**Note:** You may auto import `inject` and other `vue` utilities using [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import). Make sure to adjust the `auto-import.d.ts` file to match your `include[]` directory (`src` for vue-cli generated apps)

