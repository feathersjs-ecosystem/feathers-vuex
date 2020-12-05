<template>
  <h1>{{ msg }}</h1>
  <button @click="count++">count is: {{ count }}</button>
  <p>Edit <code>components/HelloWorld.vue</code> to test hot module replacement.</p>

  <pre>{{ data }}</pre>
</template>

<script>
import { models, useFind } from '@feathersjs/vuex'
import { computed } from 'vue'

export default {
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  data() {
    return {
      count: 0,
    }
  },
  setup(props, context) {
    const params = computed(() => {
      return {
        query: {},
      }
    })
    const data = useFind({ model: models.api.Task, params })

    return { data }
  },
}
</script>
