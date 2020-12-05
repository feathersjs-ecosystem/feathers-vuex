<template>
  <h1>{{ msg }}</h1>
  <button @click="count++">count is: {{ count }}</button>
  <p>Edit <code>components/HelloWorld.vue</code> to test hot module replacement.</p>

  <CreateTask />

  <ul v-if="tasks.length">
    <li v-for="task in tasks" :key="task._id" style="display: flex; flex-direction: row;">
      <div>{{ task.description }}</div>
      <div>{{ task.isComplete ? 'Complete' : '' }}</div>
    </li>
  </ul>

  <div v-else>No Tasks</div>
</template>

<script>
import { models, useFind } from '@feathersjs/vuex'
import { computed } from 'vue'

import CreateTask from './CreateTask.vue'

export default {
  name: 'HelloWorld',
  components: {
    CreateTask,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      count: 0,
    }
  },
  setup(props, context) {
    const { Task } = models.api
    const params = computed(() => {
      return {
        query: {},
      }
    })
    const { items: tasks } = useFind({ model: Task, params })

    return { tasks }
  },
}
</script>
