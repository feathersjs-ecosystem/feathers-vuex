<template>
  <h1>{{ msg }}</h1>
  <button @click="count++">count is: {{ count }}</button>
  <p>Edit <code>components/HelloWorld.vue</code> to test hot module replacement.</p>

  <CreateTask />

  <table v-if="tasks.length">
    <tr v-for="task in tasks" :key="task._id">
      <td>{{ task.description }}</td>
      <td>{{ task.isComplete ? 'Complete' : '' }}</td>
      <td>
        <button type="button" @click="task.remove">Delete</button>
      </td>
    </tr>
  </table>

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
